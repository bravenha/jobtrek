import { useState, useEffect } from "react";

const EMPTY_FORM = () => ({
  company: "", role: "", source: "Jobstreet",
  appliedDate: new Date().toISOString().slice(0, 10),
  jobDesc: "", notes: "", status: "applied",
});

const STATUS = {
  wishlist:  { label: "Wishlist",   color: "#94A3B8", bg: "#F1F5F9" },
  applied:   { label: "Melamar",    color: "#3B82F6", bg: "#EFF6FF" },
  hr_screen: { label: "HR Screen",  color: "#8B5CF6", bg: "#F5F3FF" },
  test:      { label: "Tes",        color: "#F59E0B", bg: "#FFFBEB" },
  interview: { label: "Interview",  color: "#06B6D4", bg: "#ECFEFF" },
  offered:   { label: "Ditawari",   color: "#10B981", bg: "#ECFDF5" },
  accepted:  { label: "Diterima!",  color: "#059669", bg: "#D1FAE5" },
  rejected:  { label: "Ditolak",   color: "#EF4444", bg: "#FEF2F2" },
  ghosted:   { label: "Ghosted",   color: "#94A3B8", bg: "#F9FAFB" },
};
const SID = ["wishlist","applied","hr_screen","test","interview","offered","accepted","rejected","ghosted"];
const ACTIVE = ["wishlist","applied","hr_screen","test","interview","offered"];
const SOURCES = ["Jobstreet","Glints","Kalibrr","LinkedIn","Indeed","Loker.id","JobsDB","Website Perusahaan","Referral","Lainnya"];

const T = "#0D9488", BG = "#F8FAFC", CARD = "#FFFFFF", BORDER = "#E2E8F0", TX = "#0F172A", MT = "#64748B";
const AVATARS = [T,"#3B82F6","#8B5CF6","#F59E0B","#EF4444","#06B6D4"];

const ago = d => {
  if (!d) return "";
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  return days === 0 ? "hari ini" : days === 1 ? "kemarin" : `${days} hari lalu`;
};
const fmt = d => d ? new Date(d).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" }) : "-";

const Avatar = ({ name, size = 40 }) => {
  const i = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
  const c = AVATARS[name.charCodeAt(0) % AVATARS.length];
  return <div style={{ width:size, height:size, borderRadius:10, background:`${c}22`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:size*0.38, color:c, flexShrink:0 }}>{i}</div>;
};

const Badge = ({ status }) => {
  const s = STATUS[status] || STATUS.applied;
  return <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, color:s.color, background:s.bg }}>{s.label}</span>;
};

const Label = ({ children }) => (
  <p style={{ margin:"0 0 5px", fontSize:11, fontWeight:700, color:MT, textTransform:"uppercase", letterSpacing:"0.05em" }}>{children}</p>
);

