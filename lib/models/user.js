const db = require("../db");
const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;

const User = {
  async create({ email, password, name, company }) {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await db.execute({
      sql: `INSERT INTO users (email, password_hash, name, company) VALUES (?, ?, ?, ?) RETURNING *`,
      args: [email.toLowerCase().trim(), hash, name.trim(), (company || "").trim()],
    });
    return result.rows[0];
  },

  async findById(id) {
    const r = await db.execute({ sql: "SELECT * FROM users WHERE id = ?", args: [id] });
    return r.rows[0] || null;
  },

  async findByEmail(email) {
    const r = await db.execute({ sql: "SELECT * FROM users WHERE email = ?", args: [email.toLowerCase().trim()] });
    return r.rows[0] || null;
  },

  async findByStripeCustomerId(customerId) {
    const r = await db.execute({ sql: "SELECT * FROM users WHERE stripe_customer_id = ?", args: [customerId] });
    return r.rows[0] || null;
  },

  async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  },

  async updatePassword(userId, newPassword) {
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db.execute({ sql: "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?", args: [hash, userId] });
  },

  async update(userId, { name, company }) {
    await db.execute({
      sql: "UPDATE users SET name = ?, company = ?, updated_at = datetime('now') WHERE id = ?",
      args: [name.trim(), (company || "").trim(), userId],
    });
    return User.findById(userId);
  },

  async updatePlan(userId, plan) {
    await db.execute({ sql: "UPDATE users SET plan = ?, updated_at = datetime('now') WHERE id = ?", args: [plan, userId] });
    return User.findById(userId);
  },

  async updateStripe(userId, { customerId, subscriptionId }) {
    await db.execute({
      sql: "UPDATE users SET stripe_customer_id = ?, stripe_subscription_id = ?, updated_at = datetime('now') WHERE id = ?",
      args: [customerId, subscriptionId || null, userId],
    });
  },

  sanitize(user) {
    if (!user) return null;
    const { password_hash, stripe_customer_id, stripe_subscription_id, ...safe } = user;
    return safe;
  },
};

module.exports = User;
