"use client";
import { useState, useEffect } from "react";

type Word = {id:string;word:string;fetched_date:string;definition:string|null;pos:string|null;ipa:string|null;cefr:string|null;topic:string|null;thai_translations:string[]|null;synonyms:string[]|null};

// ── Simple textarea ──

function RichEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm bg-background min-h-[120px] focus:outline-none border border-border rounded-lg resize-y"
      placeholder="Type announcement here..."
      rows={4}
    />
  );
}

export function AdminPanel({ initialWords }: { initialWords: Word[] }) {
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [msg, setMsg] = useState<{t:string;text:string}|null>(null);
  const [editing, setEditing] = useState<Word|null>(null);
  const [editForm, setEditForm] = useState<Record<string,string>>({});
  const [words, setWords] = useState(initialWords);
  const [search, setSearch] = useState("");
  const [showAnnPreview, setShowAnnPreview] = useState(false);
  const [annForm, setAnnForm] = useState({title:"", body:"", enabled:false});
  const [logs, setLogs] = useState<Array<{id:number;action:string;detail:string|null;created_at:string}>>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Restore session
  useEffect(() => {
    const saved = sessionStorage.getItem("admin_secret");
    if (saved) { setSecret(saved); setAuthed(true); }
  }, []);

  const bf = () => String.fromCharCode(66, 101, 97, 114, 101, 114);
  const auth = () => ({ "Content-Type": "application/json", Authorization: bf() + " " + secret });

  const doAuth = () => {
    if (!secret.trim()) return;
    setAuthed(true);
    sessionStorage.setItem("admin_secret", secret);
  };

  const flash = (t:string, text:string) => { setMsg({t,text}); setTimeout(() => setMsg(null), 4000); };

  const act = async (endpoint: string, label: string) => {
    setLoading(true);
    const res = await fetch(endpoint, { method: "POST", headers: auth() }).catch(() => null);
    setLoading(false);
    if (!res) return flash("error", "Network error");
    if (res.status===401) { setAuthed(false); sessionStorage.removeItem("admin_secret"); flash("error", "Wrong secret"); return; }
    const data = await res.json();
    if (res.ok) { flash("success", label + " done" + (data.imported ? " (" + data.imported + " words)" : "")); logIt(label); }
    else flash("error", label + " failed");
  };

  const openEdit = (w: Word | null) => {
    setEditing(w);
    setEditForm(w ? {
      word: w.word, fetched_date: w.fetched_date, definition: w.definition || "",
      pos: w.pos || "", ipa: w.ipa || "", cefr: w.cefr || "", topic: w.topic || "",
      thai_translations: (w.thai_translations||[]).join(", "),
      synonyms: (w.synonyms||[]).join(", "),
    } : { word:"", fetched_date:"", definition:"", pos:"", ipa:"", cefr:"", topic:"", thai_translations:"", synonyms:"" });
  };

  const saveEdit = async () => {
    setLoading(true);
    const payload: Record<string,unknown> = { id: editing?.id };
    for (const f of ["word","fetched_date","definition","pos","ipa","cefr","topic"]) if (editForm[f]) payload[f] = editForm[f];
    for (const f of ["thai_translations","synonyms"]) {
      const v = editForm[f]?.trim();
      payload[f] = v ? v.split(",").map((s:string) => s.trim()).filter(Boolean) : [];
    }
    const res = await fetch("/api/admin/update-word", { method: "POST", headers: auth(), body: JSON.stringify(payload) }).catch(() => null);
    setLoading(false);
    if (!res) return flash("error", "Network error");
    if (res.status===401) { setAuthed(false); sessionStorage.removeItem("admin_secret"); return flash("error", "Wrong secret"); }
    const data = await res.json();
    if (res.ok) { setEditing(null); flash("success", (editing?.word||"Word") + " saved!"); }
    else flash("error", data.error || "Failed");
  };

  const deleteWord = async (w: Word) => {
    if (!confirm("Delete \"" + w.word + "\"?\nThis cannot be undone.")) return;
    setLoading(true);
    const res = await fetch("/api/admin/update-word", { method: "DELETE", headers: auth(), body: JSON.stringify({ id: w.id }) }).catch(() => null);
    setLoading(false);
    if (res?.status===401) { setAuthed(false); sessionStorage.removeItem("admin_secret"); flash("error", "Wrong secret"); return; }
    if (res?.ok) { flash("success", w.word + " deleted"); setWords(prev => prev.filter(p => p.id !== w.id)); }
    else flash("error", "Delete failed");
  };

  const saveAnnouncement = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/announcement", { method: "POST", headers: auth(), body: JSON.stringify(annForm) }).catch(() => null);
    setLoading(false);
    if (res?.ok) { flash("success", "Announcement saved!"); logIt("Announcement saved"); }
    else flash("error", "Failed");
  };

  const logIt = async (action:string, detail?:string) => {
    try {
      await fetch("/api/admin/log", { method:"POST", headers:auth(), body:JSON.stringify({action, detail}) });
      setLogs(prev => [{id:Date.now(), action, detail:detail||null, created_at:new Date().toISOString()}, ...prev]);
    } catch {}
  };

  const exportJSON = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/export", { headers: auth() }).catch(() => null);
    setLoading(false);
    if (!res) return flash("error", "Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "words-backup-" + new Date().toISOString().slice(0,10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
    flash("success", "Exported!");
    logIt("Export");
  };

  const loadLogs = async () => {
    setShowLogs(!showLogs);
    if (showLogs) return;
    try {
      const res = await fetch("/api/admin/log", { headers: auth() });
      const data = await res.json();
      setLogs(data.logs || []);
    } catch {}
  };

  const filtered = search.trim()
    ? words.filter(w => w.word.toLowerCase().includes(search.toLowerCase()) || (w.fetched_date||"").includes(search))
    : words;

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto pt-16">
        <div className="border border-border rounded-2xl p-8 bg-card shadow-sm">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-4 mx-auto">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 className="text-lg font-bold text-center mb-1">Admin Access</h2>
          <p className="text-xs text-muted-foreground text-center mb-5">Enter your secret to manage words.</p>
          <div className="space-y-3">
            <input type="password" placeholder="Secret" value={secret}
              onChange={e => setSecret(e.target.value)} onKeyDown={e => e.key === "Enter" && doAuth()}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-accent/30" />
            <button onClick={doAuth}
              className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition active:scale-[0.98]">Unlock</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {msg && (
        <div className={"fixed bottom-20 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium border transition-all " +
          (msg.t === "success" ? "bg-green-600 text-white border-green-700" : "bg-red-600 text-white border-red-700")}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-3 opacity-70 hover:opacity-100">&times;</button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {label:"Total Words", value:String(words.length)},
          {label:"Latest Word", value:words[0]?.word || "-"},
          {label:"Latest Date", value:words[0]?.fetched_date || "-"},
          {label:"No Thai", value:String(words.filter(w => !w.thai_translations?.length).length)},
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-3">
            <p className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{s.label}</p>
            <p className="text-lg font-bold mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-border rounded-xl p-4">
          <p className="text-[11px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-3">Data</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => act("/api/admin/import-rss", "Import RSS")} disabled={loading}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition">Import RSS</button>
            <button onClick={() => act("/api/admin/trigger-fetch", "Oxford Fetch")} disabled={loading}
              className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg text-xs font-semibold hover:bg-accent/90 disabled:opacity-50 transition">Oxford Fetch</button>
            <button onClick={() => act("/api/admin/enrich", "Enrich")} disabled={loading}
              className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs font-semibold hover:bg-secondary/80 disabled:opacity-50 transition">Enrich</button>
            <button onClick={() => {
              if (prompt('Type "DELETE" to confirm:') === "DELETE") act("/api/admin/cleanup", "Cleanup");
              else flash("error", "Cancelled - type DELETE to confirm");
            }} disabled={loading}
              className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-lg text-xs font-semibold hover:bg-destructive/90 disabled:opacity-50 transition">Delete All</button>
            <button onClick={exportJSON} disabled={loading}
              className="px-3 py-1.5 bg-card text-foreground border border-border rounded-lg text-xs font-semibold hover:bg-muted disabled:opacity-50 transition">Export JSON</button>
          </div>
        </div>
        <div className="border border-border rounded-xl p-4">
          <p className="text-[11px] font-mono text-muted-foreground/50 uppercase tracking-wider mb-3">Announcement</p>
          <div className="space-y-2">
            <input type="text" placeholder="Title" value={annForm.title}
              onChange={e => setAnnForm({...annForm, title: e.target.value})}
              className="w-full px-3 py-1.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-accent/30" />
            <RichEditor key={annForm.body} value={annForm.body} onChange={v => setAnnForm({...annForm, body: v})} />
            <div className="flex gap-2 items-center">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={annForm.enabled} onChange={e => setAnnForm({...annForm, enabled: e.target.checked})} className="accent-accent" />
                Enabled
              </label>
              <button onClick={saveAnnouncement} disabled={loading}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition">Save</button>
              <button onClick={() => setShowAnnPreview(true)}
                className="px-3 py-1.5 border border-border rounded-lg text-xs hover:bg-muted transition">Preview</button>
            </div>
          </div>
        </div>
      </div>

      {/* Words Table */}
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center gap-3 flex-wrap">
          <h2 className="font-bold text-sm">Words</h2>
          <div className="flex-1 min-w-[120px]">
            <input type="text" placeholder="Search word or date..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-accent/30" />
          </div>
          <button onClick={() => openEdit(null)}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition shrink-0">+ New</button>
          <span className="text-[11px] font-mono text-muted-foreground/60">{filtered.length} / {words.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-mono text-muted-foreground/60 uppercase tracking-wider">
                <th className="px-3 py-2.5 text-left font-normal">Date</th>
                <th className="px-3 py-2.5 text-left font-normal">Word</th>
                <th className="px-3 py-2.5 text-left font-normal hidden sm:table-cell">Thai</th>
                <th className="px-3 py-2.5 text-left font-normal hidden md:table-cell">CEFR</th>
                <th className="px-3 py-2.5 text-left font-normal hidden lg:table-cell">Topic</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground/50 text-sm">No words found</td></tr>
              ) : filtered.map((w, i) => (
                <tr key={w.id} onClick={() => openEdit(w)}
                  className={"cursor-pointer transition-colors hover:bg-muted/30 " + (i < filtered.length-1 ? "border-b border-border/50" : "")}>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground/70">{w.fetched_date}</td>
                  <td className="px-3 py-3 font-semibold">{w.word}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground hidden sm:table-cell truncate max-w-[140px]">
                    {(w.thai_translations||[]).slice(0,2).join(", ") || <span className="text-destructive/60">missing</span>}
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    {w.cefr ? <span className={"text-[10px] font-mono px-1.5 py-0.5 rounded " + (w.cefr === "C2" ? "bg-purple-100 text-purple-700" : w.cefr >= "B1" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground")}>{w.cefr}</span> : <span className="text-muted-foreground/30">-</span>}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground hidden lg:table-cell truncate max-w-[120px]">{w.topic || "-"}</td>
                  <td className="px-3 py-3 text-right">
                    <button onClick={e => { e.stopPropagation(); deleteWord(w); }}
                      className="text-[11px] px-2 py-0.5 rounded text-destructive/60 hover:text-destructive hover:bg-destructive/5 transition">Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3" onClick={() => setEditing(null)}>
          <div className="bg-background border border-border rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-background border-b border-border px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold">{editing?.id ? editing.word : "New Word"}</h3>
              <button onClick={() => setEditing(null)} className="text-muted-foreground/60 hover:text-foreground transition p-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-5 space-y-3">
              {[
                ["word","Word *"], ["fetched_date","Date *"], ["definition","Definition"],
                ["pos","POS"], ["ipa","IPA"], ["cefr","CEFR"], ["topic","Topic / List"],
                ["thai_translations","Thai (comma)"], ["synonyms","Synonyms (comma)"]
              ].map(([field, label]) => (
                <div key={field}>
                  <label className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{label}</label>
                  <input type="text" value={editForm[field]||""}
                    onChange={e => setEditForm({...editForm, [field]: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background mt-0.5 focus:outline-none focus:ring-2 focus:ring-accent/30" />
                </div>
              ))}
            </div>
            <div className="sticky bottom-0 bg-background border-t border-border px-5 py-3.5 flex gap-2 justify-end">
              <button onClick={() => setEditing(null)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition">Cancel</button>
              <button onClick={saveEdit} disabled={loading}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition">{loading ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button onClick={loadLogs}
          className="w-full bg-muted/20 px-4 py-3 border-b border-border flex items-center justify-between hover:bg-muted/40 transition">
          <span className="font-bold text-sm">Activity Log</span>
          <span className={"text-muted-foreground/50 transition-transform " + (showLogs ? "rotate-180" : "")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
          </span>
        </button>
        {showLogs && (
          <div className="p-4 max-h-[300px] overflow-y-auto">
            {logs.length === 0
              ? <p className="text-sm text-muted-foreground/50 text-center py-4">No logs yet</p>
              : <div className="space-y-2">
                  {logs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 text-xs">
                      <span className="font-mono text-muted-foreground/50 shrink-0 w-20">
                        {new Date(log.created_at).toLocaleString("en-US", {month:"short", day:"numeric", hour:"2-digit", minute:"2-digit"})}
                      </span>
                      <span className="font-medium">{log.action}</span>
                      {log.detail && <span className="text-muted-foreground/60">— {log.detail}</span>}
                    </div>
                  ))}
                </div>
            }
          </div>
        )}
      </div>

      {/* Announcement Preview */}
      {showAnnPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={() => setShowAnnPreview(false)}>
          <div className="bg-background border border-border rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
            <div className="text-center px-6 pt-6 pb-3">
              <h2 className="text-lg font-bold">{annForm.title || "(no title)"}</h2>
            </div>
            <div className="px-6 pb-4 overflow-y-auto flex-1 min-h-0">
              <div className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{__html: annForm.body || "(no body)"}} />
            </div>
            <div className="px-6 py-3 border-t border-border flex justify-center gap-2">
              <button onClick={() => setShowAnnPreview(false)}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
