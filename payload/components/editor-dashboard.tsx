import Link from "next/link";
import { getPayload } from "payload";
import config from "@payload-config";
import { MODERATED_COLLECTIONS, MODERATION_WORKFLOWS } from "@/payload/moderation/workflows";
import { latestChanges, type Change } from "./recent-changes";

/**
 * The first thing an editor sees in /admin (editor-experience spec §3.6):
 * shortcuts to what they edit most, what is waiting for a decision, and the
 * latest changes. Payload's own collection grid follows below.
 *
 * A server component (a `beforeDashboard` slot, which receives `user`), so it
 * may read through the Local API. It imports pure modules only — see
 * payload-admin-client-import-gotcha.
 */
const LABELS: Record<string, string> = {
  caseStudies: "Case studies",
  events: "Events",
  livedExperiences: "Lived experiences",
  researchOutputs: "Research outputs",
};

const card: React.CSSProperties = {
  border: "1px solid var(--theme-elevation-150)",
  borderRadius: "0.5rem",
  padding: "1rem 1.25rem",
  marginBottom: "1.5rem",
  background: "var(--theme-elevation-0)",
};
const list: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "0.75rem 2rem", margin: "0.75rem 0 0", padding: 0, listStyle: "none" };
const shortcut: React.CSSProperties = {
  display: "block",
  border: "1px solid var(--theme-elevation-150)",
  borderRadius: "0.5rem",
  padding: "0.9rem 1.1rem",
  background: "var(--theme-elevation-0)",
  fontWeight: 600,
  textDecoration: "none",
};

const DAY = 24 * 60 * 60 * 1000;
const ago = (iso: string) => {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / DAY);
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(days, "day");
};

type Row = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : "");

async function recentChanges(payload: Awaited<ReturnType<typeof getPayload>>): Promise<Change[]> {
  const [pages, communities, homepage] = await Promise.all([
    payload
      .find({ collection: "pages", select: { title: true, updatedAt: true } as never, sort: "-updatedAt", limit: 5, draft: true, locale: "en", depth: 0, overrideAccess: true })
      .catch(() => ({ docs: [] })),
    payload
      .find({ collection: "regionalCommunities", select: { name: true, updatedAt: true } as never, sort: "-updatedAt", limit: 5, draft: true, locale: "en", depth: 0, overrideAccess: true })
      .catch(() => ({ docs: [] })),
    payload.findGlobal({ slug: "homepage", draft: true, depth: 0, overrideAccess: true }).catch(() => null),
  ]);
  const changes: Change[] = [
    ...(pages.docs as Row[]).map((d) => ({ kind: "Page", label: str(d.title) || "Untitled page", href: `/admin/collections/pages/${String(d.id)}`, updatedAt: str(d.updatedAt) })),
    ...(communities.docs as Row[]).map((d) => ({ kind: "Community", label: str(d.name) || "Community", href: `/admin/collections/regionalCommunities/${String(d.id)}`, updatedAt: str(d.updatedAt) })),
    ...(homepage?.updatedAt ? [{ kind: "Homepage", label: "Homepage", href: "/admin/globals/homepage", updatedAt: str(homepage.updatedAt) }] : []),
  ];
  return latestChanges(changes.filter((c) => c.updatedAt), 8);
}

/** A community lead's home: the communities they look after, with Edit and View on site. */
async function LeadHome({ clerkId }: { clerkId: string }) {
  const payload = await getPayload({ config });
  const res = await payload
    .find({
      collection: "regionalCommunities",
      where: { leadIds: { in: [clerkId] } },
      select: { name: true, slug: true, updatedAt: true } as never,
      draft: true,
      depth: 0,
      locale: "en",
      overrideAccess: true,
    })
    .catch(() => ({ docs: [] }));
  const communities = res.docs as Row[];
  return (
    <div style={card}>
      <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{communities.length === 1 ? "Your community" : "Your communities"}</h2>
      {communities.length === 0 ? (
        <p style={{ margin: "0.75rem 0 0", opacity: 0.8 }}>You aren&apos;t a lead for any community yet — ask the team to add you.</p>
      ) : (
        <ul style={{ margin: "0.75rem 0 0", padding: 0, listStyle: "none", display: "grid", gap: "0.75rem" }}>
          {communities.map((c) => (
            <li key={String(c.id)} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem 1.25rem" }}>
              <strong>{str(c.name) || "Community"}</strong>
              {str(c.updatedAt) && <span style={{ opacity: 0.7 }}>Last changed {ago(str(c.updatedAt))}</span>}
              <Link href={`/admin/collections/regionalCommunities/${String(c.id)}`}>Edit</Link>
              <a href={`/en/communities/${str(c.slug)}`}>View on site</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export async function EditorDashboard({ user }: { user?: { role?: string | null; clerkId?: string | null } | null }) {
  if (user?.role === "community_editor") return user.clerkId ? <LeadHome clerkId={user.clerkId} /> : null;

  const payload = await getPayload({ config });
  const [rows, changes] = await Promise.all([
    Promise.all(
      MODERATED_COLLECTIONS.map(async (collection) => {
        const [pending, revision] = await Promise.all(
          (["pending", "revision"] as const).map((status) =>
            payload
              .count({ collection, where: { moderationStatus: { equals: status } }, overrideAccess: true })
              .then((r) => r.totalDocs)
              .catch(() => 0),
          ),
        );
        return { collection, pending, revision };
      }),
    ),
    recentChanges(payload),
  ]);
  const waiting = rows.reduce((n, r) => n + r.pending, 0);

  const shortcuts = [
    { href: "/admin/globals/homepage", label: "Edit the homepage" },
    { href: "/admin/collections/pages", label: "Pages" },
    { href: "/admin/collections/regionalCommunities", label: "Communities" },
    { href: "/en/moderation", label: `Waiting for review (${waiting})` },
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {shortcuts.map((s) => (
          <Link key={s.href} href={s.href} style={shortcut}>
            {s.label} →
          </Link>
        ))}
      </div>

      <div style={card}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
          <Link href="/en/moderation">
            {waiting === 0 ? "Nothing waiting for review" : `${waiting} submission${waiting === 1 ? "" : "s"} waiting for review`}
          </Link>
        </h2>
        <ul style={list}>
          {rows.map(({ collection, pending, revision }) => (
            <li key={collection}>
              <Link href={`/admin/collections/${collection}?where[moderationStatus][equals]=pending`}>
                <strong>{LABELS[collection] ?? MODERATION_WORKFLOWS[collection].collection}</strong>: {pending} pending
              </Link>
              {revision > 0 ? <span style={{ opacity: 0.7 }}> · {revision} sent back for revision</span> : null}
            </li>
          ))}
        </ul>
        <p style={{ margin: "0.75rem 0 0", opacity: 0.8, fontSize: "0.9rem" }}>
          Review everything in one list on the site&apos;s moderation page, or open a submission here — the buttons sit at the top of the document.
        </p>
      </div>

      {changes.length > 0 && (
        <div style={card}>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Recent changes</h2>
          <ul style={{ margin: "0.75rem 0 0", padding: 0, listStyle: "none", display: "grid", gap: "0.4rem" }}>
            {changes.map((c) => (
              <li key={`${c.href}-${c.updatedAt}`}>
                <span style={{ opacity: 0.7 }}>{c.kind} · </span>
                <Link href={c.href}>{c.label}</Link>
                <span style={{ opacity: 0.7 }}> — {ago(c.updatedAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default EditorDashboard;
