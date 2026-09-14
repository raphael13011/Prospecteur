const { Search } = require("../../lib/models/search");
const { requireAuth, handleCors } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const user = await requireAuth(req, res);
  if (!user) return;

  const id = parseInt(req.query.id);
  if (!id) return res.status(400).json({ error: "ID requis." });

  const result = await Search.getWithLeads(id, Number(user.id));
  if (!result) return res.status(404).json({ error: "Recherche introuvable." });

  res.json(result);
};
