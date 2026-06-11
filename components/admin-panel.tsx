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
  const [translateInput, setTranslateInput] = useState("");
  const [translateResult, setTranslateResult] = useState("");
  const [translating, setTranslating] = useState(false);

  const bPrefix = () => String.fromCharCode(66, 101, 97, 114, 101, 114);
  const authHeader = () => ({ "Content-Type": "application/json", "Authorization": bPrefix() + " " + secret });

  const sortByDate = () => {
    setWords([...words].sort((a, b) => b.fetched_date.localeCompare(a.fetched_date)));
  };

  const act = async (endpoint: string, label: string) => {
    setLoading(true); setMsg(null);
    try {
      const res = await fetch(endpoint, { method: "POST", headers: authHeader() });
      const data = await res.json();
      if (res.ok) setMsg({t:"success", text:label + " done. " + (data.imported ? "Imported " + data.imported + " words" : data.message || "")});
      else if (res.status===401) { setAuthed(false); setMsg({t:"error", text:"Wrong secret"}); }
      else setMsg({t:"error", text:label + " failed: " + (data.error || "?")});
    } catch(e) { setMsg({t:"error", text:"Network: " + String(e)}); }
    finally { setLoading(false); }
  };

  const openEdit = (w: Word | null) => {
    setEditing(w);
    setEditForm(w ? {
      word: w.word,
      fetched_date: w.fetched_date,
      definition: w.definition || "",
      pos: w.pos || "",
      ipa: w.ipa || "",
      cefr: w.cefr || "",
      topic: w.topic || "",
      thai_translations: (w.thai_translations||[]).join(", "),
      synonyms: (w.synonyms||[]).join(", "),
    } : { word:"", fetched_date:"", definition:"", pos:"", ipa:"", cefr:"", topic:"", thai_translations:"", synonyms:"" });
    setTranslateResult("");
    setTranslateInput("");
    setMsg(null);
  };

  const saveEdit = async () => {
    setLoading(true); setMsg(null);
    const payload: Record<string,unknown> = { id: editing?.id };
    const fields = ["word","fetched_date","definition","pos","ipa","cefr","topic"];
    for (const f of fields) if (editForm[f]) payload[f] = editForm[f];
    // Parse array fields
    for (const f of ["thai_translations","synonyms"]) {
      const v = editForm[f]?.trim();
      payload[f] = v ? v.split(",").map((s:string) => s.trim()).filter(Boolean) : [];
    }
    try {
      const method = editing ? "POST" : "PUT";
      const url = editing ? "/api/admin/update-word" : "/api/admin/update-word";
      const res = await fetch(url, { method, headers: authHeader(), body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) { setEditing(null); setMsg({t:"success", text: (editing?.word||"Word") + " saved!" }); window.location.reload(); }
      else setMsg({t:"error", text: data.error || "Failed"});
    } catch(e) { setMsg({t:"error", text: String(e)}); }
    finally { setLoading(false); }
  };

  const deleteWord = async (w: Word) => {
    if (!confirm("Delete " + w.word + " (" + w.fetched_date + ")?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/update-word", {
        method: "DELETE",
        headers: authHeader(),
        body: JSON.stringify({ id: w.id }),
      });
      const data = await res.json();
      if (res.ok) { setMsg({t:"success", text: w.word + " deleted!" }); window.location.reload(); }
      else setMsg({t:"error", text: data.error || "Failed"});
    } catch(e) { setMsg({t:"error", text: String(e)}); }
    finally { setLoading(false); }
  };

  const translateNow = async () => {
    if (!translateInput.trim()) return;
    setTranslating(true); setTranslateResult("...");
    try {
      // Try DeepL
      const deeplRes = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: { "Authorization": "DeepL-Auth-Key " + process.env.NEXT_PUBLIC_DEEPL_KEY, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ text: translateInput.trim(), target_lang: "TH" }),
      });
      if (deeplRes.ok) {
        const d = await deeplRes.json();
        setTranslateResult(d.translations?.[0]?.text || "?");
      } else {
        // Fallback to Google
        const gRes = await fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=th&dt=t&q=" + encodeURIComponent(translateInput.trim()));
        const d = await gRes.json();
        setTranslateResult(d[0]?.[0]?.[0] || "?");
      }
    } catch(e) { setTranslateResult("Error: " + String(e)); }
    finally { setTranslating(false); }
  };

  if (!authed) {
    return (
      <div className="border rounded-xl p-6 max-w-sm mx-auto border-border">
        <h2 className="text-lg font-bold mb-4">Admin Access</h2>
        <div className="space-y-3">
          <input type="password" placeholder="Enter admin secret" value={secret}
            onChange={e => setSecret(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-background border-border"
            onKeyDown={e => e.key === "Enter" && setAuthed(true)}
          />
          <button onClick={() => setAuthed(true)}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition">Unlock</button>
        </div>
        {msg && <p className={"mt-3 text-sm " + (msg.t === "error" ? "text-destructive" : "text-green-600")}>{msg.text}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold mr-2">Actions</h2>
        <button onClick={() => act("/api/admin/import-rss", "Import RSS")} disabled={loading}
          className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-semibold hover:bg-primary/90 disabled:opacity-50">{loading ? "..." : "Import RSS"}</button>
        <button onClick={() => act("/api/admin/trigger-fetch", "Fetch")} disabled={loading}
          className="px-3 py-1.5 bg-accent text-accent-foreground rounded text-xs font-semibold hover:bg-accent/90 disabled:opacity-50">{loading ? "..." : "Oxford Fetch"}</button>
        <button onClick={() => act("/api/admin/enrich", "Enrich")} disabled={loading}
          className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs font-semibold hover:bg-secondary/80 disabled:opacity-50">{loading ? "..." : "Enrich"}</button>
        <button onClick={() => openEdit(null)}
          className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700">+ New Word</button>
        <button onClick={sortByDate}
          className="px-3 py-1.5 border border-border rounded text-xs hover:bg-muted">Sort by Date</button>
      </div>

      {/* Edit / Add Modal */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4">
          <div className="bg-background border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-5">
            <h3 className="text-lg font-bold mb-4">{editing?.id ? "Edit: " + editing.word : "Add New Word"}</h3>
            <div className="space-y-2.5">
              {["word","fetched_date","definition","pos","ipa","cefr","topic"].map(f => (
                <div key={f}>
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{f}</label>
                  <input type="text" value={editForm[f]||""} onChange={e => setEditForm({...editForm, [f]: e.target.value})}
                    className="w-full px-2.5 py-1.5 border border-border rounded text-sm bg-background mt-0.5" />
                </div>
              ))}
              {/* thai_translations */}
              <div>
                <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">thai_translations (comma-separated)</label>
                <input type="text" value={editForm["thai_translations"]||""} onChange={e => setEditForm({...editForm, "thai_translations": e.target.value})}
                  className="w-full px-2.5 py-1.5 border border-border rounded text-sm bg-background mt-0.5" />
              </div>
              {/* Inline Google Translate */}
              <div className="border border-accent/20 bg-accent/5 rounded-lg p-3 mt-3">
                <p className="text-[10px] font-mono text-accent uppercase tracking-wider mb-1.5">Quick Translate</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="Type English word..." value={translateInput}
                    onChange={e => setTranslateInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && translateNow()}
                    className="flex-1 px-2.5 py-1.5 border border-border rounded text-sm bg-background" />
                  <button onClick={translateNow} disabled={translating}
                    className="px-3 py-1.5 bg-accent text-accent-foreground rounded text-xs font-semibold hover:bg-accent/90 disabled:opacity-50">
                    {translating ? "..." : "Translate"}
                  </button>
                </div>
                {translateResult && (
                  <div className="mt-2 flex gap-2 items-center">
                    <span className="text-sm font-medium">{translateResult}</span>
                    <button onClick={() => {
                      const prev = editForm["thai_translations"] || "";
                      setEditForm({...editForm, "thai_translations": prev ? prev + ", " + translateResult : translateResult});
                    }}
                      className="text-[11px] px-2 py-0.5 bg-accent/10 text-accent rounded border border-accent/20 hover:bg-accent/20">
                      Add to list
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={saveEdit} disabled={loading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90">{loading ? "Saving..." : "Save"}</button>
              <button onClick={() => setEditing(null)}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div className={"p-3 rounded-lg text-sm border " + (msg.t === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200")}>
          {msg.text}
        </div>
      )}

      {/* Words Table */}
      <div>
        <h2 className="text-lg font-bold mb-3">Words ({words.length})</h2>
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-[11px]">Date</th>
                <th className="px-3 py-2 text-left font-semibold text-[11px]">Word</th>
                <th className="px-3 py-2 text-left font-semibold text-[11px]">Thai</th>
                <th className="px-3 py-2 text-left font-semibold text-[11px]">CEFR</th>
                <th className="px-3 py-2 text-left font-semibold text-[11px]">Topic</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {words.map(w => (
                <tr key={w.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono text-xs">{w.fetched_date}</td>
                  <td className="px-3 py-2 font-bold">{w.word}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{(w.thai_translations||[]).slice(0,3).join(", ")}</td>
                  <td className="px-3 py-2 text-xs">{w.cefr || "-"}</td>
                  <td className="px-3 py-2 text-xs">{w.topic || "-"}</td>
                  <td className="px-3 py-2 flex gap-1">
                    <button onClick={() => openEdit(w)}
                      className="text-[11px] text-accent hover:underline">Edit</button>
                    <button onClick={() => deleteWord(w)}
                      className="text-[11px] text-destructive hover:underline">Del</button>
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
