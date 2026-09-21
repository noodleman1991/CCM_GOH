import Link from "next/link";
import { getPayload } from "payload";
import config from "@payload-config";
import { MODERATED_COLLECTIONS, MODERATION_WORKFLOWS } from "@/payload/moderation/workflows";

/**
 * The first thing an editor sees in /admin (2026-09-21): what is waiting for
 * a decision, per collection, with a link straight into the filtered list.
 * Payload's default dashboard is a flat list of twenty-three collections; the
 * nav is now grouped, and this panel puts the queue above it.
 *
 * A server component (a `beforeDashboard` slot), so it may read through the
 * Local API. It imports the pure workflow module, never the hook module —
 * see payload-admin-client-import-gotcha.
 */
const LABELS: Record<string, string> = {
  caseStudies: "Case studies",
  events: "Events",
  livedExperiences: "Lived experiences",
  researchOutputs: "Research outputs",
};

export async function EditorDashboard() {
  const payload = await getPayload({ config });
  const rows = await Promise.all(
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
  );
  const waiting = rows.reduce((n, r) => n + r.pending, 0);

  const card: React.CSSProperties = {
    border: "1px solid var(--theme-elevation-150)",
    borderRadius: "0.5rem",
    padding: "1rem 1.25rem",
    marginBottom: "1.5rem",
    background: "var(--theme-elevation-0)",
  };
  const list: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "0.75rem 2rem", margin: "0.75rem 0 0", padding: 0, listStyle: "none" };

  return (
    <div style={card}>
      <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
        {waiting === 0 ? "Nothing waiting for review" : `${waiting} submission${waiting === 1 ? "" : "s"} waiting for review`}
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
        Open a submission to approve it, ask for changes, or reject it — the buttons sit at the top of the document.
        Suggested tags from the submitter appear there too.
      </p>
    </div>
  );
}

export default EditorDashboard;
