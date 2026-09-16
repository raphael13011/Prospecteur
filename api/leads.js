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
      const leads = await generateLeads({ industry, location, target, count });

      // Dedup: check against existing leads for this user
      const existing = await db.execute({
        sql: "SELECT company, email FROM leads WHERE user_id = ?",
        args: [userId],
      });
      const existingSet = new Set(existing.rows.map(r => (r.company || "").toLowerCase()));
      const existingEmails = new Set(existing.rows.filter(r => r.email).map(r => r.email.toLowerCase()));

      const deduped = leads.map(l => ({
        ...l,
        is_duplicate: existingSet.has((l.company || "").toLowerCase()) || 
                      (l.email && existingEmails.has(l.email.toLowerCase())),
      }));

      const newLeads = deduped.filter(l => !l.is_duplicate);
      const dupCount = deduped.length - newLeads.length;

      // Save search
      const searchId = await Search.create(userId, { industry, location, target, leadCount: newLeads.length });
      if (newLeads.length > 0) await Lead.createBulk(searchId, userId, newLeads);

      // Only charge for new leads
      if (newLeads.length > 0) await Credit.consume(userId, newLeads.length);
      const newBalance = await Credit.getBalance(userId);

      res.json({
        search_id: searchId,
        leads: deduped,
        meta: { industry, location, target: target || null, count: deduped.length, new_count: newLeads.length, duplicate_count: dupCount },
        balance: newBalance,
      });
    } catch (err) { console.error(err); res.status(500).json({ error: err.message || "Erreur génération." }); }
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

  res.status(404).json({ error: "Action inconnue." });
};
