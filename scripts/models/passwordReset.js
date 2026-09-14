const db = require("../db");
const crypto = require("crypto");

const PasswordReset = {
  async create(userId) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000).toISOString();
    await db.execute({ sql: "UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0", args: [userId] });
    await db.execute({
      sql: "INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)",
      args: [userId, token, expiresAt],
    });
    return token;
  },

  async findValid(token) {
    const r = await db.execute({
      sql: `SELECT pr.*, u.email FROM password_resets pr JOIN users u ON pr.user_id = u.id
            WHERE pr.token = ? AND pr.used = 0 AND pr.expires_at > datetime('now')`,
      args: [token],
    });
    return r.rows[0] || null;
  },

  async markUsed(token) {
    await db.execute({ sql: "UPDATE password_resets SET used = 1 WHERE token = ?", args: [token] });
  },
};

module.exports = PasswordReset;
