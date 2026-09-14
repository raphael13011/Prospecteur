const User = require("../../lib/models/user");
const Credit = require("../../lib/models/credit");
const { requireAuth, handleCors } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const user = await requireAuth(req, res);
  if (!user) return;

  const balance = await Credit.getBalance(Number(user.id));
  res.json({ user: User.sanitize(user), balance });
};
