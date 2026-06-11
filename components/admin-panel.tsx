"use client";
import { useState } from "react";

export function AdminPanel({ initialWords }: { initialWords: Array<{id:string;word:string;fetched_date:string;definition:string|null;pos:string|null;ipa:string|null;cefr:string|null;topic:string|null;thai_translations:string[]|null;synonyms:string[]|null}> }) {
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [msg, setMsg] = useState<{t:string;text:string}|null>(null);
  const [editing, setEditing] = useState<{id:string;word:string}|null>(null);
  const [editForm, setEditForm] = useState<Record<string,string>>({});
  const [words, setWords] = useState(initialWords);

  const authHeader = () => {
    const b = String.fromCharCode(66, 101, 97, 114, 101, 114);
    return { "Content-Type": "application/json", "Authorization": b + " " + secret };
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

  const openEdit = (id: string, word: string) => {
    setEditing({id, word});
    setEditForm({});
    setMsg(null);
  };

  const saveEdit = async () => {
    setLoading(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/update-word", {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ id: editing!.id, ...editForm }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditing(null);
        setMsg({t:"success", text: editing!.word + " updated!"});
        // Refresh word list
        const r2 = await fetch("/api/admin/update-word", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": authHeader()["Authorization"] },
          body: "{}",
        });
        window.location.reload();
      } else setMsg({t:"error", text: data.error || "Failed"});
    } catch(e) { setMsg({t:"error", text: String(e)}); }
    finally { setLoading(false); }
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
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition">
            Unlock
          </button>
        </div>
        {msg && <p className={"mt-3 text-sm " + (msg.t === "error" ? "text-destructive" : "text-green-600")}>{msg.text}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div>
        <h2 className="text-lg font-bold mb-3">Actions</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => act("/api/admin/import-rss", "Import RSS")} disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm font-semibold">{loading ? "..." : "Import RSS"}</button>
          <button onClick={() => act("/api/admin/trigger-fetch", "Fetch")} disabled={loading}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-50 text-sm font-semibold">{loading ? "..." : "Oxford Fetch"}</button>
          <button onClick={() => act("/api/admin/enrich", "Enrich")} disabled={loading}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50 text-sm font-semibold">{loading ? "..." : "Re-enrich"}</button>
          <button onClick={() => act("/api/admin/cleanup", "Cleanup")} disabled={loading}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50 text-sm font-semibold">{loading ? "..." : "Delete All"}</button>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-background border border-border rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5">
            <h3 className="text-lg font-bold mb-4">Edit: {editing.word}</h3>
            <div className="space-y-3">
              {["thai_translations","cefr","topic","definition","pos","ipa","etymology"].map(field => (
                <div key={field}>
                  <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{field}</label>
                  <input type="text" placeholder={field}
                    value={editForm[field] || ""}
                    onChange={e => setEditForm({...editForm, [field]: e.target.value})}
                    className="w-full px-3 py-1.5 border border-border rounded text-sm bg-background mt-0.5"
                  />
                </div>
              ))}
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
                <th className="px-3 py-2 text-left font-semibold">Date</th>
                <th className="px-3 py-2 text-left font-semibold">Word</th>
                <th className="px-3 py-2 text-left font-semibold">Thai</th>
                <th className="px-3 py-2 text-left font-semibold">CEFR</th>
                <th className="px-3 py-2 text-left font-semibold">Topic</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {words.map(w => (
                <tr key={w.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono text-xs">{w.fetched_date}</td>
                  <td className="px-3 py-2 font-bold">{w.word}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{(w.thai_translations||[]).slice(0,3).join(", ")}</td>
                  <td className="px-3 py-2">{w.cefr || "-"}</td>
                  <td className="px-3 py-2 text-xs">{w.topic || "-"}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => openEdit(w.id, w.word)}
                      className="text-xs text-accent hover:underline">Edit</button>
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
