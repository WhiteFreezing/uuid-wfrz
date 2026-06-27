"use client";

import { useState } from "react";

type Profile = { id: string; name: string; legacy?: boolean; demo?: boolean; created_at?: string };

// Browser-friendly Mojang mirror — Mojang's own api.mojang.com lacks CORS
// headers so direct browser fetch is blocked. Ashcon's API is a CORS-enabled
// pass-through to Mojang's data, used by NameMC and many others.
//   GET /v2/user/<name-or-uuid>  → full profile incl skin + history
//   GET /v2/uuid/<name>          → just the UUID
const ASHCON = "https://api.ashcon.app/mojang/v2/user";

// playerdb.co is the fallback for bulk lookups — Ashcon serves only single
// profiles. CORS-enabled, free, no auth.
const PLAYERDB = "https://playerdb.co/api/player/minecraft";

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
          Convert Minecraft usernames ↔ UUIDs, see skins, dump TSVs for bulk
          whitelist migration. Resolves via the CORS-enabled Ashcon + PlayerDB
          mirrors of Mojang's profile API — direct from your tab, no proxy.
        </p>
      </header>

      <section className="max-w-5xl mx-auto px-5 pt-6 pb-24 space-y-5">
        <div className="card p-2 flex gap-1.5 w-fit">
          <Tab on={mode === "single"} onClick={() => setMode("single")}>Single lookup</Tab>
          <Tab on={mode === "bulk"} onClick={() => setMode("bulk")}>Bulk (5 parallel)</Tab>
        </div>
        {mode === "single" ? <Single /> : <Bulk />}

        <details className="card p-5">
          <summary className="cursor-pointer text-sm font-semibold">About the data</summary>
          <div className="mt-3 text-sm text-dim space-y-2">
            <p>Mojang's own <code className="text-brand">api.mojang.com</code> and
              <code className="text-brand"> sessionserver.mojang.com</code> don't send CORS headers,
              so direct browser fetch from any other origin is blocked. We hit two free
              public mirrors instead — both proxy the same data, both CORS-enabled, no auth:</p>
            <ul className="list-disc ml-6 space-y-1">
              <li><a className="text-brand hover:underline" href="https://github.com/Electroid/mojang-api" target="_blank" rel="noopener">Ashcon</a>
                — single profile lookups (incl. skin / cape URLs + account creation date)</li>
              <li><a className="text-brand hover:underline" href="https://playerdb.co" target="_blank" rel="noopener">PlayerDB</a>
                — bulk parallel lookups, 5 at a time</li>
            </ul>
            <p>UUID format conversion: Mojang returns the "trimmed" form
              <code className="text-brand"> 8a1f7c1c5b94493a8a1d7f5e0f0e1e2f</code>. The dashed form
              <code className="text-brand"> 8a1f7c1c-5b94-493a-8a1d-7f5e0f0e1e2f</code> is what bukkit.yml
              and most plugins expect.</p>
          </div>
        </details>
      </section>

      <footer className="border-t border-border/70 py-8 text-sm text-dim">
        <div className="max-w-5xl mx-auto px-5 flex items-center justify-between flex-wrap gap-4">
          <div>Powered by <a className="hover:text-text" href="https://github.com/Electroid/mojang-api" target="_blank" rel="noopener">Ashcon</a> + <a className="hover:text-text" href="https://playerdb.co" target="_blank" rel="noopener">PlayerDB</a> mirrors of the Mojang profile API. No tracking.</div>
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
      const r = await fetch(`${ASHCON}/${encodeURIComponent(q.trim())}`);
      if (r.status === 404) throw new Error("Profile not found");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      // Ashcon's format: { uuid: 'xxxx-xxxx-...', username: 'Name', created_at: '2010-01-10', ... }
      setData({
        id: (j.uuid as string).replace(/-/g, ""),
        name: j.username,
        created_at: j.created_at,
      });
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
    setRows([...all]);
    // Ashcon serves one profile per request — parallelise in batches of 5 to
    // avoid pummeling them; tradeoff vs Mojang's old 10-per-POST bulk endpoint.
    const BATCH = 5;
    for (let i = 0; i < names.length; i += BATCH) {
      const chunk = names.slice(i, i + BATCH);
      await Promise.all(chunk.map(async (n) => {
        const idx = all.findIndex(x => x.name === n);
        try {
          const r = await fetch(`${PLAYERDB}/${encodeURIComponent(n)}`);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const j = await r.json();
          if (j.code === "player.found" && j.data?.player?.id) {
            all[idx].id = j.data.player.id.replace(/-/g, "");
          } else {
            all[idx].error = "not found";
          }
        } catch (e: any) {
          all[idx].error = e.message;
        }
      }));
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
