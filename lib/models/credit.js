const db = require("../db");

const PACKS = {
  starter:  { credits: 50,  price: 900,  label: "50 crédits",  priceLabel: "9€" },
  pro:      { credits: 200, price: 2900, label: "200 crédits", priceLabel: "29€" },
  business: { credits: 500, price: 5900, label: "500 crédits", priceLabel: "59€" },
};

const FREE_SIGNUP_CREDITS = 10;

const Credit = {
  async getBalance(userId) {
    const r = await db.execute({ sql: "SELECT balance FROM credits WHERE user_id = ?", args: [userId] });
    return r.rows[0] ? Number(r.rows[0].balance) : 0;
  },

  async initFreeCredits(userId) {
    await db.execute({
      sql: "INSERT INTO credits (user_id, balance) VALUES (?, ?) ON CONFLICT(user_id) DO NOTHING",
      args: [userId, FREE_SIGNUP_CREDITS],
    });
  },

  async consume(userId, amount) {
    const balance = await Credit.getBalance(userId);
    if (balance < amount) return false;
    await db.execute({
      sql: "UPDATE credits SET balance = balance - ?, updated_at = datetime('now') WHERE user_id = ?",
      args: [amount, userId],
    });
    // Log the transaction
    await db.execute({
      sql: "INSERT INTO credit_transactions (user_id, amount, type, description) VALUES (?, ?, 'usage', 'Génération de leads')",
      args: [userId, -amount],
    });
    return true;
  },

  async addCredits(userId, amount, description) {
    await db.execute({
      sql: `INSERT INTO credits (user_id, balance) VALUES (?, ?)
            ON CONFLICT(user_id) DO UPDATE SET balance = balance + ?, updated_at = datetime('now')`,
      args: [userId, amount, amount],
    });
    await db.execute({
      sql: "INSERT INTO credit_transactions (user_id, amount, type, description) VALUES (?, ?, 'purchase', ?)",
      args: [userId, amount, description || 'Achat de crédits'],
    });
  },

  async getTransactions(userId, limit = 20) {
    const r = await db.execute({
      sql: "SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
      args: [userId, limit],
    });
    return r.rows;
  },

  PACKS,
  FREE_SIGNUP_CREDITS,
};

module.exports = Credit;
