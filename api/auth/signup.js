const User = require("../../lib/models/user");
const Credit = require("../../lib/models/credit");
const { generateToken, handleCors } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password, name, company } = req.body;
  if (!email || !/\S+@\S+\.\S+/.test(email)) return res.status(400).json({ error: "Email invalide." });
  if (!password || password.length < 6) return res.status(400).json({ error: "6 caractères minimum." });
  if (!name?.trim()) return res.status(400).json({ error: "Nom requis." });

  try {
    const existing = await User.findByEmail(email);
    if (existing) return res.status(409).json({ error: "Un compte existe déjà avec cet email." });

    const user = await User.create({ email, password, name, company });
    const userId = Number(user.id);
    
    // Offrir les crédits gratuits de bienvenue
    await Credit.initFreeCredits(userId);
    const balance = await Credit.getBalance(userId);
    const token = generateToken(userId);

    res.status(201).json({ user: User.sanitize(user), token, balance });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Erreur lors de la création du compte." });
  }
};
