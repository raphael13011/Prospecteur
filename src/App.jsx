import { useState, useEffect, useRef } from "react";

const API_BASE = "";
async function api(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  const res = await fetch(API_BASE + "/api" + path, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erreur " + res.status);
  return data;
}
const saveToken = t => localStorage.setItem("pt", t);
const loadToken = () => localStorage.getItem("pt");
const clearToken = () => localStorage.removeItem("pt");

const PACKS = {
  starter: { credits: 50, price: "9€", per: "0,18€/lead", desc: "Pour tester" },
  pro: { credits: 200, price: "29€", per: "0,15€/lead", popular: true, desc: "Le plus choisi" },
  business: { credits: 500, price: "59€", per: "0,12€/lead", desc: "Pour les pros" },
};
const NICHES = [
  { icon: "🔧", l: "Artisans", i: "Artisans du bâtiment", t: "Artisans indépendants et PME du BTP" },
  { icon: "🍽", l: "Restos", i: "Restaurants et restauration", t: "Restaurants indépendants, brasseries" },
  { icon: "💇", l: "Beauté", i: "Salons de coiffure et beauté", t: "Salons et instituts indépendants" },
  { icon: "🏠", l: "Immo", i: "Agences immobilières", t: "Agences immobilières indépendantes" },
  { icon: "💻", l: "Agences", i: "Agences web et digitales", t: "Agences web, SEO, marketing digital" },
  { icon: "🏋️", l: "Sport", i: "Sport et fitness", t: "Salles, coachs et studios" },
  { icon: "⚖️", l: "Avocats", i: "Cabinets d'avocats", t: "Cabinets indépendants" },
  { icon: "🏥", l: "Santé", i: "Professions médicales", t: "Cabinets, kinés, ostéopathes" },
  { icon: "📚", l: "Formation", i: "Organismes de formation", t: "Centres de formation" },
  { icon: "🚗", l: "Auto", i: "Garages automobiles", t: "Garages indépendants" },
  { icon: "🛒", l: "Commerce", i: "Commerces de proximité", t: "Boutiques, magasins spécialisés" },
  { icon: "🌿", l: "Paysage", i: "Paysagistes", t: "Paysagistes, jardiniers" },
];

function Input({ label, error, ...p }) {
  return (<div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
    {label && <label style={S.label}>{label}</label>}
    <input style={{ ...S.input, ...(error ? { borderColor: "#ef4444" } : {}) }} {...p} />
  </div>);
}

function Logo({ small }) {
  const z = small ? 28 : 36;
  const c = z / 2;
  return (<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <svg width={z} height={z} viewBox={"0 0 "+z+" "+z} style={{ flexShrink: 0 }}>
      <rect width={z} height={z} rx="8" fill="#0f172a"/>
      <circle cx={c} cy={c} r={z*0.31} fill="none" stroke="white" strokeWidth="2"/>
      <circle cx={c} cy={c} r={z*0.15} fill="none" stroke="white" strokeWidth="2"/>
      <circle cx={c} cy={c} r={z*0.055} fill="white"/>
    </svg>
    <span style={{ fontSize: small ? 16 : 22, fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a" }}>Huntly</span>
  </div>);
}

function StepModal({ step, onAuth, onPaid, onClose, count }) {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [name, setName] = useState(""); const [company, setCompany] = useState("");
  const [err, setErr] = useState(""); const [ld, setLd] = useState(false);
  const [buying, setBuying] = useState(null);
  const doAuth = async () => {
    setErr(""); setLd(true);
    try {
      const a = mode === "signup" ? "signup" : "login";
      const bd = mode === "signup" ? { email, password: pw, name, company } : { email, password: pw };
      const d = await api("/auth?action=" + a, { method: "POST", body: bd });
      saveToken(d.token); onAuth(d.token, d.user, d.balance);
    } catch (e) { setErr(e.message); }
    setLd(false);
  };
  const onK = e => { if (e.key === "Enter") doAuth(); };
  const buy = async (packId, tkn) => {
    setBuying(packId);
    try { const d = await api("/billing?action=checkout", { method: "POST", body: { pack: packId }, token: tkn }); if (d.checkout_url) window.location.href = d.checkout_url; } catch (e) { alert(e.message); }
    setBuying(null);
  };
  return (
    <div style={S.overlay} onClick={onClose}><div style={S.modal} onClick={e => e.stopPropagation()}>
      <button style={S.closeBtn} onClick={onClose}>✕</button>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 24, height: 24, borderRadius: "50%", background: step === "auth" ? "#0f172a" : "#059669", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{step === "auth" ? "1" : "✓"}</div><span style={{ fontSize: 13, fontWeight: 600, color: step === "auth" ? "#0f172a" : "#059669" }}>Compte</span></div>
        <div style={{ width: 24, height: 1, background: "#e5e7eb", alignSelf: "center" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 24, height: 24, borderRadius: "50%", background: step === "pay" ? "#0f172a" : "#e5e7eb", color: step === "pay" ? "#fff" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>2</div><span style={{ fontSize: 13, fontWeight: 600, color: step === "pay" ? "#0f172a" : "#94a3b8" }}>Crédits</span></div>
      </div>
      {step === "auth" && (<>
        <h2 style={{ fontSize: 20, fontWeight: 800, textAlign: "center", marginBottom: 2 }}>{mode === "signup" ? "Créez votre compte" : "Connexion"}</h2>
        <p style={{ fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 16 }}>{mode === "signup" ? "Pour recevoir vos " + count + " prospects" : "Retrouvez votre compte"}</p>
        {err && <div style={S.errBox}>{err}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && <div style={{ display: "flex", gap: 10 }}><Input label="Nom" value={name} onChange={e => setName(e.target.value)} placeholder="Jean Dupont" onKeyDown={onK} /><Input label="Entreprise" value={company} onChange={e => setCompany(e.target.value)} placeholder="Optionnel" onKeyDown={onK} /></div>}
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jean@exemple.fr" onKeyDown={onK} />
          <Input label="Mot de passe" type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="6 caractères min." onKeyDown={onK} />
        </div>
        <button className="cta-btn" style={{ ...S.pBtn, marginTop: 16, background: "#0f172a", ...(ld ? { opacity: .7, pointerEvents: "none" } : {}) }} onClick={doAuth}>{ld ? <span style={S.spn} /> : "Continuer →"}</button>
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 13, color: "#64748b" }}>
          {mode === "signup" ? <>Déjà inscrit ? <button style={S.tBtn} onClick={() => { setMode("login"); setErr(""); }}>Connexion</button></> : <>Pas de compte ? <button style={S.tBtn} onClick={() => { setMode("signup"); setErr(""); }}>S'inscrire</button></>}
        </div>
      </>)}
      {step === "pay" && (<>
        <h2 style={{ fontSize: 20, fontWeight: 800, textAlign: "center", marginBottom: 2 }}>Choisissez vos crédits</h2>
        <p style={{ fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 16 }}>1 crédit = 1 lead · Paiement sécurisé Stripe</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(PACKS).map(([id, p]) => (
            <button key={id} className="pack-card" style={{ ...S.packRow, ...(p.popular ? { border: "2px solid #0f172a", background: "#f8fafc" } : {}) }} onClick={() => buy(id, onPaid)}>
              {p.popular && <span style={{ position: "absolute", top: -8, right: 12, fontSize: 10, fontWeight: 700, color: "#fff", background: "#0f172a", padding: "2px 10px", borderRadius: 10 }}>Populaire</span>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <div><div style={{ fontWeight: 700, fontSize: 15 }}>{p.credits} crédits</div><div style={{ fontSize: 12, color: "#94a3b8" }}>{p.per}</div></div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{p.price}</div>
              </div>
            </button>
          ))}
        </div>
      </>)}
    </div></div>
  );
}

function LandingSections({ onCta, onMentions, onConfidentialite, onCgu }) {
  return (<>
    {/* STATS BAR */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, padding: "32px 0", className: "stat-grid" }}>
      {[{ n: "30 sec", d: "Pour obtenir vos leads" }, { n: "12+", d: "Secteurs pré-configurés" }, { n: "0,12€", d: "Le lead le moins cher" }].map((s, i) => (
        <div key={i} className="stat-card" style={{ textAlign: "center", padding: "16px 8px", background: "#f8fafc", borderRadius: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>{s.n}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.d}</div>
        </div>
      ))}
    </div>

    {/* HOW IT WORKS */}
    <div style={{ padding: "32px 0" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>COMMENT ÇA MARCHE</div>
        <h2 className="section-title" style={{ fontWeight: 800, letterSpacing: "-0.03em" }}>3 étapes, 30 secondes</h2>
      </div>
      <div className="step-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {[{ icon: "🎯", n: "1", title: "Choisissez votre cible", desc: "Sélectionnez un ou plusieurs secteurs et une ville. Ou tapez directement votre niche." },
          { icon: "🤖", n: "2", title: "L'IA cherche pour vous", desc: "Notre IA parcourt le web en temps réel — sites, annuaires, LinkedIn — et identifie vos prospects." },
          { icon: "📋", n: "3", title: "Récupérez vos leads", desc: "Nom, email, téléphone, site, dirigeant, score de pertinence. Exportez en CSV en 1 clic." }
        ].map(s => (
          <div key={s.n} className="step-card" style={{ padding: 24, borderRadius: 14, border: "1px solid #e5e7eb", transition: "all .2s" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }}>{s.n}</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{s.title}</div>
            </div>
            <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </div>

    {/* PREVIEW */}
    <div style={{ padding: "32px 0" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>APERÇU</div>
        <h2 className="section-title" style={{ fontWeight: 800, letterSpacing: "-0.03em" }}>Voici ce que vous obtenez</h2>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>Résultat réel pour "Plombiers à Lyon"</p>
      </div>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,.04)" }}>
        <div style={{ padding: "10px 18px", background: "#f8fafc", borderBottom: "1px solid #e5e7eb", fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>3 résultats · Plombiers · Lyon</div>
        {[{ c: "Plomberie Martin & Fils", loc: "Lyon 3e", desc: "Entreprise familiale spécialisée en dépannage et rénovation plomberie depuis 2008.", sc: 92, em: true, ph: true, contact: "Pierre Martin — Gérant" },
          { c: "Atelier Duval Rénovation", loc: "Villeurbanne", desc: "Plomberie, chauffage et climatisation pour particuliers et professionnels.", sc: 87, em: true, ph: false, contact: "Marc Duval — Dirigeant" },
          { c: "SOS Dépannage Express", loc: "Lyon 7e", desc: "Interventions rapides en plomberie et serrurerie, 7j/7.", sc: 84, em: true, ph: true, contact: "Sarah Benali — Responsable" }
        ].map((l, i) => (
          <div key={i} style={{ padding: "16px 18px", borderBottom: i < 2 ? "1px solid #f1f5f9" : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div><div style={{ fontWeight: 700, fontSize: 14 }}>{l.c}</div><div style={{ fontSize: 12, color: "#94a3b8" }}>{l.loc} · {l.contact}</div></div>
              <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: "#059669", background: "#ecfdf5" }}>{l.sc}%</span>
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>{l.desc}</div>
            <div style={{ display: "flex", gap: 6 }}>
              {l.em && <span style={S.chOk}>✉️ Email dispo</span>}
              {l.ph && <span style={S.chOk}>📞 Tél. dispo</span>}
              <span style={S.ch}>🌐 Site web</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* PRICING */}
    <div style={{ padding: "32px 0" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>TARIFS</div>
        <h2 className="section-title" style={{ fontWeight: 800, letterSpacing: "-0.03em" }}>Payez à l'usage, sans engagement</h2>
        <p style={{ fontSize: 14, color: "#64748b", marginTop: 6 }}>Pas d'abonnement. 1 crédit = 1 lead trouvé. Crédits valables à vie.</p>
      </div>
      <div className="pack-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, maxWidth: 580, margin: "0 auto" }}>
        {Object.entries(PACKS).map(([id, p]) => (
          <div key={id} className="pack-card" style={{ border: p.popular ? "2px solid #0f172a" : "1px solid #e5e7eb", borderRadius: 14, padding: "28px 20px", textAlign: "center", position: "relative", transition: "all .2s", background: p.popular ? "#f8fafc" : "#fff" }}>
            {p.popular && <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", fontSize: 11, fontWeight: 700, color: "#fff", background: "#0f172a", padding: "3px 14px", borderRadius: 20, whiteSpace: "nowrap" }}>Le + choisi</div>}
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{p.desc}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>{p.price}</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>{p.credits} crédits</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4, marginBottom: 16 }}>{p.per}</div>
            <button className="cta-btn" onClick={onCta} style={{ width: "100%", padding: "10px", background: p.popular ? "#0f172a" : "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .15s" }}>Commencer</button>
          </div>
        ))}
      </div>
    </div>

    {/* TRUST */}
    <div style={{ padding: "24px 0 32px" }}>
      <div className="trust-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {[{ icon: "🔒", t: "Paiement sécurisé", d: "Stripe, le leader mondial du paiement en ligne" },
          { icon: "🇫🇷", t: "100% français", d: "Interface, données et support en français" },
          { icon: "⚡", t: "Résultats instantanés", d: "L'IA cherche en temps réel, pas de base statique" },
          { icon: "🛡️", t: "RGPD-friendly", d: "Données issues de sources publiques uniquement" }
        ].map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "16px", borderRadius: 12, background: "#f8fafc" }}>
            <div style={{ fontSize: 24, flexShrink: 0 }}>{t.icon}</div>
            <div><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{t.t}</div><div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{t.d}</div></div>
          </div>
        ))}
      </div>
    </div>


    {/* RGPD */}
    <div style={{ padding: "32px 0" }}>
      <div style={{ borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", background: "#0f172a", color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 24 }}>🛡️</span>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>100% conforme RGPD</h2>
          </div>
          <p style={{ fontSize: 14, color: "#94a3b8", margin: 0, lineHeight: 1.6 }}>Huntly est conçu pour respecter la réglementation européenne sur les données personnelles.</p>
        </div>
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>✅</div>
            <div><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Sources publiques uniquement</div><div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>Toutes les données proviennent de sources accessibles publiquement : sites web d'entreprises, annuaires professionnels (Pages Jaunes, Societe.com), profils LinkedIn publics, registres officiels (INSEE, RCS). Aucune donnée privée n'est collectée.</div></div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>✅</div>
            <div><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Données B2B professionnelles</div><div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>Huntly cible exclusivement les données professionnelles (email d'entreprise, téléphone du bureau, nom de société). Le RGPD autorise le traitement de données professionnelles sur la base de l'intérêt légitime (article 6.1.f).</div></div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>✅</div>
            <div><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Pas de stockage massif</div><div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>Contrairement aux grandes bases de données, Huntly ne stocke pas des millions de profils. L'IA recherche en temps réel, uniquement à la demande. Les résultats sont conservés dans votre compte et nulle part ailleurs.</div></div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>✅</div>
            <div><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Vos données sont protégées</div><div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>Mots de passe chiffrés (bcrypt), connexions HTTPS, authentification par token JWT, paiement sécurisé par Stripe. Vous pouvez supprimer votre compte et toutes vos données à tout moment.</div></div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>✅</div>
            <div><div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Zéro cookie publicitaire</div><div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>Aucun tracker, aucune pub, aucun cookie tiers. Seuls des cookies techniques nécessaires au fonctionnement du service sont utilisés.</div></div>
          </div>
        </div>
      </div>
    </div>

    {/* FAQ */}
    <div style={{ padding: "32px 0" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>FAQ</div>
        <h2 className="section-title" style={{ fontWeight: 800, letterSpacing: "-0.03em" }}>Questions fréquentes</h2>
      </div>
      {[{ q: "D'où viennent les données ?", a: "L'IA recherche en temps réel sur le web — sites d'entreprises, annuaires professionnels, LinkedIn, pages légales. Ce ne sont pas des données statiques : chaque recherche est fraîche." },
        { q: "Est-ce que les contacts sont fiables ?", a: "Chaque lead a un score de pertinence. Les emails et téléphones sont extraits de sources publiques et vérifiés quand c'est possible. Le score vous permet de prioriser les meilleurs prospects." },
        { q: "Les crédits expirent-ils ?", a: "Non, jamais. Vos crédits sont valables à vie, sans date d'expiration ni renouvellement automatique." },
        { q: "Puis-je exporter mes leads ?", a: "Oui, en CSV en un clic. Le fichier est compatible avec tous les CRM (HubSpot, Pipedrive, Salesforce) et tableurs (Excel, Google Sheets)." },
        { q: "C'est conforme au RGPD ?", a: "Les données sont issues exclusivement de sources publiques (sites web, annuaires). Nous ne stockons aucune donnée personnelle au-delà de votre compte utilisateur." },
        { q: "Combien de temps prend une recherche ?", a: "Entre 15 et 45 secondes selon le nombre de leads demandé. L'IA parcourt le web en temps réel, ce n'est pas une simple requête dans une base de données." }
      ].map((f, i) => (
        <div key={i} style={{ borderBottom: "1px solid #f1f5f9", padding: "16px 0" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: "#0f172a" }}>{f.q}</div>
          <div style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.6 }}>{f.a}</div>
        </div>
      ))}
    </div>

    {/* FINAL CTA */}
    <div style={{ textAlign: "center", padding: "40px 20px", margin: "16px 0 0", borderRadius: 16, background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Prêt à trouver vos clients ?</h2>
      <p style={{ fontSize: 14, color: "#94a3b8", marginBottom: 20, maxWidth: 400, margin: "0 auto 20px" }}>Choisissez un secteur, entrez une ville, et recevez vos premiers leads en 30 secondes.</p>
      <button className="cta-btn" onClick={onCta} style={{ padding: "14px 40px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer", transition: "all .15s" }}>Commencer maintenant →</button>
    </div>

    {/* FOOTER */}
    <div style={{ textAlign: "center", padding: "32px 0 16px" }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 8 }}><Logo small /></div>
      <p style={{ fontSize: 12, color: "#94a3b8" }}>Paiement sécurisé par Stripe · hello@huntly.fr</p>
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
        <button onClick={onMentions} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Mentions légales</button>
        <button onClick={onConfidentialite} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Confidentialité</button>
        <button onClick={onCgu} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>CGU</button>
      </div>
      <p style={{ fontSize: 11, color: "#cbd5e1", marginTop: 8 }}>© 2026 Huntly. Tous droits réservés.</p>
    </div>
  </>);
}


function LegalPage({ page, onBack }) {
  const sty = { padding: "24px 0 48px" };
  const h2 = { fontSize: 20, fontWeight: 800, marginBottom: 16 };
  const h3 = { fontSize: 15, fontWeight: 700, marginTop: 20, marginBottom: 8 };
  const p = { fontSize: 13.5, color: "#475569", lineHeight: 1.7, marginBottom: 10 };

  return (<div style={sty}>
    <button style={S.bkBtn} onClick={onBack}>← Retour</button>

    {page === "mentions" && (<>
      <h2 style={h2}>Mentions légales</h2>
      <h3 style={h3}>Éditeur du site</h3>
      <p style={p}>Le site Huntly est édité par [Votre nom ou raison sociale], [forme juridique], au capital de [montant] euros.<br/>Siège social : [Adresse complète]<br/>SIRET : [Numéro SIRET]<br/>Directeur de la publication : [Nom du responsable]<br/>Contact : hello@huntly.fr</p>
      <h3 style={h3}>Hébergement</h3>
      <p style={p}>Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.<br/>Base de données hébergée par Turso (ChiselStrike Inc.).</p>
      <h3 style={h3}>Propriété intellectuelle</h3>
      <p style={p}>L'ensemble des contenus du site Huntly (textes, graphismes, logo, icônes, logiciels) est protégé par le droit de la propriété intellectuelle. Toute reproduction, représentation ou diffusion, totale ou partielle, sans autorisation expresse est interdite.</p>
      <h3 style={h3}>Données personnelles</h3>
      <p style={p}>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Pour exercer ce droit, contactez : hello@huntly.fr.</p>
      <h3 style={h3}>Cookies</h3>
      <p style={p}>Le site utilise uniquement des cookies techniques nécessaires à son fonctionnement (authentification, session). Aucun cookie publicitaire ou de tracking n'est utilisé.</p>
    </>)}

    {page === "confidentialite" && (<>
      <h2 style={h2}>Politique de confidentialité</h2>
      <h3 style={h3}>1. Données collectées</h3>
      <p style={p}>Lors de votre inscription, nous collectons : nom, adresse email, nom d'entreprise (optionnel). Lors de l'utilisation du service, nous collectons : historique de recherches, leads générés. Lors du paiement, vos données bancaires sont traitées directement par Stripe et ne transitent jamais par nos serveurs.</p>
      <h3 style={h3}>2. Finalité du traitement</h3>
      <p style={p}>Vos données sont utilisées pour : fournir le service de génération de leads, gérer votre compte et vos crédits, vous contacter en cas de besoin (support, mises à jour importantes). Nous ne vendons ni ne partageons vos données personnelles avec des tiers à des fins commerciales.</p>
      <h3 style={h3}>3. Durée de conservation</h3>
      <p style={p}>Vos données de compte sont conservées tant que votre compte est actif. Vos leads et historique de recherche sont conservés tant que votre compte existe. Vous pouvez demander la suppression de votre compte et de toutes vos données à tout moment en contactant hello@huntly.fr.</p>
      <h3 style={h3}>4. Données des leads générés</h3>
      <p style={p}>Les informations sur les entreprises (noms, emails, téléphones) sont obtenues à partir de sources publiquement accessibles sur le web (sites d'entreprises, annuaires professionnels, réseaux sociaux publics). Aucune donnée n'est obtenue par des moyens illicites.</p>
      <h3 style={h3}>5. Sécurité</h3>
      <p style={p}>Nous mettons en œuvre des mesures techniques et organisationnelles appropriées : chiffrement des mots de passe (bcrypt), connexions HTTPS, tokens JWT pour l'authentification, hébergement sécurisé.</p>
      <h3 style={h3}>6. Vos droits</h3>
      <p style={p}>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression, de limitation du traitement et de portabilité de vos données. Pour exercer ces droits : hello@huntly.fr.</p>
    </>)}

    {page === "cgu" && (<>
      <h2 style={h2}>Conditions Générales d'Utilisation</h2>
      <h3 style={h3}>1. Objet</h3>
      <p style={p}>Les présentes CGU régissent l'utilisation du service Huntly, un outil de génération de leads B2B propulsé par intelligence artificielle. En utilisant le service, vous acceptez les présentes conditions.</p>
      <h3 style={h3}>2. Description du service</h3>
      <p style={p}>Huntly permet de rechercher des entreprises correspondant à des critères (secteur d'activité, localisation) et de recevoir des informations de contact (nom, email, téléphone, site web) extraites de sources publiques sur le web.</p>
      <h3 style={h3}>3. Inscription et compte</h3>
      <p style={p}>L'accès au service nécessite la création d'un compte. Vous êtes responsable de la confidentialité de vos identifiants. Vous devez fournir des informations exactes lors de l'inscription.</p>
      <h3 style={h3}>4. Crédits et paiement</h3>
      <p style={p}>Le service fonctionne sur un système de crédits prépayés. 1 crédit = 1 lead généré. Les crédits achetés n'expirent pas et ne sont pas remboursables sauf en cas de défaut du service. Les paiements sont traités par Stripe de manière sécurisée.</p>
      <h3 style={h3}>5. Utilisation acceptable</h3>
      <p style={p}>Vous vous engagez à utiliser le service conformément à la législation en vigueur, notamment le RGPD. Il est interdit d'utiliser les données obtenues pour du spam, du harcèlement ou toute activité illégale. Vous êtes responsable de l'usage que vous faites des leads obtenus.</p>
      <h3 style={h3}>6. Limitation de responsabilité</h3>
      <p style={p}>Les informations fournies par Huntly proviennent de sources publiques et sont générées par intelligence artificielle. Nous ne garantissons pas l'exactitude, l'exhaustivité ou l'actualité des données. Huntly ne saurait être tenu responsable des dommages directs ou indirects résultant de l'utilisation des données fournies.</p>
      <h3 style={h3}>7. Modification des CGU</h3>
      <p style={p}>Nous nous réservons le droit de modifier les présentes CGU. Les utilisateurs seront informés de toute modification substantielle par email.</p>
      <h3 style={h3}>8. Droit applicable</h3>
      <p style={p}>Les présentes CGU sont régies par le droit français. Tout litige sera soumis aux tribunaux compétents de [Ville].</p>
      <p style={p}>Dernière mise à jour : septembre 2026.</p>
    </>)}
  </div>);
}

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [ready, setReady] = useState(false);
  const [modalStep, setModalStep] = useState(null);
  const [view, setView] = useState("search");
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [target, setTarget] = useState("");
  const [count, setCount] = useState("10");
  const [picked, setPicked] = useState([]);
  const [searchMode, setSearchMode] = useState("b2b");  // b2b | audiences
  const [audienceResults, setAudienceResults] = useState(null);
  const [toast, setToast] = useState(null);
  const [emailModal, setEmailModal] = useState(null);
  const [genEmail, setGenEmail] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [legalPage, setLegalPage] = useState(null);
  const resRef = useRef(null);
  const formRef = useRef(null);
  const flash = m => { setToast(m); setTimeout(() => setToast(null), 2500); };
  const loggedIn = !!token;

  useEffect(() => {
    (async () => {
      const t = loadToken();
      if (t) { try { const d = await api("/auth?action=me", { token: t }); setToken(t); setUser(d.user); setBalance(d.balance);
        try { const h = await api("/leads?action=history", { token: t }); setHistory(h.searches || []); } catch {} } catch { clearToken(); } }
      setReady(true);
      const params = new URLSearchParams(window.location.search);
      if (params.get("status") === "success") { window.history.replaceState({}, "", "/");
        setTimeout(() => { const t2 = loadToken(); if (t2) api("/auth?action=me", { token: t2 }).then(d => { setBalance(d.balance); flash("Crédits ajoutés !"); }).catch(() => {}); }, 1000); }
    })();
  }, []);

  const toggleNiche = (n) => {
    const next = picked.includes(n.i) ? picked.filter(x => x !== n.i) : [...picked, n.i];
    setPicked(next);
    setIndustry(next.join(", "));
    setTarget(next.map(id => NICHES.find(nn => nn.i === id)).filter(Boolean).map(nn => nn.t).join(", "));
  };

  const scrollToForm = () => { formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); };

  const onAuth = (t, u, b) => { setToken(t); setUser(u); setBalance(b); b < 1 ? setModalStep("pay") : (() => { setModalStep(null); doSearch(t); })(); };
  const logout = () => { clearToken(); setToken(null); setUser(null); setBalance(0); setResults(null); setHistory([]); };

  const handleSearch = () => {
    if (!industry.trim() || !location.trim()) { setError("Choisis un secteur et une ville."); return; }
    setError(null);
    if (!loggedIn) { setModalStep("auth"); return; }
    if (balance < 1) { setModalStep("pay"); return; }
    if (searchMode === "audiences") { doAudienceSearch(token); } else { doSearch(token); }
  };

  const doAudienceSearch = async (t) => {
    setModalStep(null); setLoading(true); setError(null); setAudienceResults(null); setResults(null);
    const steps = ["Analyse de la cible…", "Recherche de communautés…", "Identification des groupes…", "Compilation…"];
    let si = 0; setProgress(steps[0]);
    const iv = setInterval(() => { si = Math.min(si + 1, steps.length - 1); setProgress(steps[si]); }, 5000);
    try {
      const d = await api("/leads?action=generate-audiences", { method: "POST", token: t, body: { industry, location, target, count: parseInt(count) || 10 } });
      setAudienceResults({ audiences: d.audiences, meta: d.meta }); setBalance(d.balance);
      flash(d.audiences.length + " audience" + (d.audiences.length > 1 ? "s" : "") + " trouvée" + (d.audiences.length > 1 ? "s" : ""));
    } catch (e) { setError(e.message); } finally { clearInterval(iv); setLoading(false); setProgress(""); }
  };

  const doSearch = async (t) => {
    setModalStep(null); setLoading(true); setError(null); setResults(null); setExpandedId(null);
    const steps = ["Analyse du marché…", "Recherche d'entreprises…", "Extraction des contacts…", "Vérification…", "Scoring…"];
    let si = 0; setProgress(steps[0]);
    const iv = setInterval(() => { si = Math.min(si + 1, steps.length - 1); setProgress(steps[si]); }, 5000);
    try {
      const d = await api("/leads?action=generate", { method: "POST", token: t, body: { industry, location, target, count: parseInt(count) || 10 } });
      setResults({ leads: d.leads, meta: d.meta }); setBalance(d.balance);
      try { const h = await api("/leads?action=history", { token: t }); setHistory(h.searches || []); } catch {}
      flash(d.meta.new_count + " nouveau" + (d.meta.new_count > 1 ? "x" : "") + (d.meta.duplicate_count > 0 ? " · " + d.meta.duplicate_count + " doublon" + (d.meta.duplicate_count > 1 ? "s" : "") + " ignoré" + (d.meta.duplicate_count > 1 ? "s" : "") : ""));
      setTimeout(() => resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    } catch (e) { setError(e.message); } finally { clearInterval(iv); setLoading(false); setProgress(""); }
  };

  const exportCSV = async () => {
    try { const r = await fetch("/api/leads?action=export", { headers: { Authorization: "Bearer " + token } });
      const b = await r.blob(); const a = document.createElement("a"); a.href = URL.createObjectURL(b);
      a.download = "leads-" + new Date().toISOString().slice(0, 10) + ".csv"; a.click(); flash("CSV téléchargé");
    } catch { flash("Erreur"); }
  };

  const generateEmail = async (lead) => {
    setEmailModal(lead); setGenEmail(null); setGenLoading(true);
    try {
      const d = await api("/leads?action=generate-email", { method: "POST", token, body: { lead, userCompany: user?.company || "", userActivity: "" } });
      setGenEmail(d.email); setBalance(d.balance);
    } catch (e) { flash("Erreur: " + e.message); setEmailModal(null); }
    setGenLoading(false);
  };

  const goHome = () => { setView("search"); setResults(null); setAudienceResults(null); setLegalPage(null); setError(null); setExpandedId(null); setPicked([]); setIndustry(""); setTarget(""); setLocation(""); window.scrollTo(0, 0); };

  if (!ready) return <div style={S.ctr}><div style={S.spin} /></div>;

  const showLanding = !loggedIn && !results && !loading;

  return (
    <div style={S.root}>
      {toast && <div style={S.toast}>{toast}</div>}
      {emailModal && (
        <div style={S.overlay} onClick={() => setEmailModal(null)}><div style={{...S.modal, maxWidth: 520}} onClick={e => e.stopPropagation()}>
          <button style={S.closeBtn} onClick={() => setEmailModal(null)}>✕</button>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Email pour {emailModal.company}</h2>
          {genLoading ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}><div style={S.spin} /><p style={{ marginTop: 12, color: "#64748b", fontSize: 13 }}>Rédaction en cours...</p></div>
          ) : genEmail ? (
            <div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>OBJET</div>
                <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 8, fontSize: 14, fontWeight: 600 }}>{genEmail.subject}</div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>CORPS</div>
                <div style={{ padding: "14px", background: "#f8fafc", borderRadius: 8, fontSize: 13.5, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{genEmail.body}</div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button className="cta-btn" style={{ ...S.pBtn, background: "#0f172a", fontSize: 13 }} onClick={() => { navigator.clipboard.writeText("Objet: " + genEmail.subject + "\n\n" + genEmail.body); flash("Copié !"); }}>Copier l'email</button>
                {emailModal.email && <a href={"mailto:" + emailModal.email + "?subject=" + encodeURIComponent(genEmail.subject) + "&body=" + encodeURIComponent(genEmail.body)} style={{ ...S.gBtn, display: "flex", alignItems: "center", justifyContent: "center", flex: 1, textDecoration: "none", textAlign: "center" }}>Ouvrir dans Mail</a>}
              </div>
              <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 8, textAlign: "center" }}>1 crédit utilisé</p>
            </div>
          ) : null}
        </div></div>
      )}
      {modalStep && <StepModal step={modalStep} count={count} onAuth={onAuth} onPaid={token} onClose={() => setModalStep(null)} />}

      <div style={S.topBar}>
        <button style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={goHome}><Logo small /></button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {loggedIn ? (<>
            <button className="gb" style={{ ...S.creditBtn, ...(balance < 3 ? { borderColor: "#fecaca", background: "#fef2f2" } : {}) }} onClick={() => setModalStep("pay")}>
              <span style={{ fontSize: 16, fontWeight: 800, color: balance > 5 ? "#0f172a" : balance > 0 ? "#f59e0b" : "#ef4444" }}>{balance}</span>
              <span style={{ fontSize: 11, color: "#64748b" }}>crédits</span>
            </button>
            {history.length > 0 && view === "search" && <button className="gb" style={S.gBtnS} onClick={() => setView("history")}>Historique</button>}
            {view !== "search" && <button className="gb" style={S.gBtnS} onClick={() => setView("search")}>← Recherche</button>}
            <button style={S.avBtn} onClick={() => view === "account" ? setView("search") : setView("account")}>{(user?.name || "U")[0].toUpperCase()}</button>
          </>) : (
            <button className="gb" style={{ ...S.gBtn, fontWeight: 700 }} onClick={() => setModalStep("auth")}>Connexion</button>
          )}
        </div>
      </div>

      {!legalPage && view === "account" && (<div>
        <button style={S.bkBtn} onClick={() => setView("search")}>← Retour</button>
        <div style={S.card}><div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}><div style={S.av}>{(user?.name || "U")[0].toUpperCase()}</div><div><div style={{ fontWeight: 700, fontSize: 17 }}>{user?.name}</div><div style={{ fontSize: 13, color: "#64748b" }}>{user?.email}</div></div></div>
          <div style={{ display: "flex", gap: 10 }}><div style={{ flex: 1, background: "#f8fafc", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800 }}>{balance}</div><div style={{ fontSize: 12, color: "#64748b" }}>crédits</div></div><div style={{ flex: 1, background: "#f8fafc", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800 }}>{history.length}</div><div style={{ fontSize: 12, color: "#64748b" }}>recherches</div></div></div>
        </div>
        <button className="cta-btn" style={{ ...S.pBtn, marginBottom: 10, background: "#0f172a" }} onClick={() => setModalStep("pay")}>Acheter des crédits</button>
        <button className="gb" style={{ ...S.gBtn, color: "#94a3b8" }} onClick={logout}>Se déconnecter</button>
      </div>)}

      {legalPage && (<LegalPage page={legalPage} onBack={() => setLegalPage(null)} />)}

      {!legalPage && view === "history" && (<div><h2 style={S.secT}>Historique</h2>
        {history.map(h => (<div key={h.id} className="hi" style={S.histI} onClick={() => { setIndustry(h.industry); setLocation(h.location); setTarget(h.target || ""); setPicked([]); setView("search"); }}>
          <div><div style={{ fontWeight: 600, fontSize: 14 }}>{h.industry}</div><div style={{ fontSize: 13, color: "#64748b" }}>{h.location} · {h.lead_count} leads</div></div>
          <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 600 }}>Relancer →</span>
        </div>))}
      </div>)}

      {!legalPage && view === "search" && (<>
        {/* HERO */}
        {showLanding && (<div className="hero-gradient" style={{ textAlign: "center", padding: "48px 16px 8px", margin: "0 -16px", borderRadius: "0 0 24px 24px" }}>
          <div style={{ display: "inline-block", padding: "5px 16px", borderRadius: 20, background: "#fff", border: "1px solid #e5e7eb", fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,.04)" }}>✨ Propulsé par l'intelligence artificielle</div>
          <h1 className="hero-title" style={{ fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.15, color: "#0f172a", marginBottom: 16 }}>Trouvez des clients<br />pour n'importe<br />quel business</h1>
          <p className="hero-sub" style={{ color: "#475569", maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.6 }}>Choisissez un secteur et une ville. En 30 secondes, l'IA vous livre une liste de prospects avec email, téléphone et contact clé.</p>
          <button className="cta-btn" onClick={scrollToForm} style={{ padding: "14px 36px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer", marginBottom: 24, transition: "all .15s", boxShadow: "0 4px 14px rgba(0,0,0,.3)" }}>Essayer maintenant ↓</button>
        </div>)}

        {!results && !loading && loggedIn && (<div style={{ padding: "12px 0 4px" }}><h2 style={{ fontSize: 22, fontWeight: 800 }}>Nouvelle recherche</h2></div>)}

        {/* SEARCH FORM */}
        <div ref={formRef} style={{ ...S.sCard, ...(showLanding ? { marginTop: 24, boxShadow: "0 4px 20px rgba(0,0,0,.06)" } : {}) }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 14, background: "#f1f5f9", borderRadius: 8, padding: 3 }}>
              <button onClick={() => { setSearchMode("b2b"); setAudienceResults(null); }} style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s", background: searchMode === "b2b" ? "#fff" : "transparent", color: searchMode === "b2b" ? "#0f172a" : "#64748b", boxShadow: searchMode === "b2b" ? "0 1px 3px rgba(0,0,0,.08)" : "none" }}>🏢 Entreprises (B2B)</button>
              <button onClick={() => { setSearchMode("audiences"); setResults(null); }} style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s", background: searchMode === "audiences" ? "#fff" : "transparent", color: searchMode === "audiences" ? "#0f172a" : "#64748b", boxShadow: searchMode === "audiences" ? "0 1px 3px rgba(0,0,0,.08)" : "none" }}>👥 Audiences (B2C)</button>
            </div>
            <div className="niche-grid" style={S.nGrid}>{NICHES.map(n => (
            <button key={n.l} className="nb" style={{ ...S.nBtn, ...(picked.includes(n.i) ? { borderColor: "#0f172a", background: "#f1f5f9" } : {}) }} onClick={() => toggleNiche(n)}>
              <span style={{ fontSize: 17 }}>{n.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: picked.includes(n.i) ? "#0f172a" : "#475569" }}>{n.l}</span>
            </button>))}</div>
          <div className="form-row" style={S.fRow}>
            <Input label="Secteur d'activité" value={industry} onChange={e => { setIndustry(e.target.value); setPicked([]); }} placeholder="Ex : Plombiers, Restaurants, Avocats…" />
            <Input label="Ville / Région" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex : Marseille, Île-de-France…" />
          </div>
          <div className="form-row" style={S.fRow}>
            <div style={{ flex: 2 }}><Input label="Cible (optionnel)" value={target} onChange={e => setTarget(e.target.value)} placeholder="Ex : Indépendants, +10 employés…" /></div>
            <div style={{ flex: 0, minWidth: 90 }}><label style={S.label}>Quantité</label><select style={S.input} value={count} onChange={e => setCount(e.target.value)}>{[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
          </div>
          {loggedIn && <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 0" }}>Solde : {balance} crédits</p>}
          {error && <div style={S.errBox}>{error}</div>}
          <button className="cta-btn" style={{ ...S.pBtn, marginTop: 10, background: "#0f172a", ...(loading ? { opacity: .7, pointerEvents: "none" } : {}) }} onClick={handleSearch}>
            {loading ? <><span style={S.spn} />{progress}</> : searchMode === "audiences" ? "Trouver des audiences →" : "Trouver " + (parseInt(count) || 10) + " prospects →"}
          </button>
        </div>

        {loading && <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>{[1, 2, 3].map(i => <div key={i} style={S.skel}><div style={{ ...S.skelL, width: "50%" }} /><div style={{ ...S.skelL, width: "30%", height: 10, marginTop: 6 }} /></div>)}</div>}

        {results && (<div ref={resRef}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", margin: "20px 0 10px", flexWrap: "wrap", gap: 12 }}>
            <div><h2 style={S.secT}>{results.meta.count} prospect{results.meta.count > 1 ? "s" : ""}</h2><p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>{results.meta.industry} · {results.meta.location}</p></div>
            <button className="gb" style={S.gBtn} onClick={exportCSV}>↓ Exporter CSV</button>
          </div>
          {results.leads.map((l, i) => (
            <div key={i} className="lc" style={{ ...S.lCard, animationDelay: `${i * .04}s`, ...(expandedId === i ? { borderColor: "#334155" } : {}) }} onClick={() => setExpandedId(expandedId === i ? null : i)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{l.company}</div><div style={{ fontSize: 12, color: "#94a3b8" }}>{l.industry} · {l.location}</div></div>
                <div style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: l.score >= 80 ? "#059669" : l.score >= 65 ? "#d97706" : "#94a3b8", background: l.score >= 80 ? "#ecfdf5" : l.score >= 65 ? "#fffbeb" : "#f8fafc" }}>{l.score}%</div>
              </div>
              <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.5, margin: "8px 0 10px" }}>{l.description}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {l.size && <span style={S.ch}>👥 {l.size}</span>}
                {l.website && <a href={l.website} target="_blank" rel="noopener noreferrer" style={S.chL} onClick={e => e.stopPropagation()}>🌐 Site</a>}
                {l.linkedin && <a href={l.linkedin} target="_blank" rel="noopener noreferrer" style={S.chL} onClick={e => e.stopPropagation()}>💼 LinkedIn</a>}
                {l.email && <span style={l.email_verified ? S.chOk : S.chWarn}>{l.email_verified ? "✉️ Email vérifié" : "✉️ Email non vérifié"}</span>}{l.phone && <span style={S.chOk}>📞 Tél.</span>}{l.is_duplicate && <span style={S.chDup}>🔄 Doublon</span>}
              </div>
              {expandedId === i && (<div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9", animation: "slideUp .2s ease" }}><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 18px" }}>
                {l.contact_name && <div><div style={S.dl}>Contact</div><div style={S.dv}>{l.contact_name}{l.contact_role ? " — " + l.contact_role : ""}</div></div>}
                {l.email && <div><div style={S.dl}>Email</div><a href={"mailto:" + l.email} style={S.da}>{l.email}</a></div>}
                {l.phone && <div><div style={S.dl}>Téléphone</div><a href={"tel:" + l.phone} style={S.da}>{l.phone}</a></div>}
                {l.website && <div><div style={S.dl}>Site</div><a href={l.website} target="_blank" rel="noopener noreferrer" style={S.da}>{l.website}</a></div>}
                {l.reason && <div style={{ gridColumn: "1/-1" }}><div style={S.dl}>Pertinence</div><div style={S.dv}>{l.reason}</div></div>}
              </div>
              <button className="cta-btn" onClick={(e) => { e.stopPropagation(); generateEmail(l); }} style={{ marginTop: 12, padding: "9px 16px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", width: "100%" }}>✍️ Générer un email de prospection</button>
              </div>)}
            </div>))}
          {balance < 5 && (<div style={S.ups}><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{balance > 0 ? "Il vous reste " + balance + " crédit" + (balance > 1 ? "s" : "") : "Plus de crédits"}</div><div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Rechargez pour continuer.</div><button className="cta-btn" style={{ ...S.pBtn, padding: "10px 24px", fontSize: 14, background: "#0f172a" }} onClick={() => setModalStep("pay")}>Acheter des crédits</button></div>)}
        </div>)}

        {audienceResults && (<div>
          <div style={{ margin: "20px 0 10px" }}>
            <h2 style={S.secT}>{audienceResults.meta.count} audience{audienceResults.meta.count > 1 ? "s" : ""} trouvée{audienceResults.meta.count > 1 ? "s" : ""}</h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>{audienceResults.meta.industry} · {audienceResults.meta.location}</p>
          </div>
          {audienceResults.audiences.map((a, i) => (
            <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px", marginBottom: 8, animation: "slideUp .3s ease both", animationDelay: i * 0.04 + "s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{a.platform} · {a.location}</div>
                </div>
                {a.members && <div style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: "#0f172a", background: "#f1f5f9" }}>{a.members}</div>}
              </div>
              <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.5, margin: "0 0 8px" }}>{a.description}</p>
              {a.relevance && <p style={{ fontSize: 12, color: "#059669", margin: "0 0 6px" }}>🎯 {a.relevance}</p>}
              {a.tip && <p style={{ fontSize: 12, color: "#1e293b", margin: "0 0 8px", fontStyle: "italic" }}>💡 {a.tip}</p>}
              <div style={{ display: "flex", gap: 6 }}>
                {a.url && <a href={a.url} target="_blank" rel="noopener noreferrer" style={S.chL} onClick={e => e.stopPropagation()}>🔗 Ouvrir</a>}
                <span style={S.ch}>{a.platform}</span>
              </div>
            </div>
          ))}
          {balance < 5 && (<div style={S.ups}><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Plus de crédits</div><div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Rechargez pour continuer.</div><button className="cta-btn" style={{ ...S.pBtn, padding: "10px 24px", fontSize: 14, background: "#0f172a" }} onClick={() => setModalStep("pay")}>Acheter des crédits</button></div>)}
        </div>)}

        {showLanding && <LandingSections onCta={scrollToForm} onMentions={() => { setLegalPage("mentions"); window.scrollTo(0,0); }} onConfidentialite={() => { setLegalPage("confidentialite"); window.scrollTo(0,0); }} onCgu={() => { setLegalPage("cgu"); window.scrollTo(0,0); }} />}
      </>)}
    </div>
  );
}

