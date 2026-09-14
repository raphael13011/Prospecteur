const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function generateLeads({ industry, location, target, count }) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [{
      role: "user",
      content: `Expert prospection B2B française. Recherche sur le web des entreprises RÉELLES :\n- Secteur : ${industry}\n- Localisation : ${location}\n- Cible : ${target || "Tout type"}\n- Nombre : ${count}\n\nRéponds UNIQUEMENT en JSON valide (sans markdown) :\n[{"company":"Nom","website":"url ou null","industry":"Sous-secteur","location":"Ville","description":"1 phrase","size":"Effectif","contact_name":"Dirigeant ou null","contact_role":"Poste ou null","email":"Email ou null","phone":"Tél ou null","linkedin":"URL ou null","score":85,"reason":"Pertinence"}]\n\nEntreprises RÉELLES uniquement. Info introuvable = null.`,
    }],
  });

  const txt = response.content.filter(b => b.type === "text").map(b => b.text).join("\n");
  const match = txt.replace(/```json|```/g, "").trim().match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Aucun résultat exploitable.");

  const leads = JSON.parse(match[0]);
  if (!Array.isArray(leads) || !leads.length) throw new Error("Aucun prospect trouvé.");

  return leads.map(l => ({
    company: l.company || "Inconnu",
    website: l.website || null, industry: l.industry || industry,
    location: l.location || location, description: l.description || null,
    size: l.size || null, contact_name: l.contact_name || null,
    contact_role: l.contact_role || null, email: l.email || null,
    phone: l.phone || null, linkedin: l.linkedin || null,
    score: Math.min(100, Math.max(0, parseInt(l.score) || 50)),
    reason: l.reason || null,
  }));
}

module.exports = { generateLeads };
