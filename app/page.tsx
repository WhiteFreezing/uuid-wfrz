"use client";

import { useState } from "react";

type Profile = { id: string; name: string; legacy?: boolean; demo?: boolean };

// Public Mojang API endpoints — CORS-enabled, no auth.
const API_NAME    = "https://api.mojang.com/users/profiles/minecraft";
const API_BULK    = "https://api.mojang.com/profiles/minecraft";
const API_HISTORY = "https://sessionserver.mojang.com/session/minecraft/profile"; // /<uuid>?unsigned=false

export default function HomePage() {
  const [mode, setMode] = useState<"single" | "bulk">("single");

  return (
    <main className="min-h-screen">
      <header className="max-w-5xl mx-auto px-5 pt-10">
        <div className="text-xs uppercase tracking-[0.18em] text-dim mb-2">wfrz.eu · open source</div>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
          MC UUID lookup<span className="text-brand">.</span>
        </h1>
        <p className="text-dim mt-3 max-w-2xl">
          Mojang's public API in your browser. Convert usernames ↔ UUIDs, see
          skins, dump CSVs for bulk whitelist migration. No tracking, no rate-
          limit headaches on the API side (we hit them directly from your tab).
        </p>
      </header>

      <section className="max-w-5xl mx-auto px-5 pt-6 pb-24 space-y-5">
        <div className="card p-2 flex gap-1.5 w-fit">
          <Tab on={mode === "single"} onClick={() => setMode("single")}>Single lookup</Tab>
          <Tab on={mode === "bulk"} onClick={() => setMode("bulk")}>Bulk (up to 10 / request)</Tab>
        </div>
        {mode === "single" ? <Single /> : <Bulk />}

        <details className="card p-5">
          <summary className="cursor-pointer text-sm font-semibold">About the data</summary>
          <div className="mt-3 text-sm text-dim space-y-2">
            <p>Hits <code className="text-brand">api.mojang.com</code> and
              <code className="text-brand">sessionserver.mojang.com</code> directly from your browser.
              Mojang's CORS-enabled public endpoints — no proxy in between.</p>
            <p>Rate limit (per IP): ~600 req/10 min for the bulk endpoint, faster for single lookups.
              Pace yourself if you're scripting against a server export.</p>
            <p>UUID format conversion: Mojang returns the "trimmed" form
              <code className="text-brand">8a1f7c1c5b94493a8a1d7f5e0f0e1e2f</code>. The dashed form
              <code className="text-brand">8a1f7c1c-5b94-493a-8a1d-7f5e0f0e1e2f</code> is what bukkit.yml
              and most plugins expect.</p>
          </div>
        </details>
      </section>

      <footer className="border-t border-border/70 py-8 text-sm text-dim">
        <div className="max-w-5xl mx-auto px-5 flex items-center justify-between flex-wrap gap-4">
          <div>Powered by Mojang's public API. No tracking.</div>
          <a href="https://github.com/WhiteFreezing/uuid-wfrz" target="_blank" rel="noopener" className="hover:text-text">GitHub →</a>
        </div>
      </footer>
    </main>
  );
}

function Single() {
  const [q, setQ] = useState("Notch");
  const [data, setData] = useState<Profile | null>(null);
  const [err, setErr] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true); setErr(""); setData(null);
    try {
      const isUuid = /^[0-9a-f]{32}$|^[0-9a-f-]{36}$/i.test(q.trim());
      let p: Profile | null = null;
      if (isUuid) {
        const id = q.replace(/-/g, "");
        const r = await fetch(`${API_HISTORY}/${id}`);
        if (r.status === 404 || r.status === 204) throw new Error("UUID not found");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        p = { id: j.id, name: j.name };
      } else {
        const r = await fetch(`${API_NAME}/${encodeURIComponent(q.trim())}`);
        if (r.status === 404 || r.status === 204) throw new Error("Username not found");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        p = await r.json();
      }
      setData(p);
    } catch (e: any) {
      setErr(e.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <label className="block text-xs uppercase tracking-wider text-dim mb-2">Username or UUID</label>
        <div className="flex gap-2">
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            className="input text-lg !py-3 flex-1" spellCheck={false} autoFocus
            placeholder="Notch  or  069a79f444e94726a5befca90e38aaf5"
          />
          <button onClick={go} disabled={loading} className="btn-brand">{loading ? "…" : "Lookup"}</button>
        </div>
      </div>

      {err && <div className="card p-4 border-red-500/50 bg-red-500/5 text-sm text-red-200">{err}</div>}

      {data && <ProfileCard p={data} />}
    </div>
  );
}

