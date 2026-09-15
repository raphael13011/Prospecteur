const User = require("../lib/models/user");
const Credit = require("../lib/models/credit");
const { generateToken, handleCors } = require("../lib/auth");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  const action = req.query.action;

  if (action === "signup" && req.method === "POST") {
    const { email, password, name, company } = req.body;
    if (!email || !/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: "Email invalide." });
    if (!password || password.length < 6) return res.status(400).json({ error: "6 caractères minimum." });
    if (!name?.trim()) return res.status(400).json({ error: "Nom requis." });
    try {
      const existing = await User.findByEmail(email);
      if (existing) return res.status(409).json({ error: "Un compte existe déjà avec cet email." });
      const user = await User.create({ email, password, name, company });
      const userId = Number(user.id);
      await Credit.initCredits(userId);
      res.status(201).json({ user: User.sanitize(user), token: generateToken(userId), balance: 0 });
    } catch (err) { console.error(err); res.status(500).json({ error: "Erreur création du compte." }); }
    return;
  }

  if (action === "login" && req.method === "POST") {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis." });
    try {
      const user = await User.findByEmail(email);
      if (!user || !(await User.verifyPassword(user, password)))
        return res.status(401).json({ error: "Email ou mot de passe incorrect." });
      const balance = await Credit.getBalance(Number(user.id));
      res.json({ user: User.sanitize(user), token: generateToken(Number(user.id)), balance });
    } catch (err) { console.error(err); res.status(500).json({ error: "Erreur de connexion." }); }
    return;
  }

  if (action === "me" && req.method === "GET") {
    const { requireAuth } = require("../lib/auth");
    const user = await requireAuth(req, res);
    if (!user) return;
    const balance = await Credit.getBalance(Number(user.id));
    res.json({ user: User.sanitize(user), balance });
    return;
  }

  if (action === "profile" && req.method === "PUT") {
    const { requireAuth } = require("../lib/auth");
    const user = await requireAuth(req, res);
    if (!user) return;
    const { name, company } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Nom requis." });
    const updated = await User.update(Number(user.id), { name, company });
    res.json({ user: User.sanitize(updated) });
    return;
  }

  if (action === "password" && req.method === "PUT") {
    const { requireAuth } = require("../lib/auth");
    const user = await requireAuth(req, res);
    if (!user) return;
    const { current_password, new_password } = req.body;
    if (!current_password) return res.status(400).json({ error: "Mot de passe actuel requis." });
    if (!new_password || new_password.length < 6) return res.status(400).json({ error: "6 caractères minimum." });
    if (!(await User.verifyPassword(user, current_password)))
      return res.status(400).json({ error: "Mot de passe actuel incorrect." });
    await User.updatePassword(Number(user.id), new_password);
    res.json({ message: "Mot de passe mis à jour." });
    return;
  }

  if (action === "forgot-password" && req.method === "POST") {
    const PasswordReset = require("../lib/models/passwordReset");
    const { email } = req.body;
    if (email) {
      const user = await User.findByEmail(email);
      if (user) {
        const token = await PasswordReset.create(Number(user.id));
        console.log("Reset for " + user.email + ": " + process.env.FRONTEND_URL + "/reset?token=" + token);
      }
    }
    res.json({ message: "Si un compte existe, un lien a été envoyé." });
    return;
  }

  if (action === "reset-password" && req.method === "POST") {
    const PasswordReset = require("../lib/models/passwordReset");
    const { token, password } = req.body;
    if (!token) return res.status(400).json({ error: "Token requis." });
    if (!password || password.length < 6) return res.status(400).json({ error: "6 caractères minimum." });
    const reset = await PasswordReset.findValid(token);
    if (!reset) return res.status(400).json({ error: "Lien expiré." });
    await User.updatePassword(Number(reset.user_id), password);
    await PasswordReset.markUsed(token);
    res.json({ message: "Mot de passe réinitialisé." });
    return;
  }

  res.status(404).json({ error: "Action inconnue." });
};
