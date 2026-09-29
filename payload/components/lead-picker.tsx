"use client";
import { useEffect, useState } from "react";
import { FieldLabel, useField } from "@payloadcms/ui";
import type { TextFieldClientComponent } from "payload";

/**
 * The "Community leads" field (editor-experience spec §3.5): staff search hub
 * members by name or email and add them; each lead shows as a chip with ×.
 * Stores Clerk/Prisma user ids in the `leadIds` text list. Imports only React
 * and @payloadcms/ui (admin client-import gotcha); data comes from the
 * staff-only /api/admin/members route.
 */
type Member = { id: string; name: string; email: string | null };

const chip: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.35rem",
  padding: "0.25rem 0.6rem",
  borderRadius: "999px",
  background: "var(--theme-elevation-100)",
  fontSize: "0.9rem",
};

export const LeadPicker: TextFieldClientComponent = ({ path, field, readOnly }) => {
  const { value, setValue } = useField<string[]>({ path });
  const ids = Array.isArray(value) ? value : [];
  const [names, setNames] = useState<Record<string, Member>>({});
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Member[]>([]);

  const missing = ids.filter((id) => !names[id]).join(",");
  useEffect(() => {
    if (!missing) return;
    let live = true;
    fetch(`/api/admin/members?ids=${encodeURIComponent(missing)}`)
      .then((r) => (r.ok ? r.json() : { members: [] }))
      .then((d: { members: Member[] }) => {
        if (live) setNames((prev) => ({ ...prev, ...Object.fromEntries(d.members.map((m) => [m.id, m])) }));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [missing]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let live = true;
    const timer = setTimeout(() => {
      fetch(`/api/admin/members?q=${encodeURIComponent(q)}`)
        .then((r) => (r.ok ? r.json() : { members: [] }))
        .then((d: { members: Member[] }) => {
          if (live) setResults(d.members);
        })
        .catch(() => {});
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query]);

  const add = (m: Member) => {
    setNames((prev) => ({ ...prev, [m.id]: m }));
    setValue([...new Set([...ids, m.id])]);
    setQuery("");
    setResults([]);
  };
  const remove = (id: string) => setValue(ids.filter((x) => x !== id));
  const description = typeof field?.admin?.description === "string" ? field.admin.description : null;
  const shown = query.trim().length >= 2 ? results.filter((m) => !ids.includes(m.id)) : [];

  return (
    <div className="field-type" style={{ marginBottom: "1.5rem" }}>
      <FieldLabel label={field?.label ?? "Community leads"} path={path} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", margin: "0.4rem 0" }}>
        {ids.length === 0 && <span style={{ opacity: 0.7 }}>No leads yet.</span>}
        {ids.map((id) => (
          <span key={id} style={chip}>
            {names[id]?.name ?? id}
            {!readOnly && (
              <button type="button" aria-label={`Remove ${names[id]?.name ?? id}`} onClick={() => remove(id)} style={{ border: 0, background: "none", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}>
                ×
              </button>
            )}
          </span>
        ))}
      </div>
      {!readOnly && (
        <>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members by name or email…"
            aria-label="Search members by name or email"
            style={{ width: "100%", maxWidth: "28rem", padding: "0.5rem 0.75rem", borderRadius: "0.4rem", border: "1px solid var(--theme-elevation-250)" }}
          />
          {shown.length > 0 && (
            <ul style={{ listStyle: "none", margin: "0.3rem 0 0", padding: 0, maxWidth: "28rem", border: "1px solid var(--theme-elevation-150)", borderRadius: "0.4rem" }}>
              {shown.map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => add(m)} style={{ display: "block", width: "100%", textAlign: "start", padding: "0.5rem 0.75rem", border: 0, background: "none", cursor: "pointer" }}>
                    <strong>{m.name}</strong>
                    {m.email ? <span style={{ opacity: 0.7 }}> — {m.email}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {description && <p style={{ margin: "0.4rem 0 0", opacity: 0.75, fontSize: "0.85rem" }}>{description}</p>}
    </div>
  );
};
