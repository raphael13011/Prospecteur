const { Lead } = require("../../lib/models/search");
const { requireAuth, handleCors } = require("../../lib/auth");

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const user = await requireAuth(req, res);
  if (!user) return;

  const searchId = req.query.search_id ? parseInt(req.query.search_id) : null;
  const leads = await Lead.getExportData(Number(user.id), searchId);

  if (!leads.length) return res.status(404).json({ error: "Aucun lead à exporter." });

  const header = "Entreprise,Site,Secteur,Ville,Description,Taille,Contact,Poste,Email,Téléphone,LinkedIn,Score\n";
  const rows = leads.map(l =>
    [l.company, l.website, l.industry, l.location, `"${(l.description || "").replace(/"/g, '""')}"`, l.size, l.contact_name, l.contact_role, l.email, l.phone, l.linkedin, l.score].join(",")
  );

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(header + rows.join("\n"));
};
