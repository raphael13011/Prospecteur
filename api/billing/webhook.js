const stripeService = require("../../lib/services/stripe");

// Stripe needs raw body for signature verification
module.exports.config = { api: { bodyParser: false } };

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Read raw body
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks);

  try {
    const event = stripeService.constructEvent(rawBody, req.headers["stripe-signature"]);
    await stripeService.handleWebhook(event);
    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.status(400).json({ error: `Webhook invalide: ${err.message}` });
  }
};
