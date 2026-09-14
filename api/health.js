module.exports = function handler(req, res) {
  res.json({ status: "ok", version: "1.0.0", timestamp: new Date().toISOString() });
};
