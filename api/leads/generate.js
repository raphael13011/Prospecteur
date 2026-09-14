const Credit = require("../../lib/models/credit");
const { Search, Lead } = require("../../lib/models/search");
const { generateLeads } = require("../../lib/services/leadGenerator");
const { requireAuth, handleCors } = require("../../lib/auth");

module.exports.config = { maxDuration: 60 };

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { industry, location, target, count: rawCount } = req.body;
  if (!industry?.trim()) return res.status(400).json({ error: "Secteur requis." });
  if (!location?.trim()) return res.status(400).json({ error: "Localisation requise." });

  const userId = Number(user.id);
  const count = Math.min(parseInt(rawCount) || 10, 20);
  const balance = await Credit.getBalance(userId);

  // 1 crédit = 1 lead
  if (balance < 1) {
    return res.status(429).json({
      error: "Plus de crédits. Rechargez votre compte.",
      balance: 0,
    });
  }

  const actualCount = Math.min(count, balance);

  try {
    const leads = await generateLeads({ industry, location, target, count: actualCount });
    const searchId = await Search.create(userId, { industry, location, target, leadCount: leads.length });
    await Lead.createBulk(searchId, userId, leads);

    // Consommer les crédits (1 par lead trouvé)
    await Credit.consume(userId, leads.length);
    const newBalance = await Credit.getBalance(userId);

    res.json({
      search_id: searchId,
      leads,
      meta: { industry, location, target: target || null, count: leads.length },
      balance: newBalance,
    });
  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({ error: err.message || "Erreur lors de la génération." });
  }
};
