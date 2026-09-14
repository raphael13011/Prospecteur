const User = require("../../lib/models/user");
const { requireAuth, handleCors } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "PUT") return res.status(405).json({ error: "Method not allowed" });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { name, company } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Nom requis." });

  const updated = await User.update(Number(user.id), { name, company });
  res.json({ user: User.sanitize(updated) });
};