function ProfileCard({ p }: { p: Profile }) {
  const dashed = `${p.id.slice(0,8)}-${p.id.slice(8,12)}-${p.id.slice(12,16)}-${p.id.slice(16,20)}-${p.id.slice(20)}`;
  return (
    <div className="card p-5 flex gap-5 items-start flex-wrap">
      <img src={`https://mc-heads.net/body/${p.id}/144`} alt={p.name} width={64} height={144} className="rounded-lg" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="text-2xl font-extrabold">{p.name}</div>
        {p.legacy && <span className="chip">legacy account</span>}
        {p.demo && <span className="chip">demo account</span>}
        <CopyRow label="UUID (trimmed)" value={p.id} />
        <CopyRow label="UUID (dashed)" value={dashed} />
        <CopyRow label="NameMC link" value={`https://namemc.com/profile/${p.id}`} />
        <CopyRow label="Skin URL (mc-heads)" value={`https://mc-heads.net/skin/${p.id}`} />
      </div>
    </div>
  );
}

function Bulk() {
  const [q, setQ] = useState("Notch\njeb_\nDinnerbone\nGrumm");
  const [rows, setRows] = useState<{ name: string; id?: string; error?: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function go() {
    const names = q.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
    if (!names.length) return;
    setLoading(true);
    const all: { name: string; id?: string; error?: string }[] = names.map((n) => ({ name: n }));
    // POST in chunks of 10 (Mojang limit)
    for (let i = 0; i < names.length; i += 10) {
      const chunk = names.slice(i, i + 10);
      try {
        const r = await fetch(API_BULK, {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify(chunk),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j: { id: string; name: string }[] = await r.json();
        const map = new Map(j.map(x => [x.name.toLowerCase(), x.id]));
        chunk.forEach((n) => {
          const idx = all.findIndex(x => x.name === n);
          const id = map.get(n.toLowerCase());
          if (id) all[idx].id = id;
          else all[idx].error = "not found";
        });
      } catch (e: any) {
        chunk.forEach((n) => {
          const idx = all.findIndex(x => x.name === n);
          all[idx].error = e.message;
        });
      }
      setRows([...all]);
    }
    setLoading(false);
  }

  const tsv = rows.map(r => r.id ? `${r.name}\t${r.id}\t${dashed(r.id)}` : `${r.name}\t\t# ${r.error}`).join("\n");

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <label className="block text-xs uppercase tracking-wider text-dim mb-2">Usernames (one per line, space, comma, or semicolon-separated)</label>
        <textarea
          value={q} onChange={(e) => setQ(e.target.value)}
          className="input font-mono text-sm h-40 resize-y"
        />
        <div className="flex gap-2 mt-3">
          <button onClick={go} disabled={loading} className="btn-brand">{loading ? "Looking up…" : "Lookup all"}</button>
          {rows.length > 0 && (
            <button onClick={() => { navigator.clipboard.writeText(tsv); }} className="chip">Copy TSV</button>
          )}
        </div>
      </div>

      {rows.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-dim bg-muted/60">
              <tr><th className="text-left p-3">Name</th><th className="text-left p-3">UUID (trimmed)</th><th className="text-left p-3">UUID (dashed)</th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-border/60">
                  <td className="p-3 font-mono">{r.name}</td>
                  <td className="p-3 font-mono text-brand">{r.id ?? <span className="text-red-300">{r.error}</span>}</td>
                  <td className="p-3 font-mono text-dim">{r.id ? dashed(r.id) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Tab({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm font-semibold transition ${on ? "bg-brand text-white" : "text-dim hover:text-text"}`}>
      {children}
    </button>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-dim w-32">{label}</span>
      <code className="flex-1 text-xs bg-muted border border-border rounded px-2 py-1 overflow-x-auto whitespace-nowrap font-mono">{value}</code>
      <button onClick={() => navigator.clipboard.writeText(value)}
        className="text-xs px-2 py-1 rounded bg-muted border border-border hover:bg-border">copy</button>
    </div>
  );
}

function dashed(id: string) {
  return `${id.slice(0,8)}-${id.slice(8,12)}-${id.slice(12,16)}-${id.slice(16,20)}-${id.slice(20)}`;
}
