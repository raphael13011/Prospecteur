const { requireAuth, handleCors } = require("../../lib/auth");
const stripeService = require("../../lib/services/stripe");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const session = await stripeService.createPortalSession(user);
    res.json({ portal_url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message || "Erreur." });
  }
};
