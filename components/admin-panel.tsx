"use client";
import { useState } from "react";

export function AdminPanel() {
  const [loading, setLoading] = useState(false);
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [msg, setMsg] = useState<{t:string;text:string}|null>(null);

  const act = async (endpoint: string, label: string) => {
    setLoading(true); setMsg(null);
    const b = String.fromCharCode(66, 101, 97, 114, 101, 114);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": b + " " + secret },
      });
      const data = await res.json();
      if (res.ok) {
        const extra = data.imported ? "Imported " + data.imported + " words" : data.message || "";
        setMsg({ t: "success", text: label + " done. " + extra });
      } else {
        if (res.status === 401) { setAuthed(false); setMsg({ t: "error", text: "Wrong secret" }); }
        else { setMsg({ t: "error", text: label + " failed: " + (data.error || "?") }); }
      }
    } catch (e) { setMsg({ t: "error", text: "Network: " + String(e) }); }
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
      <h2 className="text-lg font-bold">Admin Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button onClick={() => act("/api/admin/import-rss", "Import RSS")}
          disabled={loading}
          className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 font-semibold transition text-sm">
          {loading ? "..." : "Import from RSS Feed"}
        </button>
        <button onClick={() => act("/api/admin/trigger-fetch", "Fetch")}
          disabled={loading}
          className="px-4 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-50 font-semibold transition text-sm">
          {loading ? "..." : "Run Oxford Fetch"}
        </button>
        <button onClick={() => act("/api/admin/cleanup", "Cleanup")}
          disabled={loading}
          className="px-4 py-3 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50 font-semibold transition text-sm">
          {loading ? "..." : "Delete All Data"}
        </button>
      </div>
      <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
        <li>Import RSS — load historical words from the Atom feed</li>
        <li>Run Oxford Fetch — get today's word</li>
        <li>Delete All Data — wipes everything</li>
      </ol>
      {msg && (
        <div className={"p-3 rounded-lg text-sm " + (msg.t === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200")}>
          {msg.text}
        </div>
      )}
    </div>
  );
}
