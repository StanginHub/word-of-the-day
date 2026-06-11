"use client";
import { useState } from "react";

type Word = {id:string;word:string;fetched_date:string;definition:string|null;pos:string|null;ipa:string|null;cefr:string|null;topic:string|null;thai_translations:string[]|null;synonyms:string[]|null};

export function AdminPanel({ initialWords }: { initialWords: Word[] }) {
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [msg, setMsg] = useState<{t:string;text:string}|null>(null);
  const [editing, setEditing] = useState<Word|null>(null);
  const [editForm, setEditForm] = useState<Record<string,string>>({});
  const [words, setWords] = useState(initialWords);

  const b = () => String.fromCharCode(66, 101, 97, 114, 101, 114);
  const auth = () => ({ "Content-Type": "application/json", Authorization: b() + " " + secret });

  const sortByDate = () => {
    setWords([...words].sort((a, b) => b.fetched_date.localeCompare(a.fetched_date)));
  };

  const act = async (endpoint: string, label: string) => {
    setLoading(true); setMsg(null);
    try {
      const res = await fetch(endpoint, { method: "POST", headers: auth() });
      const data = await res.json();
      if (res.ok) setMsg({t:"success", text:label + " done" + (data.imported ? " (" + data.imported + " words)" : "")});
      else if (res.status===401) { setAuthed(false); setMsg({t:"error", text:"Wrong secret"}); }
      else setMsg({t:"error", text:label + " failed"});
    } catch { setMsg({t:"error", text:"Network error"}); }
    finally { setLoading(false); }
  };

  const openEdit = (w: Word | null) => {
    setEditing(w);
    setEditForm(w ? {
      word: w.word, fetched_date: w.fetched_date, definition: w.definition || "",
      pos: w.pos || "", ipa: w.ipa || "", cefr: w.cefr || "", topic: w.topic || "",
      thai_translations: (w.thai_translations||[]).join(", "),
      synonyms: (w.synonyms||[]).join(", "),
    } : { word:"", fetched_date:"", definition:"", pos:"", ipa:"", cefr:"", topic:"", thai_translations:"", synonyms:"" });
    setMsg(null);
  };

  const saveEdit = async () => {
    setLoading(true); setMsg(null);
    const payload: Record<string,unknown> = { id: editing?.id };
    for (const f of ["word","fetched_date","definition","pos","ipa","cefr","topic"]) if (editForm[f]) payload[f] = editForm[f];
    for (const f of ["thai_translations","synonyms"]) {
      const v = editForm[f]?.trim();
      payload[f] = v ? v.split(",").map((s:string) => s.trim()).filter(Boolean) : [];
    }
    try {
      const res = await fetch("/api/admin/update-word", { method: "POST", headers: auth(), body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) { setEditing(null); setMsg({t:"success", text: (editing?.word||"Word") + " saved!" }); setTimeout(() => window.location.reload(), 800); }
      else setMsg({t:"error", text: data.error || "Failed"});
    } catch { setMsg({t:"error", text:"Save failed"}); }
    finally { setLoading(false); }
  };

  const deleteWord = async (w: Word) => {
    if (!confirm("Delete " + w.word + "?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/update-word", { method: "DELETE", headers: auth(), body: JSON.stringify({ id: w.id }) });
      if (res.ok) { setMsg({t:"success", text: w.word + " deleted" }); setTimeout(() => window.location.reload(), 800); }
      else setMsg({t:"error", text:"Delete failed"});
    } catch { setMsg({t:"error", text:"Network error"}); }
    finally { setLoading(false); }
  };

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
              onChange={e => setSecret(e.target.value)} onKeyDown={e => e.key === "Enter" && setAuthed(true)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
            <button onClick={() => setAuthed(true)}
              className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition active:scale-[0.98]">
              Unlock
            </button>
          </div>
          {msg && <p className={"mt-3 text-xs text-center " + (msg.t === "error" ? "text-destructive" : "text-green-600")}>{msg.text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="bg-card border border-border rounded-xl px-5 py-3">
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold">{words.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl px-5 py-3">
          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Latest</p>
          <p className="text-base font-bold">{words[0]?.word || "-"} <span className="text-xs font-mono text-muted-foreground/60 font-normal">{words[0]?.fetched_date}</span></p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => act("/api/admin/import-rss", "Import RSS")} disabled={loading}
          className="px-3.5 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition active:scale-[0.97]">{loading ? "..." : "Import RSS"}</button>
        <button onClick={() => act("/api/admin/trigger-fetch", "Fetch")} disabled={loading}
          className="px-3.5 py-2 bg-accent text-accent-foreground rounded-lg text-xs font-semibold hover:bg-accent/90 disabled:opacity-50 transition active:scale-[0.97]">{loading ? "..." : "Oxford Fetch"}</button>
        <button onClick={() => act("/api/admin/enrich", "Enrich")} disabled={loading}
          className="px-3.5 py-2 bg-secondary text-secondary-foreground rounded-lg text-xs font-semibold hover:bg-secondary/80 disabled:opacity-50 transition active:scale-[0.97]">{loading ? "..." : "Enrich"}</button>
        <button onClick={sortByDate}
          className="px-3.5 py-2 border border-border rounded-lg text-xs hover:bg-muted transition active:scale-[0.97]">Sort by Date</button>
        <button onClick={() => openEdit(null)}
          className="px-3.5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition active:scale-[0.97]">+ New Word</button>
      </div>

      {/* Message */}
      {msg && (
        <div className={"px-4 py-2.5 rounded-lg text-sm border " + (msg.t === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200")}>
          {msg.text}
        </div>
      )}

      {/* Edit Modal */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
          <div className="bg-background border border-border rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-background border-b border-border px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-bold">{editing?.id ? editing.word : "New Word"}</h3>
              <button onClick={() => setEditing(null)} className="text-muted-foreground/60 hover:text-foreground transition p-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-5 space-y-3">
              {[
                ["word","Word *","text"], ["fetched_date","Date *","text"], ["definition","Definition","text"],
                ["pos","Part of Speech","text"], ["ipa","IPA","text"], ["cefr","CEFR Level","text"],
                ["topic","Topic / Word List","text"], ["thai_translations","Thai (comma-separated)","text"],
                ["synonyms","Synonyms (comma-separated)","text"]
              ].map(([field, label, type]) => (
                <div key={field}>
                  <label className="text-[11px] font-mono text-muted-foreground/70 uppercase tracking-wider">{label}</label>
                  <input type={type} value={editForm[field]||""}
                    onChange={e => setEditForm({...editForm, [field]: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background mt-0.5 focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              ))}
            </div>
            <div className="sticky bottom-0 bg-background border-t border-border px-5 py-3.5 flex gap-2 justify-end">
              <button onClick={() => setEditing(null)}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition">Cancel</button>
              <button onClick={saveEdit} disabled={loading}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition active:scale-[0.97]">{loading ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Words Table */}
      
      {/* Announcement Editor */}
      <div className="border border-border rounded-2xl overflow-hidden">
        <div className="bg-muted/50 px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-sm">Announcement</h2>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-[11px] font-mono text-muted-foreground/70 uppercase tracking-wider">Title</label>
            <input type="text" id="ann-title" placeholder="e.g. Welcome!"
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background mt-0.5 focus:outline-none focus:ring-2 focus:ring-accent/30" />
          </div>
          <div>
            <label className="text-[11px] font-mono text-muted-foreground/70 uppercase tracking-wider">Body</label>
            <textarea id="ann-body" rows={3} placeholder="Announcement text..."
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background mt-0.5 focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none" />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="ann-enabled" className="accent-accent" />
              <span className="text-sm">Enabled</span>
            </label>
            <button onClick={async () => {
              const title = (document.getElementById("ann-title") as HTMLInputElement).value;
              const body = (document.getElementById("ann-body") as HTMLTextAreaElement).value;
              const enabled = (document.getElementById("ann-enabled") as HTMLInputElement).checked;
              const res = await fetch("/api/admin/announcement", {
                method: "POST", headers: auth(),
                body: JSON.stringify({ title, body: body, enabled }),
              });
              const d = await res.json();
              if (d.success) setMsg({t:"success", text:"Announcement saved!"});
              else setMsg({t:"error", text:"Failed"});
            }} disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition">
              Save Announcement
            </button>
          </div>
        </div>
      </div>

      {/* Words Table */}
      <div className="border border-border rounded-2xl overflow-hidden">
        <div className="bg-muted/50 px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-sm">Words</h2>
          <span className="text-[11px] font-mono text-muted-foreground">{words.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-mono text-muted-foreground/70 uppercase tracking-wider">
                <th className="px-4 py-2.5 text-left font-normal">Date</th>
                <th className="px-4 py-2.5 text-left font-normal">Word</th>
                <th className="px-4 py-2.5 text-left font-normal hidden sm:table-cell">Thai</th>
                <th className="px-4 py-2.5 text-left font-normal hidden md:table-cell">CEFR</th>
                <th className="px-4 py-2.5 text-left font-normal hidden md:table-cell">Topic</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {words.map((w, i) => (
                <tr key={w.id} className={"transition-colors hover:bg-muted/30 " + (i < words.length-1 ? "border-b border-border/50" : "")}>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground/80">{w.fetched_date}</td>
                  <td className="px-4 py-3 font-semibold">{w.word}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell truncate max-w-[120px] lg:max-w-[200px]">{(w.thai_translations||[]).slice(0,2).join(", ")}</td>
                  <td className="px-4 py-3 text-xs hidden md:table-cell"><span className="bg-muted/80 px-2 py-0.5 rounded text-[11px] font-mono">{w.cefr || "-"}</span></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{w.topic || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(w)}
                      className="text-[11px] px-2.5 py-1 rounded bg-accent/10 text-accent hover:bg-accent/20 transition font-medium">Edit</button>
                    <button onClick={() => deleteWord(w)}
                      className="text-[11px] px-2.5 py-1 rounded text-destructive/70 hover:text-destructive hover:bg-destructive/5 transition ml-1">Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
