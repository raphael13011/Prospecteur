const { requireAuth, handleCors } = require("../lib/auth");
const stripeService = require("../lib/services/stripe");
const Credit = require("../lib/models/credit");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;

  const action = req.query.action;

  // ─── POST webhook (no auth, verified by Stripe signature) ───
  if (action === "webhook" && req.method === "POST") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks);
    try {
      const event = stripeService.constructEvent(rawBody, req.headers["stripe-signature"]);
      await stripeService.handleWebhook(event);
      res.json({ received: true });
    } catch (err) { console.error("Webhook error:", err.message); res.status(400).json({ error: err.message }); }
    return;
  }

  // All other billing routes require auth
  const user = await requireAuth(req, res);
  if (!user) return;

  // ─── POST checkout ───
  if (action === "checkout" && req.method === "POST") {
    const { pack } = req.body;
    if (!Credit.PACKS[pack]) return res.status(400).json({ error: "Pack invalide." });
    try {
      const session = await stripeService.createCheckoutSession(user, pack);
      res.json({ checkout_url: session.url });
    } catch (err) { console.error(err); res.status(500).json({ error: "Erreur paiement." }); }
    return;
  }

  // ─── POST portal ───
  if (action === "portal" && req.method === "POST") {
    try {
      const session = await stripeService.createPortalSession(user);
      res.json({ portal_url: session.url });
    } catch (err) { res.status(500).json({ error: err.message }); }
    return;
  }

  res.status(404).json({ error: "Action inconnue." });
};

module.exports.config = { api: { bodyParser: false } };
