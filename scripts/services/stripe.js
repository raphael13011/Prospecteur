const Stripe = require("stripe");
const User = require("../models/user");
const Credit = require("../models/credit");

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

const stripeService = {
  async createCheckoutSession(user, packId) {
    const pack = Credit.PACKS[packId];
    if (!pack) throw new Error("Pack invalide.");

    const stripe = getStripe();
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email, name: user.name,
        metadata: { userId: String(user.id) },
      });
      await User.updateStripe(user.id, { customerId: customer.id });
      customerId = customer.id;
    }

    return stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          unit_amount: pack.price,
          product_data: { name: `Prospecteur — ${pack.label}`, description: `${pack.credits} crédits de recherche de leads` },
        },
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL || ""}?status=success`,
      cancel_url: `${process.env.FRONTEND_URL || ""}?status=cancelled`,
      metadata: { userId: String(user.id), packId, credits: String(pack.credits) },
    });
  },

  async handleWebhook(event) {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        const userId = parseInt(s.metadata.userId);
        const credits = parseInt(s.metadata.credits);
        const packId = s.metadata.packId;
        if (!userId || !credits) break;

        const pack = Credit.PACKS[packId];
        await Credit.addCredits(userId, credits, `Achat ${pack?.label || credits + ' crédits'}`);
        console.log(`✅ User ${userId}: +${credits} crédits (${packId})`);
        break;
      }
    }
  },

  constructEvent(payload, signature) {
    return getStripe().webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET);
  },
};

module.exports = stripeService;
