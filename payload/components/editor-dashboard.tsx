import Link from "next/link";
import { getPayload } from "payload";
import config from "@payload-config";
import { MODERATED_COLLECTIONS, MODERATION_WORKFLOWS } from "@/payload/moderation/workflows";
import { latestChanges, type Change } from "./recent-changes";
import { countTagGaps, needsTagsRows, type NeedsTagsRow } from "./needs-tags";

/**
 * The first thing an editor sees in /admin (editor-experience spec §3.6):
 * shortcuts to what they edit most, what is waiting for a decision, and the
 * latest changes. Payload's own collection grid follows below.
 *
 * Styles: the hub's card / shortcut / button classes in app/(payload)/custom.scss.
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

const list: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "0.75rem 2rem", margin: "0.75rem 0 0", padding: 0, listStyle: "none" };

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

/**
 * Content visitors filter by tags, each with the rule its site reader uses for
 * "visible" (lib/content/internal/payload/*). Events have no tags yet — they
 * arrive with the events project.
 */
const PUBLISHED = { _status: { equals: "published" } };
const APPROVED = { moderationStatus: { equals: "approved" } };
const TAGGED: Array<{ collection: "caseStudies" | "livedExperiences" | "newsPosts" | "researchOutputs" | "agendas"; label: string; where: Row }> = [
  { collection: "caseStudies", label: "Case studies", where: { and: [PUBLISHED, APPROVED] } },
  { collection: "livedExperiences", label: "Lived experiences", where: { and: [PUBLISHED, { or: [APPROVED, { moderationStatus: { exists: false } }] }] } },
  { collection: "newsPosts", label: "News", where: PUBLISHED },
  { collection: "researchOutputs", label: "Research outputs", where: APPROVED },
  { collection: "agendas", label: "Agendas", where: {} },
];

/** Per content type, how many items visitors can see have no Themes / no Communities tag. */
async function needsTags(payload: Awaited<ReturnType<typeof getPayload>>): Promise<NeedsTagsRow[]> {
  const tags = await payload
    .find({ collection: "tags", select: { category: true } as never, pagination: false, depth: 0, overrideAccess: true })
    .catch(() => ({ docs: [] }));
  const categories = new Map((tags.docs as Row[]).map((t) => [String(t.id), str(t.category)]));
  if (categories.size === 0) return [];
  const counts = await Promise.all(
    TAGGED.map(async ({ collection, label, where }) => {
      const res = await payload
        .find({
          collection,
          where: where as never,
          select: { tags: true } as never,
          pagination: false,
          sort: "createdAt",
          depth: 0,
          overrideAccess: true,
        })
        .catch(() => ({ docs: [] }));
      return { collection, label, ...countTagGaps(res.docs as Row[], categories) };
    }),
  );
  return needsTagsRows(counts);
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
    <div className="ccm-card">
      <h2>{communities.length === 1 ? "Your community" : "Your communities"}</h2>
      {communities.length === 0 ? (
        <p style={{ margin: "0.75rem 0 0", opacity: 0.8 }}>You aren&apos;t a lead for any community yet — ask the team to add you.</p>
      ) : (
        <ul style={{ margin: "0.75rem 0 0", padding: 0, listStyle: "none", display: "grid", gap: "0.75rem" }}>
          {communities.map((c) => (
            <li key={String(c.id)} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem 1.25rem" }}>
              <strong>{str(c.name) || "Community"}</strong>
              {str(c.updatedAt) && <span style={{ opacity: 0.7 }}>Last changed {ago(str(c.updatedAt))}</span>}
              <Link className="ccm-button" href={`/admin/collections/regionalCommunities/${String(c.id)}`}>Edit</Link>
              <a className="ccm-button ccm-button--secondary" href={`/en/communities/${str(c.slug)}`}>View on site</a>
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
  const [rows, changes, untagged] = await Promise.all([
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
    needsTags(payload),
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
      <div className="ccm-shortcuts">
        {shortcuts.map((s) => (
          <Link key={s.href} href={s.href} className="ccm-shortcut">
            <span>{s.label}</span>
            <span aria-hidden="true">→</span>
          </Link>
        ))}
      </div>

      <div className="ccm-card">
        <h2>
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

      {untagged.length > 0 && (
        <div className="ccm-card">
          <h2>Needs tags</h2>
          <p style={{ margin: "0.5rem 0 0", opacity: 0.8, fontSize: "0.9rem" }}>
            Visitors filter by Themes and Communities tags. These published items don&apos;t have them yet, so filters can&apos;t find them.
          </p>
          <ul style={{ margin: "0.75rem 0 0", padding: 0, listStyle: "none", display: "grid", gap: "0.4rem" }}>
            {untagged.map((r) => (
              <li key={r.collection}>
                <strong>{r.label}</strong> ({r.total}):{" "}
                {r.noThemes.href ? <Link href={r.noThemes.href}>{r.noThemes.count} without themes</Link> : <span style={{ opacity: 0.7 }}>all have themes</span>}
                {" · "}
                {r.noCommunities.href ? (
                  <Link href={r.noCommunities.href}>{r.noCommunities.count} without communities</Link>
                ) : (
                  <span style={{ opacity: 0.7 }}>all have communities</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {changes.length > 0 && (
        <div className="ccm-card">
          <h2>Recent changes</h2>
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