export default function App() {
  const [apps, setApps] = useState([]);
  const [view, setView] = useState("dash");
  const [sel, setSel] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filter, setFilter] = useState("all");
  const [ai, setAi] = useState({ loading: false, mode: null, result: "" });
  const [saveErr, setSaveErr] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("jobtrek-v1");
        if (r?.value) setApps(JSON.parse(r.value));
      } catch (e) {}
    })();
  }, []);

  const persist = async next => {
    setApps(next);
    try { await window.storage.set("jobtrek-v1", JSON.stringify(next)); }
    catch (e) { setSaveErr(true); setTimeout(() => setSaveErr(false), 3000); }
  };

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addApp = () => {
    if (!form.company.trim() || !form.role.trim()) return;
    persist([{ ...form, id: Date.now(), createdAt: new Date().toISOString() }, ...apps]);
    setForm(EMPTY_FORM());
    setShowAdd(false);
    setView("list");
  };

  const updateApp = (id, patch) => {
    const next = apps.map(a => a.id === id ? { ...a, ...patch } : a);
    persist(next);
    if (sel?.id === id) setSel(p => ({ ...p, ...patch }));
  };

  const deleteApp = id => {
    persist(apps.filter(a => a.id !== id));
    setSel(null);
    setView("list");
  };

  const callAI = async mode => {
    if (!sel) return;
    setAi({ loading: true, mode, result: "" });
    const days = sel.appliedDate ? Math.floor((Date.now() - new Date(sel.appliedDate)) / 86400000) : 7;
    const desc = sel.jobDesc ? `\nDeskripsi Pekerjaan:\n${sel.jobDesc}\n` : "";
    const prompts = {
      interview: `Kamu adalah career coach berpengalaman untuk fresh graduate Indonesia.\nPerusahaan: ${sel.company}\nPosisi: ${sel.role}${desc}\nBerikan persiapan interview yang praktis:\n\n1. PERTANYAAN YANG MUNGKIN DITANYAKAN (5 pertanyaan + tips jawaban singkat)\n2. PERTANYAAN UNTUK INTERVIEWER (2 pertanyaan cerdas)\n3. TIPS TERPENTING untuk posisi ini\n\nBahasa Indonesia. Format dengan judul section yang jelas.`,
      cv: `Kamu adalah career consultant untuk fresh graduate Indonesia.\nPerusahaan: ${sel.company}\nPosisi: ${sel.role}${desc}\nBerikan panduan menyesuaikan CV:\n\n1. KEYWORD PENTING yang harus ada di CV\n2. SKILL & PENGALAMAN yang perlu ditonjolkan\n3. CARA MENULIS SUMMARY yang menarik untuk posisi ini\n4. KESALAHAN UMUM fresh grad yang harus dihindari\n\nBahasa Indonesia. Praktis dan langsung actionable.`,
      followup: `Buatkan email follow-up yang sopan dan profesional:\nPerusahaan: ${sel.company}\nPosisi: ${sel.role}\nSudah melamar: ${days} hari lalu\n\nFormat:\nSubject: [tulis subject email]\n\n[isi email]\n\nBahasa Indonesia formal tapi tidak kaku. Maksimal 120 kata. Jangan terlalu memaksa.`,
    };
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompts[mode] }] }),
      });
      const data = await res.json();
      setAi({ loading: false, mode, result: data.content?.[0]?.text || "Gagal mendapat respons." });
    } catch (e) {
      setAi({ loading: false, mode, result: "Terjadi kesalahan koneksi. Coba lagi." });
    }
  };

  const stats = {
    total: apps.length,
    active: apps.filter(a => ACTIVE.includes(a.status)).length,
    interview: apps.filter(a => a.status === "interview").length,
    offered: apps.filter(a => ["offered","accepted"].includes(a.status)).length,
  };

  const filtered = filter === "all" ? apps : apps.filter(a => a.status === filter);
  const goDetail = app => { setSel(app); setView("detail"); setAi({ loading:false, mode:null, result:"" }); };

  const inputStyle = { width:"100%", padding:"9px 12px", border:`1px solid ${BORDER}`, borderRadius:8, fontSize:14, color:TX, fontFamily:"inherit", outline:"none", boxSizing:"border-box", background:CARD };
  const selectStyle = { ...inputStyle };

  // ─── MODAL ───────────────────────────────────────────────────────────────────
  const Modal = () => (
    <div style={{ position:"absolute", top:0, left:0, right:0, minHeight:"100%", background:"rgba(15,23,42,0.55)", display:"flex", alignItems:"flex-start", justifyContent:"center", paddingTop:"2rem", zIndex:50 }}>
      <div style={{ background:CARD, borderRadius:16, padding:"1.5rem", width:"100%", maxWidth:460, margin:"0 1rem 2rem" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
          <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:TX }}>Tambah Lamaran Baru</h3>
          <button onClick={() => setShowAdd(false)} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:MT, lineHeight:1, padding:"4px 8px" }}>x</button>
        </div>
        <Label>Nama Perusahaan *</Label>
        <input value={form.company} onChange={e => setF("company", e.target.value)} placeholder="Gojek, Tokopedia, Bank BCA..." style={{ ...inputStyle, marginBottom:12 }} />
        <Label>Posisi yang Dilamar *</Label>
        <input value={form.role} onChange={e => setF("role", e.target.value)} placeholder="Frontend Developer, Data Analyst..." style={{ ...inputStyle, marginBottom:12 }} />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
          <div>
            <Label>Sumber</Label>
            <select value={form.source} onChange={e => setF("source", e.target.value)} style={selectStyle}>
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <Label>Tanggal Melamar</Label>
            <input type="date" value={form.appliedDate} onChange={e => setF("appliedDate", e.target.value)} style={inputStyle} />
          </div>
        </div>
        <Label>Status Awal</Label>
        <select value={form.status} onChange={e => setF("status", e.target.value)} style={{ ...selectStyle, marginBottom:12 }}>
          {SID.map(id => <option key={id} value={id}>{STATUS[id].label}</option>)}
        </select>
        <Label>Deskripsi Pekerjaan <span style={{ fontWeight:400, textTransform:"none", color:"#94A3B8" }}>(opsional — untuk hasil AI lebih akurat)</span></Label>
        <textarea value={form.jobDesc} onChange={e => setF("jobDesc", e.target.value)} rows={3}
          placeholder="Paste job description di sini..."
          style={{ ...inputStyle, resize:"vertical", marginBottom:16, lineHeight:1.6 }} />
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button onClick={() => setShowAdd(false)} style={{ padding:"9px 18px", borderRadius:8, border:`1px solid ${BORDER}`, background:"transparent", fontSize:14, cursor:"pointer", color:MT, fontFamily:"inherit" }}>Batal</button>
          <button onClick={addApp} style={{ padding:"9px 18px", borderRadius:8, border:"none", background:T, color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Simpan Lamaran</button>
        </div>
      </div>
    </div>
  );

  // ─── DASHBOARD ───────────────────────────────────────────────────────────────
  const Dashboard = () => (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:10, marginBottom:"1.25rem" }}>
        {[
          { label:"Total Lamaran", value:stats.total,     c:"#3B82F6" },
          { label:"Sedang Proses", value:stats.active,    c:"#8B5CF6" },
          { label:"Interview",     value:stats.interview, c:"#06B6D4" },
          { label:"Penawaran",     value:stats.offered,   c:"#10B981" },
        ].map(s => (
          <div key={s.label} style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:"1rem" }}>
            <p style={{ margin:"0 0 4px", fontSize:11, color:MT, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em" }}>{s.label}</p>
            <p style={{ margin:0, fontSize:32, fontWeight:700, color:s.c }}>{s.value}</p>
          </div>
        ))}
      </div>

      {apps.length === 0 ? (
        <div style={{ background:`${T}09`, border:`1.5px dashed ${T}50`, borderRadius:14, padding:"2.5rem", textAlign:"center" }}>
          <div style={{ width:52, height:52, borderRadius:14, background:`${T}20`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 1rem", color:T, fontSize:24, fontWeight:700 }}>+</div>
          <p style={{ margin:"0 0 8px", fontWeight:700, color:TX, fontSize:17 }}>Mulai tracking lamaranmu</p>
          <p style={{ margin:"0 0 1.5rem", fontSize:14, color:MT, lineHeight:1.7 }}>
            Tambah lamaranmu, biarkan AI bantu persiapan interview,<br />tips CV, dan draft email follow-up — semuanya dalam Bahasa Indonesia.
          </p>
          <button onClick={() => setShowAdd(true)} style={{ padding:"10px 22px", borderRadius:8, border:"none", background:T, color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
            Tambah Lamaran Pertama
          </button>
        </div>
      ) : (
        <>
          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:"1.25rem", marginBottom:"1rem" }}>
            <p style={{ margin:"0 0 12px", fontWeight:700, fontSize:14, color:TX }}>Pipeline Lamaran</p>
            <div style={{ display:"flex", gap:6 }}>
              {["applied","hr_screen","test","interview","offered"].map(id => {
                const count = apps.filter(a => a.status === id).length;
                return (
                  <div key={id} onClick={() => { setFilter(id); setView("list"); }}
                    style={{ flex:"1 1 0", textAlign:"center", padding:"12px 6px", borderRadius:8, background:count > 0 ? STATUS[id].bg : "#F8FAFC", border:`1px solid ${count > 0 ? STATUS[id].color+"50" : BORDER}`, cursor:"pointer" }}>
                    <p style={{ margin:"0 0 3px", fontSize:24, fontWeight:700, color:count > 0 ? STATUS[id].color : "#CBD5E1" }}>{count}</p>
                    <p style={{ margin:0, fontSize:10, fontWeight:600, color:count > 0 ? STATUS[id].color : "#CBD5E1" }}>{STATUS[id].label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:"1.25rem" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
              <p style={{ margin:0, fontWeight:700, fontSize:14, color:TX }}>Terbaru</p>
              <button onClick={() => setView("list")} style={{ background:"none", border:"none", fontSize:13, color:T, cursor:"pointer", fontWeight:600 }}>Lihat semua</button>
            </div>
            {apps.slice(0, 5).map((app, i) => (
              <div key={app.id} onClick={() => goDetail(app)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderTop: i > 0 ? `1px solid ${BORDER}` : "none", cursor:"pointer" }}>
                <Avatar name={app.company} size={36} />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:"0 0 2px", fontWeight:600, fontSize:13, color:TX, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{app.role}</p>
                  <p style={{ margin:0, fontSize:12, color:MT }}>{app.company} · {ago(app.createdAt)}</p>
                </div>
                <Badge status={app.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // ─── LIST ─────────────────────────────────────────────────────────────────────
  const AppList = () => (
    <div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:"1rem" }}>
        {[["all","Semua"], ...SID.map(id => [id, STATUS[id].label])].map(([id, label]) => {
          const count = id === "all" ? apps.length : apps.filter(a => a.status === id).length;
          if (id !== "all" && count === 0) return null;
          const active = filter === id;
          return (
            <button key={id} onClick={() => setFilter(id)}
              style={{ padding:"5px 12px", borderRadius:20, fontSize:12, border:`1px solid ${active ? T : BORDER}`, background:active ? `${T}18` : "transparent", color:active ? T : MT, cursor:"pointer", fontWeight:active ? 700 : 400, fontFamily:"inherit" }}>
              {label} ({count})
            </button>
          );
        })}
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"3rem", color:MT }}>
          <p style={{ margin:0, fontSize:14 }}>Tidak ada lamaran dengan status ini.</p>
        </div>
      ) : filtered.map(app => (
        <div key={app.id} onClick={() => goDetail(app)}
          style={{ display:"flex", alignItems:"center", gap:12, background:CARD, border:`1px solid ${BORDER}`, borderRadius:10, padding:"1rem", marginBottom:8, cursor:"pointer" }}>
          <Avatar name={app.company} size={44} />
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:"0 0 3px", fontWeight:600, fontSize:15, color:TX }}>{app.role}</p>
            <p style={{ margin:"0 0 6px", fontSize:13, color:MT }}>{app.company} · {app.source}</p>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <Badge status={app.status} />
              <span style={{ fontSize:11, color:"#94A3B8" }}>melamar {ago(app.appliedDate)}</span>
            </div>
          </div>
          <span style={{ color:"#CBD5E1", fontSize:18 }}>›</span>
        </div>
      ))}
    </div>
  );

  // ─── DETAIL ───────────────────────────────────────────────────────────────────
  const Detail = () => {
    if (!sel) return null;
    const aiLabels = { interview:"Persiapan Interview", cv:"Tips CV", followup:"Draft Follow-up" };
    return (
      <div>
        <button onClick={() => { setView("list"); setSel(null); setAi({ loading:false, mode:null, result:"" }); }}
          style={{ background:"none", border:"none", color:MT, cursor:"pointer", fontSize:13, marginBottom:"1rem", padding:0, display:"flex", alignItems:"center", gap:4, fontFamily:"inherit" }}>
          ← Kembali ke Daftar
        </button>

        <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:"1.25rem", marginBottom:"1rem" }}>
          <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:"1.25rem" }}>
            <Avatar name={sel.company} size={52} />
            <div style={{ flex:1 }}>
              <h2 style={{ margin:"0 0 4px", fontSize:19, fontWeight:700, color:TX }}>{sel.role}</h2>
              <p style={{ margin:"0 0 8px", color:MT, fontSize:14 }}>{sel.company} · {sel.source}</p>
              <Badge status={sel.status} />
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, padding:"1rem", background:"#F8FAFC", borderRadius:8, marginBottom:"1.25rem", fontSize:13 }}>
            <div><p style={{ margin:"0 0 2px", color:MT }}>Tanggal Melamar</p><p style={{ margin:0, fontWeight:600, color:TX }}>{fmt(sel.appliedDate)}</p></div>
            <div><p style={{ margin:"0 0 2px", color:MT }}>Sudah Berlalu</p><p style={{ margin:0, fontWeight:600, color:TX }}>{ago(sel.appliedDate)}</p></div>
          </div>
          <Label>Update Status</Label>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {SID.map(id => (
              <button key={id} onClick={() => updateApp(sel.id, { status:id })}
                style={{ padding:"4px 10px", borderRadius:20, fontSize:11, border:`1px solid ${sel.status === id ? STATUS[id].color : BORDER}`, background:sel.status === id ? STATUS[id].bg : "transparent", color:sel.status === id ? STATUS[id].color : MT, cursor:"pointer", fontWeight:sel.status === id ? 700 : 400, fontFamily:"inherit" }}>
                {STATUS[id].label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:"1.25rem", marginBottom:"1rem" }}>
          <p style={{ margin:"0 0 3px", fontWeight:700, fontSize:14, color:TX }}>Bantuan AI</p>
          <p style={{ margin:"0 0 1rem", fontSize:12, color:MT }}>Powered by Claude · Bahasa Indonesia</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:8, marginBottom: ai.result || ai.loading ? "1rem" : 0 }}>
            {[
              { mode:"interview", title:"Persiapan Interview", sub:"Prediksi pertanyaan + tips" },
              { mode:"cv",        title:"Tips Sesuaikan CV",   sub:"Keyword & skill penting" },
              { mode:"followup",  title:"Draft Follow-up",     sub:"Email tindak lanjut" },
            ].map(btn => {
              const active = ai.mode === btn.mode && (ai.result || ai.loading);
              return (
                <button key={btn.mode} onClick={() => callAI(btn.mode)}
                  style={{ padding:"10px 12px", borderRadius:8, border:`1.5px solid ${active ? T : BORDER}`, background:active ? `${T}0A` : "transparent", cursor:"pointer", textAlign:"left", fontFamily:"inherit" }}>
                  <p style={{ margin:"0 0 3px", fontSize:12, fontWeight:700, color:active ? T : TX }}>{btn.title}</p>
                  <p style={{ margin:0, fontSize:11, color:MT, lineHeight:1.4 }}>{btn.sub}</p>
                </button>
              );
            })}
          </div>
          {ai.loading && (
            <div style={{ padding:"1.25rem", background:"#F8FAFC", borderRadius:8, textAlign:"center", color:MT, fontSize:13 }}>
              AI sedang menyiapkan jawaban...
            </div>
          )}
          {!ai.loading && ai.result && (
            <div style={{ padding:"1.25rem", background:`${T}08`, borderRadius:8, borderLeft:`3px solid ${T}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <p style={{ margin:0, fontSize:11, fontWeight:700, color:T, textTransform:"uppercase", letterSpacing:"0.05em" }}>{aiLabels[ai.mode]}</p>
                <button onClick={() => setAi(p => ({ ...p, result:"" }))} style={{ background:"none", border:"none", color:MT, cursor:"pointer", fontSize:16, lineHeight:1, padding:"0 4px" }}>x</button>
              </div>
              <pre style={{ margin:0, fontSize:13, color:TX, whiteSpace:"pre-wrap", fontFamily:"inherit", lineHeight:1.75 }}>{ai.result}</pre>
            </div>
          )}
        </div>

        <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:12, padding:"1.25rem", marginBottom:"1rem" }}>
          <p style={{ margin:"0 0 8px", fontWeight:700, fontSize:14, color:TX }}>Catatan Pribadi</p>
          <textarea key={sel.id} defaultValue={sel.notes || ""} onBlur={e => updateApp(sel.id, { notes:e.target.value })} rows={3}
            placeholder="Kontak recruiter, link job post, hal yang perlu diingat..."
            style={{ width:"100%", padding:"10px 12px", border:`1px solid ${BORDER}`, borderRadius:8, fontSize:13, color:TX, fontFamily:"inherit", resize:"vertical", outline:"none", background:"#FAFAFA", boxSizing:"border-box" }} />
        </div>

        <button onClick={() => deleteApp(sel.id)}
          style={{ width:"100%", padding:"10px", borderRadius:8, border:"1px solid #FCA5A5", background:"#FFF5F5", color:"#DC2626", fontSize:13, cursor:"pointer", fontWeight:600, fontFamily:"inherit" }}>
          Hapus Lamaran Ini
        </button>
      </div>
    );
  };

  // ─── ROOT ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:700, background:BG, fontFamily:"'Plus Jakarta Sans', system-ui, sans-serif", position:"relative" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; }`}</style>

      {showAdd && <Modal />}

      {saveErr && (
        <div style={{ position:"absolute", top:60, right:12, background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:8, padding:"8px 14px", fontSize:12, color:"#DC2626", zIndex:40 }}>
          Gagal menyimpan data.
        </div>
      )}

      <div style={{ background:CARD, borderBottom:`1px solid ${BORDER}`, padding:"0 1.25rem" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", height:54 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:30, height:30, background:T, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:16 }}>J</div>
            <span style={{ fontWeight:700, fontSize:16, color:TX }}>JobTrek</span>
            <span style={{ fontSize:11, color:"#94A3B8", background:"#F1F5F9", padding:"2px 8px", borderRadius:20 }}>Fresh Graduate ID</span>
          </div>
          <button onClick={() => setShowAdd(true)}
            style={{ padding:"7px 16px", borderRadius:8, border:"none", background:T, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            + Tambah
          </button>
        </div>
        <div style={{ display:"flex" }}>
          {[["dash","Dashboard"], ["list", `Lamaran (${apps.length})`]].map(([id, label]) => (
            <button key={id} onClick={() => { setView(id); if (id !== "detail") setSel(null); setAi({ loading:false, mode:null, result:"" }); }}
              style={{ padding:"9px 14px", background:"none", border:"none", borderBottom:view===id ? `2px solid ${T}` : "2px solid transparent", color:view===id ? T : MT, fontSize:13, fontWeight:view===id ? 700 : 400, cursor:"pointer", marginBottom:-1, fontFamily:"inherit" }}>
              {label}
            </button>
          ))}
          {sel && (
            <button onClick={() => setView("detail")}
              style={{ padding:"9px 14px", background:"none", border:"none", borderBottom:view==="detail" ? `2px solid ${T}` : "2px solid transparent", color:view==="detail" ? T : MT, fontSize:13, fontWeight:view==="detail" ? 700 : 400, cursor:"pointer", marginBottom:-1, maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"inherit" }}>
              {sel.company}
            </button>
          )}
        </div>
      </div>

      <div style={{ padding:"1.25rem" }}>
        {view === "dash"   && <Dashboard />}
        {view === "list"   && <AppList />}
        {view === "detail" && sel && <Detail />}
      </div>
    </div>
  );
}
