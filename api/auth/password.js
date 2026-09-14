const User = require("../../lib/models/user");
const { requireAuth, handleCors } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "PUT") return res.status(405).json({ error: "Method not allowed" });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { current_password, new_password } = req.body;
  if (!current_password) return res.status(400).json({ error: "Mot de passe actuel requis." });
  if (!new_password || new_password.length < 6) return res.status(400).json({ error: "6 caractères minimum." });

  if (!(await User.verifyPassword(user, current_password))) {
    return res.status(400).json({ error: "Mot de passe actuel incorrect." });
  }

  await User.updatePassword(Number(user.id), new_password);
  res.json({ message: "Mot de passe mis à jour." });
};
