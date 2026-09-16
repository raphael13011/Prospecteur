const Anthropic = require("@anthropic-ai/sdk");
const dns = require("dns").promises;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function verifyEmail(email) {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@")[1];
  try {
    const mx = await dns.resolveMx(domain);
    return mx && mx.length > 0;
  } catch { return false; }
}

async function generateLeads({ industry, location, target, count }) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [{ role: "user", content: `Expert prospection B2B française. Recherche sur le web des entreprises RÉELLES :\n- Secteur : ${industry}\n- Localisation : ${location}\n- Cible : ${target || "Tout type"}\n- Nombre : ${count}\n\nRéponds UNIQUEMENT en JSON valide (sans markdown) :\n[{"company":"Nom","website":"url ou null","industry":"Sous-secteur","location":"Ville","description":"1 phrase","size":"Effectif","contact_name":"Dirigeant ou null","contact_role":"Poste ou null","email":"Email ou null","phone":"Tél ou null","linkedin":"URL ou null","score":85,"reason":"Pertinence"}]\n\nEntreprises RÉELLES uniquement. Info introuvable = null.` }],
  });

  const txt = response.content.filter(b => b.type === "text").map(b => b.text).join("\n");
  const match = txt.replace(/```json|```/g, "").trim().match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Aucun résultat exploitable.");

  const leads = JSON.parse(match[0]);
  if (!Array.isArray(leads) || !leads.length) throw new Error("Aucun prospect trouvé.");

  // Verify emails in parallel
  const verified = await Promise.all(leads.map(async (l) => {
    const emailValid = l.email ? await verifyEmail(l.email) : false;
    return {
      company: l.company || "Inconnu",
      website: l.website || null, industry: l.industry || industry,
      location: l.location || location, description: l.description || null,
      size: l.size || null, contact_name: l.contact_name || null,
      contact_role: l.contact_role || null, email: l.email || null,
      email_verified: emailValid,
      phone: l.phone || null, linkedin: l.linkedin || null,
      score: Math.min(100, Math.max(0, parseInt(l.score) || 50)),
      reason: l.reason || null,
    };
  }));

  return verified;
}

async function generateProspectEmail({ lead, userCompany, userActivity }) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [{ role: "user", content: `Rédige un email de prospection court et percutant en français.

Contexte :
- Tu écris pour : ${userCompany || "une entreprise"}${userActivity ? " spécialisée en " + userActivity : ""}
- Tu écris à : ${lead.contact_name || "le dirigeant"} de ${lead.company}
- Leur activité : ${lead.description || lead.industry}
- Localisation : ${lead.location}

Règles :
- Objet accrocheur (max 50 caractères)
- Max 5 phrases dans le corps
- Ton professionnel mais humain, pas corporate
- Montre que tu connais leur activité
- Termine par un call-to-action clair (appel ou rdv)
- Pas de formules creuses ("je me permets", "n'hésitez pas")

Réponds en JSON : {"subject":"Objet","body":"Corps de l'email"}` }],
  });

  const txt = response.content.filter(b => b.type === "text").map(b => b.text).join("");
  const cleaned = txt.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

// exports moved to bottom

async function generateAudiences({ industry, location, target, count }) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [{ role: "user", content: `Expert en marketing et acquisition de clients particuliers en France. Recherche sur le web des COMMUNAUTÉS, GROUPES et CANAUX où se trouvent des clients potentiels pour :
- Secteur : ${industry}
- Zone : ${location}
- Cible : ${target || "Particuliers intéressés par ce secteur"}
- Nombre de résultats : ${count}

Cherche des résultats RÉELS et ACTUELS parmi :
- Groupes Facebook actifs
- Communautés Reddit / forums français
- Associations locales
- Événements récurrents / salons
- Groupes WhatsApp / Telegram
- Chaînes YouTube populaires dans la niche
- Comptes Instagram influents locaux
- Meetups et clubs

Réponds UNIQUEMENT en JSON valide (sans markdown) :
[{"name":"Nom du groupe/communauté","type":"facebook_group|forum|association|event|telegram|youtube|instagram|meetup|other","url":"URL si trouvée ou null","platform":"Facebook|Reddit|Instagram|YouTube|Association|Événement|etc.","members":"Nombre de membres ou estimation","location":"Ville ou En ligne","description":"Ce qu'on y trouve en 1 phrase","relevance":"Pourquoi c'est pertinent pour trouver des clients","tip":"Conseil concret pour approcher cette communauté"}]

Résultats RÉELS uniquement.` }],
  });

  const txt = response.content.filter(b => b.type === "text").map(b => b.text).join("\n");
  const match = txt.replace(/```json|```/g, "").trim().match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Aucun résultat exploitable.");
  const results = JSON.parse(match[0]);
  if (!Array.isArray(results) || !results.length) throw new Error("Aucune audience trouvée.");
  return results.map(r => ({
    name: r.name || "Inconnu",
    type: r.type || "other",
    url: r.url || null,
    platform: r.platform || "Autre",
    members: r.members || null,
    location: r.location || location,
    description: r.description || null,
    relevance: r.relevance || null,
    tip: r.tip || null,
  }));
}

module.exports = { generateLeads, generateProspectEmail, generateAudiences };
