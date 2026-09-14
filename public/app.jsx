import { useState, useEffect, useRef } from "react";

const API = typeof window !== "undefined" && window.__PROSPECTEUR_API__ ? window.__PROSPECTEUR_API__ : "https://prospecteur.vercel.app";

async function api(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}/api${path}`, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data;
}

async function saveToken(t) { try { await window.storage.set("pt", t); } catch {} }
async function loadToken() { try { const r = await window.storage.get("pt"); return r?.value || null; } catch { return null; } }
async function clearToken() { try { await window.storage.delete("pt"); } catch {} }

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
  { icon: "📚", l: "Formation", i: "Organismes de formation", t: "Centres de formation, formateurs" },
  { icon: "🚗", l: "Auto", i: "Garages automobiles", t: "Garages indépendants, carrosseries" },
  { icon: "🛒", l: "Commerce", i: "Commerces de proximité", t: "Boutiques, magasins spécialisés" },
  { icon: "🌿", l: "Paysage", i: "Paysagistes", t: "Paysagistes, jardiniers" },
];

function Input({ label, error, ...p }) {
  return (<div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
    {label && <label style={S.label}>{label}</label>}
    <input style={{ ...S.input, ...(error ? { borderColor: "#ef4444" } : {}) }} {...p} />
    {error && <span style={{ fontSize: 12, color: "#ef4444" }}>{error}</span>}
  </div>);
}

function Logo({ s }) {
  const z = s === "sm" ? 28 : 36;
  return (<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <div style={{ width: z, height: z, borderRadius: 8, background: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: s === "sm" ? 13 : 16 }}>P</div>
    <span style={{ fontSize: s === "sm" ? 16 : 20, fontWeight: 800, letterSpacing: "-0.03em", color: "#0f172a" }}>Prospecteur</span>
  </div>);
}

// ─── AUTH ───
function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [name, setName] = useState(""); const [company, setCompany] = useState("");
  const [err, setErr] = useState(""); const [ld, setLd] = useState(false);

  const go = async () => {
    setErr(""); setLd(true);
    try {
      if (mode === "forgot") { await api("/auth/forgot-password", { method: "POST", body: { email } }); setMode("sent"); setLd(false); return; }
      const ep = mode === "signup" ? "/auth/signup" : "/auth/login";
      const bd = mode === "signup" ? { email, password: pw, name, company } : { email, password: pw };
      const d = await api(ep, { method: "POST", body: bd });
      await saveToken(d.token); onAuth(d.token, d.user, d.balance);
    } catch (e) { setErr(e.message); }
    setLd(false);
  };
  const onK = e => { if (e.key === "Enter") go(); };

  if (mode === "sent") return (
    <div style={S.authW}><div style={S.authC}>
      <div style={{ textAlign: "center" }}><Logo /><div style={{ width: 48, height: 48, borderRadius: "50%", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", margin: "24px auto 12px", fontSize: 20 }}>✓</div>
      <h2 style={S.authT}>Vérifiez vos emails</h2><p style={{ fontSize: 14, color: "#64748b", margin: "8px 0 20px" }}>Lien envoyé à <strong>{email}</strong></p>
      <button style={S.pBtn} onClick={() => setMode("login")}>Retour</button></div>
    </div></div>
  );

  return (
    <div style={S.authW}><div style={S.authC}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}><Logo /></div>
      <h2 style={S.authT}>{mode === "login" ? "Connexion" : mode === "signup" ? "Créer un compte" : "Mot de passe oublié"}</h2>
      <p style={{ fontSize: 14, color: "#64748b", textAlign: "center", margin: 0 }}>{mode === "signup" ? "10 crédits offerts · Sans CB" : mode === "login" ? "Retrouvez vos prospects." : "Entrez votre email."}</p>
      {err && <div style={S.errBox}>{err}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
        {mode === "signup" && <div style={{ display: "flex", gap: 10 }}>
          <Input label="Nom" value={name} onChange={e => setName(e.target.value)} placeholder="Jean Dupont" onKeyDown={onK} />
          <Input label="Entreprise" value={company} onChange={e => setCompany(e.target.value)} placeholder="Optionnel" onKeyDown={onK} />
        </div>}
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jean@exemple.fr" onKeyDown={onK} />
        {mode !== "forgot" && <Input label="Mot de passe" type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="6 caractères min." onKeyDown={onK} />}
      </div>
      {mode === "login" && <div style={{ textAlign: "right", marginTop: 6 }}><button style={S.tBtn} onClick={() => { setMode("forgot"); setErr(""); }}>Mot de passe oublié ?</button></div>}
      <button style={{ ...S.pBtn, marginTop: 16, ...(ld ? { opacity: .7, pointerEvents: "none" } : {}) }} onClick={go}>
        {ld ? <span style={S.spn}/> : mode === "login" ? "Se connecter" : mode === "signup" ? "Créer mon compte" : "Envoyer"}
      </button>
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#64748b" }}>
        {mode === "login" ? <>Pas de compte ? <button style={S.tBtn} onClick={() => { setMode("signup"); setErr(""); }}>S'inscrire</button></> :
         mode === "signup" ? <>Déjà inscrit ? <button style={S.tBtn} onClick={() => { setMode("login"); setErr(""); }}>Connexion</button></> :
         <button style={S.tBtn} onClick={() => { setMode("login"); setErr(""); }}>← Retour</button>}
      </div>
    </div></div>
  );
}

// ─── BUY CREDITS ───
function BuyCredits({ token, onDone }) {
  const [buying, setBuying] = useState(null);
  const buy = async (packId) => {
    setBuying(packId);
    try {
      const d = await api("/billing/checkout", { method: "POST", body: { pack: packId }, token });
      if (d.checkout_url) window.open(d.checkout_url, "_blank");
    } catch (e) { alert(e.message); }
    setBuying(null);
  };

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>Recharger mes crédits</h2>
      <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 16px" }}>1 crédit = 1 lead trouvé. Payez uniquement ce que vous utilisez.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        {Object.entries(PACKS).map(([id, p]) => (
          <div key={id} style={{ ...S.card, ...(p.popular ? { border: "2px solid #6366f1" } : {}), position: "relative", textAlign: "center" }}>
            {p.popular && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", fontSize: 11, fontWeight: 700, color: "#6366f1", background: "#eef2ff", padding: "2px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>Le + populaire</div>}
            <div style={{ fontSize: 28, fontWeight: 800, margin: "8px 0 2px" }}>{p.price}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{p.credits} crédits</div>
            <div style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 12px" }}>{p.per}</div>
            <button style={{ ...S.pBtn, fontSize: 13, ...(buying === id ? { opacity: .6 } : {}) }} onClick={() => buy(id)}>
              {buying === id ? <span style={S.spn}/> : "Acheter"}
            </button>
          </div>
        ))}
      </div>
      {onDone && <button style={{ ...S.gBtn, marginTop: 12 }} onClick={onDone}>← Retour</button>}
    </div>
  );
}

// ─── MAIN ───
export default function App() {
  const [view, setView] = useState("loading");
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
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
  const ref = useRef(null);

  const flash = m => { setToast(m); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    (async () => {
      const t = await loadToken();
      if (t) { try { const d = await api("/auth/me", { token: t }); setToken(t); setUser(d.user); setBalance(d.balance); setView("search");
        try { const h = await api("/leads/history", { token: t }); setHistory(h.searches || []); } catch {} return;
      } catch { await clearToken(); } } setView("auth");
    })();
  }, []);

  const onAuth = (t, u, b) => { setToken(t); setUser(u); setBalance(b); setView("search"); };
  const logout = async () => { await clearToken(); setToken(null); setUser(null); setView("auth"); };

  const search = async () => {
    if (!industry.trim() || !location.trim()) { setError("Remplis le secteur et la ville."); return; }
    if (balance < 1) { setError("Plus de crédits. Rechargez votre compte."); return; }
    setLoading(true); setError(null); setResults(null); setExpandedId(null);
    const steps = ["Analyse du marché…", "Recherche d'entreprises…", "Extraction des contacts…", "Vérification…", "Scoring…"];
    let si = 0; setProgress(steps[0]);
    const iv = setInterval(() => { si = Math.min(si + 1, steps.length - 1); setProgress(steps[si]); }, 5000);
    try {
      const d = await api("/leads/generate", { method: "POST", token, body: { industry, location, target, count: parseInt(count) || 10 } });
      setResults({ leads: d.leads, meta: d.meta }); setBalance(d.balance);
      try { const h = await api("/leads/history", { token }); setHistory(h.searches || []); } catch {}
      flash(`${d.leads.length} prospect${d.leads.length > 1 ? "s" : ""} · ${d.leads.length} crédit${d.leads.length > 1 ? "s" : ""} utilisé${d.leads.length > 1 ? "s" : ""}`);
      setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    } catch (e) { setError(e.message); }
    finally { clearInterval(iv); setLoading(false); setProgress(""); }
  };

  const exportCSV = async () => {
    try { const res = await fetch(`${API}/api/leads/export`, { headers: { Authorization: `Bearer ${token}` } });
      const b = await res.blob(); const a = document.createElement("a"); a.href = URL.createObjectURL(b);
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); flash("CSV téléchargé");
    } catch { flash("Erreur d'export"); }
  };

  if (view === "loading") return <div style={S.ctr}><div style={S.spin}/></div>;
  if (view === "auth") return <div style={S.root}><style>{css}</style><Auth onAuth={onAuth} /></div>;

  return (
    <div style={S.root}>
      <style>{css}</style>
      {toast && <div style={S.toast}>{toast}</div>}

      <div style={S.topBar}>
        <button style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }} onClick={() => setView("search")}><Logo s="sm" /></button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="gb" style={{ ...S.creditBtn, ...(balance < 3 ? { borderColor: "#fecaca", background: "#fef2f2" } : {}) }} onClick={() => setView("buy")}>
            <span style={{ fontSize: 16, fontWeight: 800, color: balance > 5 ? "#0f172a" : balance > 0 ? "#f59e0b" : "#ef4444" }}>{balance}</span>
            <span style={{ fontSize: 11, color: "#64748b" }}>crédits</span>
          </button>
          {history.length > 0 && view === "search" && <button className="gb" style={S.gBtnS} onClick={() => setView("history")}>Historique</button>}
          {view !== "search" && view !== "buy" && <button className="gb" style={S.gBtnS} onClick={() => setView("search")}>← Recherche</button>}
          <button style={S.avBtn} onClick={() => view === "account" ? setView("search") : setView("account")}>{(user?.name || "U")[0].toUpperCase()}</button>
        </div>
      </div>

      {view === "buy" && <BuyCredits token={token} onDone={() => { setView("search"); (async () => { try { const d = await api("/auth/me", { token }); setBalance(d.balance); } catch {} })(); }} />}

      {view === "account" && (
        <div>
          <button style={S.bkBtn} onClick={() => setView("search")}>← Retour</button>
          <div style={S.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
              <div style={S.av}>{(user?.name || "U")[0].toUpperCase()}</div>
              <div><div style={{ fontWeight: 700, fontSize: 17 }}>{user?.name}</div><div style={{ fontSize: 13, color: "#64748b" }}>{user?.email}</div></div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ flex: 1, background: "#f8fafc", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{balance}</div><div style={{ fontSize: 12, color: "#64748b" }}>crédits restants</div>
              </div>
              <div style={{ flex: 1, background: "#f8fafc", borderRadius: 8, padding: "12px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{history.length}</div><div style={{ fontSize: 12, color: "#64748b" }}>recherches</div>
              </div>
            </div>
          </div>
          <button style={{ ...S.pBtn, marginBottom: 10 }} onClick={() => setView("buy")}>Acheter des crédits</button>
          <button style={{ ...S.gBtn, color: "#94a3b8" }} onClick={logout}>Se déconnecter</button>
        </div>
      )}

      {view === "history" && (
        <div>
          <h2 style={S.secT}>Historique</h2>
          {history.map(h => (
            <div key={h.id} className="hi" style={S.histI} onClick={() => { setIndustry(h.industry); setLocation(h.location); setTarget(h.target || ""); setView("search"); }}>
              <div><div style={{ fontWeight: 600, fontSize: 14 }}>{h.industry}</div><div style={{ fontSize: 13, color: "#64748b" }}>{h.location} · {h.lead_count} leads</div></div>
              <span style={{ color: "#6366f1", fontSize: 13, fontWeight: 600 }}>Relancer →</span>
            </div>
          ))}
        </div>
      )}

      {view === "search" && (
        <>
          <div style={S.sCard}>
            <div style={S.nGrid}>{NICHES.map(n => (
              <button key={n.l} className="nb" style={{ ...S.nBtn, ...(industry === n.i ? { borderColor: "#6366f1", background: "#eef2ff" } : {}) }} onClick={() => { setIndustry(n.i); setTarget(n.t); }}>
                <span style={{ fontSize: 17 }}>{n.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: industry === n.i ? "#4f46e5" : "#475569" }}>{n.l}</span>
              </button>
            ))}</div>
            <div style={S.fRow}>
              <Input label="Secteur" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="Ex : Plombiers, Restaurants…" />
              <Input label="Ville / Région" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex : Marseille, Bretagne…" />
            </div>
            <div style={S.fRow}>
              <div style={{ flex: 2 }}><Input label="Cible (optionnel)" value={target} onChange={e => setTarget(e.target.value)} placeholder="Ex : Indépendants…" /></div>
              <div style={{ flex: 0, minWidth: 90 }}>
                <label style={S.label}>Qté</label>
                <select style={S.input} value={count} onChange={e => setCount(e.target.value)}>
                  {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "6px 0 0" }}>Coût : {parseInt(count) || 10} crédit{(parseInt(count) || 10) > 1 ? "s" : ""} · Solde : {balance}</p>
            {error && <div style={S.errBox}>{error}</div>}
            <button style={{ ...S.pBtn, marginTop: 10, ...(loading ? { opacity: .7, pointerEvents: "none" } : {}) }} onClick={search}>
              {loading ? <><span style={S.spn}/>{progress}</> : "Trouver des prospects"}
            </button>
          </div>

          {loading && <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{[1, 2, 3].map(i => <div key={i} style={S.skel}><div style={{ ...S.skelL, width: "50%" }}/><div style={{ ...S.skelL, width: "30%", height: 10, marginTop: 6 }}/></div>)}</div>}

          {results && (
            <div ref={ref}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", margin: "20px 0 10px", flexWrap: "wrap", gap: 12 }}>
                <div><h2 style={S.secT}>{results.meta.count} prospect{results.meta.count > 1 ? "s" : ""}</h2><p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>{results.meta.industry} · {results.meta.location}</p></div>
                <button className="gb" style={S.gBtn} onClick={exportCSV}>↓ CSV</button>
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
                    {l.email && <span style={S.chOk}>✉️ Email</span>}
                    {l.phone && <span style={S.chOk}>📞 Tél.</span>}
                  </div>
                  {expandedId === i && <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9", animation: "slideUp .2s ease" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 18px" }}>
                      {l.contact_name && <div><div style={S.dl}>Contact</div><div style={S.dv}>{l.contact_name}{l.contact_role ? ` — ${l.contact_role}` : ""}</div></div>}
                      {l.email && <div><div style={S.dl}>Email</div><a href={`mailto:${l.email}`} style={S.da}>{l.email}</a></div>}
                      {l.phone && <div><div style={S.dl}>Téléphone</div><a href={`tel:${l.phone}`} style={S.da}>{l.phone}</a></div>}
                      {l.website && <div><div style={S.dl}>Site</div><a href={l.website} target="_blank" rel="noopener noreferrer" style={S.da}>{l.website}</a></div>}
                      {l.reason && <div style={{ gridColumn: "1/-1" }}><div style={S.dl}>Pertinence</div><div style={S.dv}>{l.reason}</div></div>}
                    </div>
                  </div>}
                </div>
              ))}
              {balance < 5 && <div style={S.ups}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Il vous reste {balance} crédit{balance > 1 ? "s" : ""}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Rechargez pour continuer à trouver des prospects.</div>
                <button style={{ ...S.pBtn, padding: "10px 24px", fontSize: 14 }} onClick={() => setView("buy")}>Acheter des crédits</button>
              </div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const css = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}input:focus,select:focus{border-color:#818cf8!important;box-shadow:0 0 0 3px rgba(129,140,248,.12)!important}::placeholder{color:#b0b0b0}.nb:hover{border-color:#c7d2fe!important;background:#f5f3ff!important}.lc:hover{border-color:#c7d2fe!important}.gb:hover,.hi:hover{background:#f8fafc!important}`;

