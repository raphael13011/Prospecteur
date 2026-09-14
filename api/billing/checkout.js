const { requireAuth, handleCors } = require("../../lib/auth");
const stripeService = require("../../lib/services/stripe");
const Credit = require("../../lib/models/credit");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await requireAuth(req, res);
  if (!user) return;

  const { pack } = req.body;
  if (!Credit.PACKS[pack]) {
    return res.status(400).json({ error: "Pack invalide.", packs: Object.keys(Credit.PACKS) });
  }

  try {
    const session = await stripeService.createCheckoutSession(user, pack);
    res.json({ checkout_url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: "Erreur lors de la création du paiement." });
  }
};
