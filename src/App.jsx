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
  starter: { credits: 50, price: "9€", per: "0,18€/lead" },
  pro: { credits: 200, price: "29€", per: "0,15€/lead", popular: true },
  business: { credits: 500, price: "59€", per: "0,12€/lead" },
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
const FAKE_LEADS = [
  { company: "Plomberie Martin & Fils", location: "Lyon 3e", score: 92, email: true, phone: true },
  { company: "Atelier Duval Rénovation", location: "Villeurbanne", score: 87, email: true, phone: false },
  { company: "SOS Dépannage Express", location: "Lyon 7e", score: 84, email: true, phone: true },
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
      <rect width={z} height={z} rx="8" fill="#4f46e5"/>
      <circle cx={c} cy={c} r={z*0.31} fill="none" stroke="white" strokeWidth="2"/>
      <circle cx={c} cy={c} r={z*0.15} fill="none" stroke="white" strokeWidth="2"/>
      <circle cx={c} cy={c} r={z*0.055} fill="white"/>
    </svg>
    <span style={{ fontSize: small ? 16 : 22, fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a" }}>Huntly</span>
  </div>);
}

/* ─── STEP MODAL ─── */
function StepModal({ step, onAuth, onPaid, onClose, count }) {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [name, setName] = useState(""); const [company, setCompany] = useState("");
  const [err, setErr] = useState(""); const [ld, setLd] = useState(false);
  const [buying, setBuying] = useState(null);

  const doAuth = async () => {
    setErr(""); setLd(true);
    try {
      const action = mode === "signup" ? "signup" : "login";
      const bd = mode === "signup" ? { email, password: pw, name, company } : { email, password: pw };
      const d = await api("/auth?action=" + action, { method: "POST", body: bd });
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
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: step === "auth" ? "#0f172a" : "#059669", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{step === "auth" ? "1" : "✓"}</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: step === "auth" ? "#0f172a" : "#059669" }}>Compte</span>
        </div>
        <div style={{ width: 24, height: 1, background: "#e5e7eb", alignSelf: "center" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: step === "pay" ? "#0f172a" : "#e5e7eb", color: step === "pay" ? "#fff" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>2</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: step === "pay" ? "#0f172a" : "#94a3b8" }}>Crédits</span>
        </div>
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
        <button style={{ ...S.pBtn, marginTop: 16, ...(ld ? { opacity: .7, pointerEvents: "none" } : {}) }} onClick={doAuth}>{ld ? <span style={S.spn} /> : "Continuer →"}</button>
        <div style={{ textAlign: "center", marginTop: 12, fontSize: 13, color: "#64748b" }}>
          {mode === "signup" ? <>Déjà inscrit ? <button style={S.tBtn} onClick={() => { setMode("login"); setErr(""); }}>Connexion</button></> :
            <>Pas de compte ? <button style={S.tBtn} onClick={() => { setMode("signup"); setErr(""); }}>S'inscrire</button></>}
        </div>
      </>)}
      {step === "pay" && (<>
        <h2 style={{ fontSize: 20, fontWeight: 800, textAlign: "center", marginBottom: 2 }}>Choisissez vos crédits</h2>
        <p style={{ fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 16 }}>1 crédit = 1 lead · Paiement sécurisé par Stripe</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(PACKS).map(([id, p]) => (
            <button key={id} className="gb" style={{ ...S.packRow, ...(p.popular ? { border: "2px solid #6366f1", background: "#fafaff" } : {}) }} onClick={() => buy(id, onPaid)}>
              {p.popular && <span style={{ position: "absolute", top: -8, right: 12, fontSize: 10, fontWeight: 700, color: "#6366f1", background: "#eef2ff", padding: "2px 8px", borderRadius: 10 }}>Populaire</span>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <div><div style={{ fontWeight: 700, fontSize: 15 }}>{p.credits} crédits</div><div style={{ fontSize: 12, color: "#94a3b8" }}>{p.per}</div></div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{p.price}</div>
              </div>
            </button>
          ))}
        </div>
      </>)}
    </div></div>
  );
}

