const Credit = require("../lib/models/credit");
const { Search, Lead } = require("../lib/models/search");
const { generateLeads, generateProspectEmail, generateAudiences } = require("../lib/services/leadGenerator");
const { requireAuth, handleCors } = require("../lib/auth");
const db = require("../lib/db");

module.exports.config = { maxDuration: 60 };

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  const user = await requireAuth(req, res);
  if (!user) return;
  const userId = Number(user.id);
  const action = req.query.action;

  // ─── POST generate ───
  if (action === "generate" && req.method === "POST") {
    const { industry, location, target, count: rawCount } = req.body;
    if (!industry?.trim()) return res.status(400).json({ error: "Secteur requis." });
    if (!location?.trim()) return res.status(400).json({ error: "Localisation requise." });
    const balance = await Credit.getBalance(userId);
    if (balance < 1) return res.status(429).json({ error: "Plus de crédits.", balance: 0 });
    const count = Math.min(parseInt(rawCount) || 10, 20, balance);

    try {
      // Step 1: Check the shared pool for matching leads
      const locationLower = location.toLowerCase().trim();
      const industryTerms = industry.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

      // Build LIKE clauses for industry matching
      const industryWhere = industryTerms.map((_, i) => `LOWER(industry) LIKE ?`).join(" OR ");
      const industryArgs = industryTerms.map(t => `%${t}%`);

      const poolResults = await db.execute({
        sql: `SELECT DISTINCT company, website, industry, location, description, size, 
              contact_name, contact_role, email, email_verified, phone, linkedin, score, reason
              FROM leads 
              WHERE (${industryWhere}) AND LOWER(location) LIKE ?
              ORDER BY score DESC LIMIT ?`,
        args: [...industryArgs, `%${locationLower}%`, count * 2],
      });

      // Step 2: Filter out leads this user already has
      const userExisting = await db.execute({
        sql: "SELECT company, email FROM leads WHERE user_id = ?",
        args: [userId],
      });
      const userCompanies = new Set(userExisting.rows.map(r => (r.company || "").toLowerCase()));
      const userEmails = new Set(userExisting.rows.filter(r => r.email).map(r => r.email.toLowerCase()));

      const poolLeads = poolResults.rows
        .filter(l => !userCompanies.has((l.company || "").toLowerCase()) && 
                     !(l.email && userEmails.has(l.email.toLowerCase())))
        .slice(0, count)
        .map(l => ({
          company: l.company, website: l.website, industry: l.industry,
          location: l.location, description: l.description, size: l.size,
          contact_name: l.contact_name, contact_role: l.contact_role,
          email: l.email, email_verified: !!l.email_verified,
          phone: l.phone, linkedin: l.linkedin,
          score: l.score, reason: l.reason,
          is_duplicate: false, from_pool: true,
        }));

      const poolCount = poolLeads.length;
      const remaining = count - poolCount;
      let aiLeads = [];

      // Step 3: If we need more, call the AI
      if (remaining > 0) {
        const excludeNames = [...userCompanies, ...poolLeads.map(l => l.company.toLowerCase())];
        const raw = await generateLeads({ industry, location, target, count: remaining });

        // Dedup AI results against pool + user existing
        const allKnown = new Set([...excludeNames]);
        aiLeads = raw
          .filter(l => {
            const key = (l.company || "").toLowerCase();
            if (allKnown.has(key)) return false;
            allKnown.add(key);
            return true;
          })
          .map(l => ({ ...l, is_duplicate: false, from_pool: false }));
      }

      const allLeads = [...poolLeads, ...aiLeads];

      // Step 4: Save everything
      const searchId = await Search.create(userId, { industry, location, target, leadCount: allLeads.length });
      if (allLeads.length > 0) await Lead.createBulk(searchId, userId, allLeads);

      // Charge only for new AI leads (pool leads are free or half-price)
      const aiCount = aiLeads.length;
      const chargeAmount = Math.max(1, Math.ceil(poolCount * 0.5) + aiCount);
      await Credit.consume(userId, Math.min(chargeAmount, allLeads.length));
      const newBalance = await Credit.getBalance(userId);

      res.json({
        search_id: searchId,
        leads: allLeads,
        meta: {
          industry, location, target: target || null,
          count: allLeads.length,
          from_pool: poolCount,
          from_ai: aiCount,
          new_count: allLeads.length,
          duplicate_count: 0,
        },
        balance: newBalance,
      });
    } catch (err) { console.error(err); res.status(500).json({ error: err.message || "Erreur génération." }); }
    return;
  }

  // ─── POST generate-audiences ───
  if (action === "generate-audiences" && req.method === "POST") {
    const { industry, location, target, count: rawCount } = req.body;
    if (!industry?.trim()) return res.status(400).json({ error: "Secteur requis." });
    if (!location?.trim()) return res.status(400).json({ error: "Localisation requise." });
    const balance = await Credit.getBalance(userId);
    if (balance < 1) return res.status(429).json({ error: "Plus de crédits.", balance: 0 });
    const count = Math.min(parseInt(rawCount) || 10, 20, balance);
    try {
      const audiences = await generateAudiences({ industry, location, target, count });
      await Credit.consume(userId, Math.ceil(audiences.length / 2));
      const newBalance = await Credit.getBalance(userId);
      res.json({ audiences, meta: { industry, location, target: target || null, count: audiences.length }, balance: newBalance });
    } catch (err) { console.error(err); res.status(500).json({ error: err.message || "Erreur." }); }
    return;
  }

  // ─── POST generate-email ───
  if (action === "generate-email" && req.method === "POST") {
    const { lead, userCompany, userActivity } = req.body;
    if (!lead?.company) return res.status(400).json({ error: "Lead requis." });
    const balance = await Credit.getBalance(userId);
    if (balance < 1) return res.status(429).json({ error: "Plus de crédits.", balance: 0 });
    try {
      const email = await generateProspectEmail({ lead, userCompany, userActivity });
      await Credit.consume(userId, 1);
      const newBalance = await Credit.getBalance(userId);
      res.json({ email, balance: newBalance });
    } catch (err) { console.error(err); res.status(500).json({ error: "Erreur génération email." }); }
    return;
  }

  // ─── GET history ───
  if (action === "history" && req.method === "GET") {
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const searches = await Search.getHistory(userId, limit);
    res.json({ searches });
    return;
  }

  // ─── GET credits ───
  if (action === "credits" && req.method === "GET") {
    const balance = await Credit.getBalance(userId);
    const transactions = await Credit.getTransactions(userId, 20);
    res.json({ balance, transactions, packs: Credit.PACKS });
    return;
  }

  // ─── GET export ───
  if (action === "export" && req.method === "GET") {
    const searchId = req.query.search_id ? parseInt(req.query.search_id) : null;
    const leads = await Lead.getExportData(userId, searchId);
    if (!leads.length) return res.status(404).json({ error: "Aucun lead à exporter." });
    const header = "Entreprise,Site,Secteur,Ville,Description,Taille,Contact,Poste,Email,Email vérifié,Téléphone,LinkedIn,Score\n";
    const rows = leads.map(l => [l.company,l.website,l.industry,l.location,'"'+(l.description||"").replace(/"/g,'""')+'"',l.size,l.contact_name,l.contact_role,l.email,l.email_verified?"Oui":"Non",l.phone,l.linkedin,l.score].join(","));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="leads-'+new Date().toISOString().slice(0,10)+'.csv"');
    res.send(header + rows.join("\n"));
    return;
  }

  // ─── GET search by id ───
  if (action === "search" && req.method === "GET") {
    const id = parseInt(req.query.id);
    if (!id) return res.status(400).json({ error: "ID requis." });
    const result = await Search.getWithLeads(id, userId);
    if (!result) return res.status(404).json({ error: "Recherche introuvable." });
    res.json(result);
    return;
  }

  // ─── GET pool-stats (public) ───
  if (action === "pool-stats" && req.method === "GET") {
    const stats = await db.execute({ sql: "SELECT COUNT(*) as total, COUNT(DISTINCT industry) as industries, COUNT(DISTINCT location) as cities FROM leads" });
    res.json({ total: Number(stats.rows[0].total), industries: Number(stats.rows[0].industries), cities: Number(stats.rows[0].cities) });
    return;
  }

  res.status(404).json({ error: "Action inconnue." });
};
