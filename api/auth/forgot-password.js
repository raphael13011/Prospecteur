const User = require("../../lib/models/user");
const PasswordReset = require("../../lib/models/passwordReset");
const { handleCors } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email requis." });

  const user = await User.findByEmail(email);
  if (user) {
    const token = await PasswordReset.create(Number(user.id));
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    // TODO: envoyer l'email via Resend / SendGrid / SES
    console.log(`📧 Reset link for ${user.email}: ${resetUrl}`);
  }

  // Toujours retourner succès (anti-énumération)
  res.json({ message: "Si un compte existe, un lien a été envoyé." });
};