/* ─── SEARCH FORM ─── */
function SearchForm({ industry, setIndustry, location, setLocation, target, setTarget, count, setCount, onSearch, loading, progress, error, loggedIn, balance }) {
  return (
    <div style={S.sCard}>
      <div style={S.nGrid}>{NICHES.map(n => (
        <button key={n.l} className="nb" style={{ ...S.nBtn, ...(industry === n.i ? { borderColor: "#6366f1", background: "#eef2ff" } : {}) }} onClick={() => { setIndustry(n.i); setTarget(n.t); }}>
          <span style={{ fontSize: 17 }}>{n.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: industry === n.i ? "#4f46e5" : "#475569" }}>{n.l}</span>
        </button>))}</div>
      <div style={S.fRow}>
        <Input label="Secteur d'activité" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="Ex : Plombiers, Restaurants, Avocats…" />
        <Input label="Ville / Région" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex : Marseille, Île-de-France…" />
      </div>
      <div style={S.fRow}>
        <div style={{ flex: 2 }}><Input label="Cible (optionnel)" value={target} onChange={e => setTarget(e.target.value)} placeholder="Ex : Indépendants, +10 employés…" /></div>
        <div style={{ flex: 0, minWidth: 90 }}><label style={S.label}>Quantité</label><select style={S.input} value={count} onChange={e => setCount(e.target.value)}>{[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
      </div>
      {loggedIn && <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 0" }}>Solde : {balance} crédits</p>}
      {error && <div style={S.errBox}>{error}</div>}
      <button style={{ ...S.pBtn, marginTop: 10, ...(loading ? { opacity: .7, pointerEvents: "none" } : {}) }} onClick={onSearch}>
        {loading ? <><span style={S.spn} />{progress}</> : "Trouver " + (parseInt(count) || 10) + " prospects →"}
      </button>
    </div>
  );
}

/* ─── LANDING SECTIONS ─── */
function LandingSections() {
  return (<>
    {/* HOW IT WORKS */}
    <div style={{ padding: "48px 0 32px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 32, letterSpacing: "-0.02em" }}>Comment ça marche</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
        {[
          { n: "1", title: "Choisissez votre cible", desc: "Sélectionnez un secteur et une ville. Plus de 12 niches pré-configurées pour démarrer en 1 clic." },
          { n: "2", title: "L'IA cherche pour vous", desc: "Notre IA parcourt le web en temps réel et identifie des entreprises correspondant à vos critères." },
          { n: "3", title: "Récupérez vos leads", desc: "Nom, email, téléphone, site web, dirigeant — tout est prêt. Exportez en CSV en 1 clic." },
        ].map(s => (
          <div key={s.n} style={{ textAlign: "center", padding: "0 8px" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, margin: "0 auto 12px" }}>{s.n}</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{s.title}</div>
            <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </div>

    {/* PREVIEW */}
    <div style={{ padding: "24px 0 32px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 8, letterSpacing: "-0.02em" }}>Ce que vous obtenez</h2>
      <p style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 20 }}>Exemple : recherche "Plombiers à Lyon"</p>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
        {FAKE_LEADS.map((l, i) => (
          <div key={i} style={{ padding: "14px 18px", borderBottom: i < 2 ? "1px solid #f1f5f9" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{l.company}</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>{l.location}</div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {l.email && <span style={S.chOk}>✉️</span>}
              {l.phone && <span style={S.chOk}>📞</span>}
              <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: "#059669", background: "#ecfdf5" }}>{l.score}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* PRICING */}
    <div style={{ padding: "24px 0 32px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 8, letterSpacing: "-0.02em" }}>Tarifs simples, sans engagement</h2>
      <p style={{ fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 20 }}>Payez uniquement ce que vous utilisez. 1 crédit = 1 lead.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, maxWidth: 540, margin: "0 auto" }}>
        {Object.entries(PACKS).map(([id, p]) => (
          <div key={id} style={{ ...S.card, ...(p.popular ? { border: "2px solid #6366f1" } : {}), textAlign: "center", position: "relative", padding: "24px 16px" }}>
            {p.popular && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", fontSize: 11, fontWeight: 700, color: "#6366f1", background: "#eef2ff", padding: "2px 12px", borderRadius: 20, whiteSpace: "nowrap" }}>Le + populaire</div>}
            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>{p.price}</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{p.credits} crédits</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{p.per}</div>
          </div>
        ))}
      </div>
    </div>

    {/* FAQ */}
    <div style={{ padding: "24px 0 40px" }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 20, letterSpacing: "-0.02em" }}>Questions fréquentes</h2>
      {[
        { q: "D'où viennent les données ?", a: "L'IA recherche en temps réel sur le web — sites d'entreprises, annuaires, LinkedIn, pages légales. Aucune base de données statique." },
        { q: "Est-ce que les contacts sont fiables ?", a: "Chaque lead a un score de pertinence. Les emails et téléphones sont extraits de sources publiques et vérifiés quand c'est possible." },
        { q: "Les crédits expirent-ils ?", a: "Non. Vos crédits sont valables à vie, sans limite de temps." },
        { q: "Puis-je exporter mes leads ?", a: "Oui, en CSV en un clic. Compatible avec tous les CRM et tableurs." },
        { q: "Est-ce conforme au RGPD ?", a: "Les données sont issues de sources publiques. Aucune donnée personnelle n'est stockée au-delà de votre compte." },
      ].map(f => (
        <div key={f.q} style={{ borderBottom: "1px solid #f1f5f9", padding: "14px 0" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{f.q}</div>
          <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{f.a}</div>
        </div>
      ))}
    </div>

    {/* FOOTER */}
    <div style={{ textAlign: "center", padding: "24px 0 16px", borderTop: "1px solid #f1f5f9" }}>
      <p style={{ fontSize: 12, color: "#94a3b8" }}>Huntly · Paiement sécurisé par Stripe · hello@huntly.fr</p>
    </div>
  </>);
}

/* ─── MAIN APP ─── */
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
  const [toast, setToast] = useState(null);
  const resRef = useRef(null);
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

  const onAuth = (t, u, b) => { setToken(t); setUser(u); setBalance(b); b < 1 ? setModalStep("pay") : (() => { setModalStep(null); doSearch(t); })(); };
  const logout = () => { clearToken(); setToken(null); setUser(null); setBalance(0); setResults(null); setHistory([]); };

  const handleSearch = () => {
    if (!industry.trim() || !location.trim()) { setError("Choisis un secteur et une ville."); return; }
    setError(null);
    if (!loggedIn) { setModalStep("auth"); return; }
    if (balance < 1) { setModalStep("pay"); return; }
    doSearch(token);
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
      flash(d.leads.length + " prospect" + (d.leads.length > 1 ? "s" : "") + " trouvé" + (d.leads.length > 1 ? "s" : ""));
      setTimeout(() => resRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    } catch (e) { setError(e.message); } finally { clearInterval(iv); setLoading(false); setProgress(""); }
  };

  const exportCSV = async () => {
    try { const r = await fetch("/api/leads?action=export", { headers: { Authorization: "Bearer " + token } });
      const b = await r.blob(); const a = document.createElement("a"); a.href = URL.createObjectURL(b);
      a.download = "leads-" + new Date().toISOString().slice(0, 10) + ".csv"; a.click(); flash("CSV téléchargé");
    } catch { flash("Erreur"); }
  };

  if (!ready) return <div style={S.ctr}><div style={S.spin} /></div>;

  const showLanding = !loggedIn && !results && !loading;

  return (
    <div style={S.root}>
      {toast && <div style={S.toast}>{toast}</div>}
      {modalStep && <StepModal step={modalStep} count={count} onAuth={onAuth} onPaid={token} onClose={() => setModalStep(null)} />}

      {/* NAV */}
      <div style={S.topBar}>
        <button style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={() => { setView("search"); setResults(null); setError(null); setExpandedId(null); window.scrollTo(0,0); }}><Logo small /></button>
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

      {/* ACCOUNT */}
      {view === "account" && (<div>
        <button style={S.bkBtn} onClick={() => setView("search")}>← Retour</button>
        <div style={S.card}><div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}><div style={S.av}>{(user?.name || "U")[0].toUpperCase()}</div><div><div style={{ fontWeight: 700, fontSize: 17 }}>{user?.name}</div><div style={{ fontSize: 13, color: "#64748b" }}>{user?.email}</div></div></div>
          <div style={{ display: "flex", gap: 10 }}><div style={{ flex: 1, background: "#f8fafc", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800 }}>{balance}</div><div style={{ fontSize: 12, color: "#64748b" }}>crédits</div></div><div style={{ flex: 1, background: "#f8fafc", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800 }}>{history.length}</div><div style={{ fontSize: 12, color: "#64748b" }}>recherches</div></div></div>
        </div>
        <button style={{ ...S.pBtn, marginBottom: 10 }} onClick={() => setModalStep("pay")}>Acheter des crédits</button>
        <button className="gb" style={{ ...S.gBtn, color: "#94a3b8" }} onClick={logout}>Se déconnecter</button>
      </div>)}

      {/* HISTORY */}
      {view === "history" && (<div><h2 style={S.secT}>Historique</h2>
        {history.map(h => (<div key={h.id} className="hi" style={S.histI} onClick={() => { setIndustry(h.industry); setLocation(h.location); setTarget(h.target || ""); setView("search"); }}><div><div style={{ fontWeight: 600, fontSize: 14 }}>{h.industry}</div><div style={{ fontSize: 13, color: "#64748b" }}>{h.location} · {h.lead_count} leads</div></div><span style={{ color: "#6366f1", fontSize: 13, fontWeight: 600 }}>Relancer →</span></div>))}
      </div>)}

      {/* SEARCH VIEW */}
      {view === "search" && (<>
        {/* HERO */}
        {showLanding && (<div style={{ textAlign: "center", padding: "40px 0 4px" }}>
          <div style={{ display: "inline-block", padding: "4px 14px", borderRadius: 20, background: "#eef2ff", fontSize: 13, fontWeight: 600, color: "#6366f1", marginBottom: 16 }}>Trouvez vos clients avec l'IA</div>
          <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, color: "#0f172a", marginBottom: 12 }}>Vos prochains clients<br />sont à un clic</h1>
          <p style={{ fontSize: 16, color: "#64748b", maxWidth: 460, margin: "0 auto 24px", lineHeight: 1.6 }}>Choisissez un secteur, une ville, et recevez une liste de prospects qualifiés avec email, téléphone et contact clé.</p>
        </div>)}

        {!results && !loading && loggedIn && (<div style={{ padding: "12px 0 4px" }}><h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Nouvelle recherche</h2></div>)}

        <SearchForm industry={industry} setIndustry={setIndustry} location={location} setLocation={setLocation} target={target} setTarget={setTarget} count={count} setCount={setCount} onSearch={handleSearch} loading={loading} progress={progress} error={error} loggedIn={loggedIn} balance={balance} />

        {loading && <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{[1, 2, 3].map(i => <div key={i} style={S.skel}><div style={{ ...S.skelL, width: "50%" }} /><div style={{ ...S.skelL, width: "30%", height: 10, marginTop: 6 }} /></div>)}</div>}

        {results && (<div ref={resRef}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", margin: "20px 0 10px", flexWrap: "wrap", gap: 12 }}>
            <div><h2 style={S.secT}>{results.meta.count} prospect{results.meta.count > 1 ? "s" : ""}</h2><p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>{results.meta.industry} · {results.meta.location}</p></div>
            <button className="gb" style={S.gBtn} onClick={exportCSV}>↓ Exporter CSV</button>
          </div>
          {results.leads.map((l, i) => (
            <div key={i} className="lc" style={{ ...S.lCard, animationDelay: `${i * .04}s`, ...(expandedId === i ? { borderColor: "#818cf8" } : {}) }} onClick={() => setExpandedId(expandedId === i ? null : i)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{l.company}</div><div style={{ fontSize: 12, color: "#94a3b8" }}>{l.industry} · {l.location}</div></div>
                <div style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: l.score >= 80 ? "#059669" : l.score >= 65 ? "#d97706" : "#94a3b8", background: l.score >= 80 ? "#ecfdf5" : l.score >= 65 ? "#fffbeb" : "#f8fafc" }}>{l.score}%</div>
              </div>
              <p style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.5, margin: "8px 0 10px" }}>{l.description}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {l.size && <span style={S.ch}>👥 {l.size}</span>}
                {l.website && <a href={l.website} target="_blank" rel="noopener noreferrer" style={S.chL} onClick={e => e.stopPropagation()}>🌐 Site</a>}
                {l.linkedin && <a href={l.linkedin} target="_blank" rel="noopener noreferrer" style={S.chL} onClick={e => e.stopPropagation()}>💼 LinkedIn</a>}
                {l.email && <span style={S.chOk}>✉️ Email</span>}{l.phone && <span style={S.chOk}>📞 Tél.</span>}
              </div>
              {expandedId === i && (<div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9", animation: "slideUp .2s ease" }}><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 18px" }}>
                {l.contact_name && <div><div style={S.dl}>Contact</div><div style={S.dv}>{l.contact_name}{l.contact_role ? " — " + l.contact_role : ""}</div></div>}
                {l.email && <div><div style={S.dl}>Email</div><a href={"mailto:" + l.email} style={S.da}>{l.email}</a></div>}
                {l.phone && <div><div style={S.dl}>Téléphone</div><a href={"tel:" + l.phone} style={S.da}>{l.phone}</a></div>}
                {l.website && <div><div style={S.dl}>Site</div><a href={l.website} target="_blank" rel="noopener noreferrer" style={S.da}>{l.website}</a></div>}
                {l.reason && <div style={{ gridColumn: "1/-1" }}><div style={S.dl}>Pertinence</div><div style={S.dv}>{l.reason}</div></div>}
              </div></div>)}
            </div>))}
          {balance < 5 && (<div style={S.ups}><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{balance > 0 ? "Il vous reste " + balance + " crédit" + (balance > 1 ? "s" : "") : "Plus de crédits"}</div><div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Rechargez pour continuer.</div><button style={{ ...S.pBtn, padding: "10px 24px", fontSize: 14 }} onClick={() => setModalStep("pay")}>Acheter des crédits</button></div>)}
        </div>)}

        {/* LANDING SECTIONS (below search form, only for visitors) */}
        {showLanding && <LandingSections />}
      </>)}
    </div>
  );
}

const S = {
  root: { maxWidth: 800, margin: "0 auto", padding: "0 16px 0" },
  ctr: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 },
  spin: { width: 28, height: 28, border: "3px solid #e5e7eb", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin .7s linear infinite" },
  spn: { display: "inline-block", width: 15, height: 15, border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .6s linear infinite", marginRight: 8 },
  toast: { position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: "#0f172a", color: "#fff", padding: "10px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 999 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 900, padding: 16, backdropFilter: "blur(4px)" },
  modal: { background: "#fff", borderRadius: 16, padding: "28px 28px 24px", width: "100%", maxWidth: 420, position: "relative", animation: "slideUp .25s ease" },
  closeBtn: { position: "absolute", top: 12, right: 14, background: "none", border: "none", fontSize: 18, color: "#94a3b8", cursor: "pointer" },
  pBtn: { width: "100%", padding: "12px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  gBtn: { padding: "8px 14px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" },
  gBtnS: { padding: "5px 12px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" },
  bkBtn: { background: "none", border: "none", color: "#6366f1", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 16px" },
  tBtn: { background: "none", border: "none", color: "#6366f1", fontWeight: 600, cursor: "pointer", fontSize: 13, padding: 0, textDecoration: "underline" },
  errBox: { margin: "10px 0", padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13 },
  card: { border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px", marginBottom: 10 },
  label: { fontSize: 12.5, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 },
  input: { padding: "10px 13px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 14, outline: "none", color: "#1e293b", width: "100%", boxSizing: "border-box" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 16px", flexWrap: "wrap", gap: 10 },
  creditBtn: { display: "flex", flexDirection: "column", alignItems: "center", background: "#f8fafc", borderRadius: 8, padding: "2px 14px", lineHeight: 1.2, border: "1px solid #e5e7eb", cursor: "pointer" },
  avBtn: { width: 34, height: 34, borderRadius: "50%", background: "#0f172a", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  av: { width: 48, height: 48, borderRadius: "50%", background: "#eef2ff", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18 },
  sCard: { border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px", marginBottom: 8 },
  nGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: 5, marginBottom: 14 },
  nBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "9px 4px", borderRadius: 9, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", transition: "all .12s" },
  fRow: { display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" },
  skel: { background: "#f9fafb", borderRadius: 12, padding: "18px 20px", animation: "pulse 1.3s ease-in-out infinite", border: "1px solid #f1f5f9" },
  skelL: { height: 14, background: "#e5e7eb", borderRadius: 6 },
  secT: { fontSize: 18, fontWeight: 800, margin: 0, color: "#0f172a", letterSpacing: "-0.02em" },
  histI: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", border: "1px solid #e5e7eb", borderRadius: 10, marginBottom: 6, cursor: "pointer" },
  lCard: { border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px", marginBottom: 8, cursor: "pointer", transition: "border .12s", animation: "slideUp .3s ease both" },
  ch: { padding: "3px 9px", background: "#f1f5f9", borderRadius: 6, fontSize: 12, color: "#64748b" },
  chL: { padding: "3px 9px", background: "#eef2ff", borderRadius: 6, fontSize: 12, color: "#4f46e5", textDecoration: "none", fontWeight: 500 },
  chOk: { padding: "3px 9px", background: "#ecfdf5", borderRadius: 6, fontSize: 12, color: "#059669", fontWeight: 500 },
  dl: { fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: ".04em" },
  dv: { fontSize: 14, color: "#1e293b", lineHeight: 1.4 },
  da: { fontSize: 14, color: "#4f46e5", textDecoration: "none" },
  ups: { border: "2px solid #6366f1", borderRadius: 14, padding: "24px", marginTop: 20, background: "#fafaff" },
  packRow: { display: "flex", alignItems: "center", width: "100%", padding: "14px 16px", border: "1px solid #e5e7eb", borderRadius: 10, background: "#fff", cursor: "pointer", position: "relative", transition: "border .12s" },
};