const S = {
  root: { fontFamily: "'Inter',-apple-system,sans-serif", maxWidth: 800, margin: "0 auto", padding: "0 16px 48px", color: "#1e293b" },
  ctr: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 },
  spin: { width: 28, height: 28, border: "3px solid #e5e7eb", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin .7s linear infinite" },
  spn: { display: "inline-block", width: 15, height: 15, border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .6s linear infinite", marginRight: 8 },
  toast: { position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: "#0f172a", color: "#fff", padding: "10px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 999 },
  authW: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", padding: "24px 0" },
  authC: { width: "100%", maxWidth: 420, border: "1px solid #e5e7eb", borderRadius: 16, padding: "32px 28px" },
  authT: { fontSize: 22, fontWeight: 800, textAlign: "center", margin: "0 0 4px", letterSpacing: "-0.02em" },
  tBtn: { background: "none", border: "none", color: "#6366f1", fontWeight: 600, cursor: "pointer", fontSize: 13, padding: 0, textDecoration: "underline" },
  errBox: { margin: "10px 0", padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", fontSize: 13 },
  pBtn: { width: "100%", padding: "12px", background: "#0f172a", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  gBtn: { padding: "8px 14px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer" },
  gBtnS: { padding: "5px 12px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" },
  bkBtn: { background: "none", border: "none", color: "#6366f1", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "0 0 16px" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 16px", flexWrap: "wrap", gap: 10 },
  creditBtn: { display: "flex", flexDirection: "column", alignItems: "center", background: "#f8fafc", borderRadius: 8, padding: "2px 14px", lineHeight: 1.2, border: "1px solid #e5e7eb", cursor: "pointer" },
  avBtn: { width: 34, height: 34, borderRadius: "50%", background: "#0f172a", color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  av: { width: 48, height: 48, borderRadius: "50%", background: "#eef2ff", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18 },
  card: { border: "1px solid #e5e7eb", borderRadius: 12, padding: "18px 20px", marginBottom: 10 },
  label: { fontSize: 12.5, fontWeight: 600, color: "#374151" },
  input: { padding: "10px 13px", border: "1px solid #e5e7eb", borderRadius: 9, fontSize: 14, outline: "none", color: "#1e293b", width: "100%", boxSizing: "border-box" },
  sCard: { border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px", marginBottom: 16 },
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
};
