const { Search } = require("../../lib/models/search");
const { requireAuth, handleCors } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const user = await requireAuth(req, res);
  if (!user) return;

  const limit = Math.min(parseInt(req.query.limit) || 30, 100);
  const searches = await Search.getHistory(Number(user.id), limit);
  res.json({ searches });
};
