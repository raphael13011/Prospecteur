const db = require("../db");

const Search = {
  async create(userId, { industry, location, target, leadCount }) {
    const r = await db.execute({
      sql: `INSERT INTO searches (user_id, industry, location, target, lead_count) VALUES (?, ?, ?, ?, ?) RETURNING id`,
      args: [userId, industry, location, target || "", leadCount],
    });
    return Number(r.rows[0].id);
  },

  async getHistory(userId, limit = 30) {
    const r = await db.execute({
      sql: `SELECT id, industry, location, target, lead_count, created_at FROM searches WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      args: [userId, limit],
    });
    return r.rows;
  },

  async getWithLeads(searchId, userId) {
    const s = await db.execute({ sql: "SELECT * FROM searches WHERE id = ? AND user_id = ?", args: [searchId, userId] });
    if (!s.rows[0]) return null;
    const l = await db.execute({ sql: "SELECT * FROM leads WHERE search_id = ? ORDER BY score DESC", args: [searchId] });
    return { ...s.rows[0], leads: l.rows };
  },
};

const Lead = {
  async createBulk(searchId, userId, leads) {
    const stmts = leads.map((l) => ({
      sql: `INSERT INTO leads (search_id, user_id, company, website, industry, location, description, size, contact_name, contact_role, email, phone, linkedin, score, reason)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        searchId, userId, l.company, l.website || null, l.industry || null,
        l.location || null, l.description || null, l.size || null,
        l.contact_name || null, l.contact_role || null, l.email || null,
        l.phone || null, l.linkedin || null, l.score || 0, l.reason || null,
      ],
    }));
    await db.batch(stmts);
  },

  async getByUser(userId, { page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    const countR = await db.execute({ sql: "SELECT COUNT(*) as count FROM leads WHERE user_id = ?", args: [userId] });
    const total = Number(countR.rows[0].count);
    const r = await db.execute({
      sql: `SELECT l.*, s.industry as search_industry, s.location as search_location
            FROM leads l JOIN searches s ON l.search_id = s.id
            WHERE l.user_id = ? ORDER BY l.created_at DESC LIMIT ? OFFSET ?`,
      args: [userId, limit, offset],
    });
    return { items: r.rows, total, page, pages: Math.ceil(total / limit) };
  },

  async getExportData(userId, searchId) {
    if (searchId) {
      const r = await db.execute({ sql: "SELECT * FROM leads WHERE search_id = ? AND user_id = ? ORDER BY score DESC", args: [searchId, userId] });
      return r.rows;
    }
    const r = await db.execute({ sql: "SELECT * FROM leads WHERE user_id = ? ORDER BY created_at DESC", args: [userId] });
    return r.rows;
  },
};

module.exports = { Search, Lead };