const S = {
  root: { maxWidth: 1100, margin: "0 auto", padding: "0 24px 0" },
  ctr: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 },
  spin: { width: 28, height: 28, border: "3px solid #e5e7eb", borderTopColor: "#0f172a", borderRadius: "50%", animation: "spin .7s linear infinite" },
  spn: { display: "inline-block", width: 15, height: 15, border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .6s linear infinite", marginRight: 8 },
  toast: { position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#0f172a", color: "#fff", padding: "12px 24px", borderRadius: 12, fontSize: 14, fontWeight: 600, zIndex: 999, boxShadow: "0 8px 32px rgba(0,0,0,.2)" },
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 900, padding: 16, backdropFilter: "blur(8px)" },
  modal: { background: "#fff", borderRadius: 20, padding: "32px", width: "100%", maxWidth: 420, position: "relative", animation: "slideUp .3s ease", boxShadow: "0 24px 48px rgba(0,0,0,.12)" },
  closeBtn: { position: "absolute", top: 16, right: 16, background: "#f8fafc", border: "none", width: 32, height: 32, borderRadius: "50%", fontSize: 16, color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  pBtn: { width: "100%", padding: "13px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" },
  gBtn: { padding: "8px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer", transition: "all .15s" },
  gBtnS: { padding: "6px 14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer", transition: "all .15s" },
  bkBtn: { background: "none", border: "none", color: "#0f172a", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 16px", display: "flex", alignItems: "center", gap: 4 },
  tBtn: { background: "none", border: "none", color: "#0f172a", fontWeight: 600, cursor: "pointer", fontSize: 13, padding: 0, textDecoration: "none" },
  errBox: { margin: "12px 0", padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#dc2626", fontSize: 13, fontWeight: 500 },
  card: { background: "#fff", border: "1px solid #f1f5f9", borderRadius: 14, padding: "20px", marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,.04)" },
  label: { fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 },
  input: { padding: "11px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", color: "#1e293b", width: "100%", boxSizing: "border-box", background: "#fff", transition: "all .15s" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0 20px", flexWrap: "wrap", gap: 12 },
  creditBtn: { display: "flex", flexDirection: "column", alignItems: "center", background: "#fff", borderRadius: 10, padding: "4px 16px", lineHeight: 1.2, border: "1px solid #e2e8f0", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,.04)", transition: "all .15s" },
  avBtn: { width: 36, height: 36, borderRadius: 10, background: "#0f172a", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" },
  av: { width: 52, height: 52, borderRadius: 14, background: "#f1f5f9", color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18 },
  sCard: { background: "#fff", border: "1px solid #f1f5f9", borderRadius: 16, padding: "24px", marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,.04)", maxWidth: 800, margin: "0 auto 12px", transition: "box-shadow .2s" },
  nGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))", gap: 6, marginBottom: 16 },
  nBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 4px", borderRadius: 10, border: "1px solid #f1f5f9", background: "#fff", cursor: "pointer", transition: "all .15s" },
  fRow: { display: "flex", gap: 12, marginBottom: 10, flexWrap: "wrap" },
  skel: { background: "#fff", borderRadius: 14, padding: "20px", animation: "pulse 1.3s ease-in-out infinite", border: "1px solid #f1f5f9", maxWidth: 800, margin: "0 auto 8px", boxShadow: "0 1px 3px rgba(0,0,0,.04)" },
  skelL: { height: 14, background: "#f1f5f9", borderRadius: 8 },
  secT: { fontSize: 18, fontWeight: 800, margin: 0, color: "#0f172a", letterSpacing: "-0.02em" },
  histI: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#fff", border: "1px solid #f1f5f9", borderRadius: 12, marginBottom: 8, cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,.04)", transition: "all .15s" },
  lCard: { background: "#fff", border: "1px solid #f1f5f9", borderRadius: 14, padding: "18px 22px", marginBottom: 10, cursor: "pointer", transition: "all .15s ease", animation: "slideUp .3s ease both", boxShadow: "0 1px 3px rgba(0,0,0,.04)", maxWidth: 800, margin: "0 auto 10px" },
  ch: { padding: "4px 10px", background: "#f8fafc", borderRadius: 8, fontSize: 12, color: "#64748b", fontWeight: 500 },
  chL: { padding: "4px 10px", background: "#f1f5f9", borderRadius: 8, fontSize: 12, color: "#0f172a", textDecoration: "none", fontWeight: 600 },
  chOk: { padding: "4px 10px", background: "#ecfdf5", borderRadius: 8, fontSize: 12, color: "#059669", fontWeight: 600 },
  chWarn: { padding: "4px 10px", background: "#fffbeb", borderRadius: 8, fontSize: 12, color: "#d97706", fontWeight: 500 },
  chDup: { padding: "4px 10px", background: "#f1f5f9", borderRadius: 8, fontSize: 12, color: "#94a3b8", fontStyle: "italic" },
  dl: { fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: ".05em", textTransform: "uppercase" },
  dv: { fontSize: 14, color: "#1e293b", lineHeight: 1.5, marginTop: 2 },
  da: { fontSize: 14, color: "#0f172a", textDecoration: "none", fontWeight: 500 },
  ups: { border: "2px solid #0f172a", borderRadius: 16, padding: "28px", marginTop: 24, background: "linear-gradient(135deg, #f8fafc, #f1f5f9)", maxWidth: 800, margin: "24px auto 0" },
  packRow: { display: "flex", alignItems: "center", width: "100%", padding: "16px 18px", border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff", cursor: "pointer", position: "relative", transition: "all .15s" },
};
