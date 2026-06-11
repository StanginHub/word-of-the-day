"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AdminPanel() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleAction = async (endpoint: string, action: string) => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: `${action} completed! ${data.imported ? `Imported ${data.imported} items` : data.message || ""}`,
        });
      } else {
        setMessage({
          type: "error",
          text: `${action} failed: ${data.error}`,
        });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: `${action} error: ${String(err)}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">Admin Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cleanup */}
          <button
            onClick={() => handleAction("/api/admin/cleanup", "Cleanup")}
            disabled={loading}
            className="px-4 py-3 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50 font-semibold transition"
          >
            {loading ? "Processing..." : "🗑️ Delete All Data"}
          </button>

          {/* Import RSS */}
          <button
            onClick={() => handleAction("/api/admin/import-rss", "Import RSS")}
            disabled={loading}
            className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 font-semibold transition"
          >
            {loading ? "Processing..." : "📥 Import from RSS"}
          </button>

          {/* Trigger Fetch */}
          <button
            onClick={() => handleAction("/api/admin/trigger-fetch", "Trigger Fetch")}
            disabled={loading}
            className="px-4 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-50 font-semibold transition"
          >
            {loading ? "Processing..." : "⚡ Run Fetch Now"}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Workflow */}
      <div className="border border-border rounded-lg p-6 bg-muted/30">
        <h3 className="font-bold mb-3">Recommended Workflow:</h3>
        <ol className="space-y-2 text-sm list-decimal list-inside">
          <li>
            <strong>1. Cleanup:</strong> Delete old test data
          </li>
          <li>
            <strong>2. Import RSS:</strong> Load data from Feedburner
          </li>
          <li>
            <strong>3. Verify:</strong> Check the recent words table above
          </li>
          <li>
            <strong>4. Run Fetch:</strong> Get today's word from Oxford
          </li>
        </ol>
      </div>
    </div>
  );
}
