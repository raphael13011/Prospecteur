const User = require("../../lib/models/user");
const PasswordReset = require("../../lib/models/passwordReset");
const { handleCors } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { token, password } = req.body;
  if (!token) return res.status(400).json({ error: "Token requis." });
  if (!password || password.length < 6) return res.status(400).json({ error: "6 caractères minimum." });

  const reset = await PasswordReset.findValid(token);
  if (!reset) return res.status(400).json({ error: "Lien expiré ou déjà utilisé." });

  await User.updatePassword(Number(reset.user_id), password);
  await PasswordReset.markUsed(token);

  res.json({ message: "Mot de passe réinitialisé." });
};
