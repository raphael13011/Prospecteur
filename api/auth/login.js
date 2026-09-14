const User = require("../../lib/models/user");
const Credit = require("../../lib/models/credit");
const { generateToken, handleCors } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis." });

  try {
    const user = await User.findByEmail(email);
    if (!user || !(await User.verifyPassword(user, password))) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect." });
    }
    const token = generateToken(Number(user.id));
    const balance = await Credit.getBalance(Number(user.id));
    res.json({ user: User.sanitize(user), token, balance });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Erreur de connexion." });
  }
};
