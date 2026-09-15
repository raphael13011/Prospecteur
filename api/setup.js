const { createClient } = require("@libsql/client");

module.exports = async function handler(req, res) {
  const key = req.query.key;
  if (key !== process.env.JWT_SECRET?.slice(0, 12)) return res.status(403).json({ error: "Clé invalide." });
  const db = createClient({ url: process.env.TURSO_URL, authToken: process.env.TURSO_AUTH_TOKEN });
  try {
    await db.batch([
      `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL, name TEXT NOT NULL, company TEXT DEFAULT '', plan TEXT NOT NULL DEFAULT 'free', stripe_customer_id TEXT, stripe_subscription_id TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_users_stripe ON users(stripe_customer_id)`,
      `CREATE TABLE IF NOT EXISTS credits (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, balance INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT (datetime('now')))`,
      `CREATE TABLE IF NOT EXISTS credit_transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, amount INTEGER NOT NULL, type TEXT NOT NULL, description TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
      `CREATE INDEX IF NOT EXISTS idx_ct_user ON credit_transactions(user_id, created_at DESC)`,
      `CREATE TABLE IF NOT EXISTS searches (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, industry TEXT NOT NULL, location TEXT NOT NULL, target TEXT DEFAULT '', lead_count INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
      `CREATE INDEX IF NOT EXISTS idx_searches_user ON searches(user_id, created_at DESC)`,
      `CREATE TABLE IF NOT EXISTS leads (id INTEGER PRIMARY KEY AUTOINCREMENT, search_id INTEGER NOT NULL REFERENCES searches(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, company TEXT NOT NULL, website TEXT, industry TEXT, location TEXT, description TEXT, size TEXT, contact_name TEXT, contact_role TEXT, email TEXT, phone TEXT, linkedin TEXT, email_verified INTEGER DEFAULT 0, score INTEGER DEFAULT 0, reason TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
      `CREATE INDEX IF NOT EXISTS idx_leads_search ON leads(search_id)`,
      `CREATE INDEX IF NOT EXISTS idx_leads_user ON leads(user_id, created_at DESC)`,
      `CREATE TABLE IF NOT EXISTS password_resets (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, token TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, used INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
      `CREATE INDEX IF NOT EXISTS idx_resets_token ON password_resets(token)`,
    ]);
    res.json({ status: "ok", message: "Base initialisée.", tables: ["users","credits","credit_transactions","searches","leads","password_resets"] });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
