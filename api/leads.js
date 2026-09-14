const Credit = require("../lib/models/credit");
const { Search, Lead } = require("../lib/models/search");
const { generateLeads } = require("../lib/services/leadGenerator");
const { requireAuth, handleCors } = require("../lib/auth");

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
    if (balance < 1) return res.status(429).json({ error: "Plus de crédits. Rechargez votre compte.", balance: 0 });
    const count = Math.min(parseInt(rawCount) || 10, 20, balance);
    try {
      const leads = await generateLeads({ industry, location, target, count });
      const searchId = await Search.create(userId, { industry, location, target, leadCount: leads.length });
      await Lead.createBulk(searchId, userId, leads);
      await Credit.consume(userId, leads.length);
      const newBalance = await Credit.getBalance(userId);
      res.json({ search_id: searchId, leads, meta: { industry, location, target: target || null, count: leads.length }, balance: newBalance });
    } catch (err) { console.error(err); res.status(500).json({ error: err.message || "Erreur génération." }); }
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
    const header = "Entreprise,Site,Secteur,Ville,Description,Taille,Contact,Poste,Email,Téléphone,LinkedIn,Score\n";
    const rows = leads.map(l => [l.company,l.website,l.industry,l.location,`"${(l.description||"").replace(/"/g,'""')}"`,l.size,l.contact_name,l.contact_role,l.email,l.phone,l.linkedin,l.score].join(","));
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="leads-${new Date().toISOString().slice(0,10)}.csv"`);
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
