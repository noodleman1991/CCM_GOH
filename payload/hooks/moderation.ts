/**
 * The four Studio moderation workflows, moved into Payload.
 *
 * ---------------------------------------------------------------------------
 * What is being replaced, and it is two systems, not one
 * ---------------------------------------------------------------------------
 *
 * `sanity/actions/{case-study,event,lived-experience,research-output}-actions.ts`
 * are React `DocumentActionComponent`s. Each one gates itself on the document's
 * current `status`, builds a patch (possibly `null`, when the reviewer cancels
 * the `window.prompt`), and commits it with the Studio user's own client. **They
 * send no email.** Email is a second, asynchronous system: the patch triggers a
 * Sanity webhook, `app/api/webhooks/sanity/route.ts` re-reads the document, and
 * `lib/case-study-emails.ts` decides whether to notify.
 *
 * This file replaces both halves:
 *
 *   - `MODERATION_WORKFLOWS` is the transition table, ported field-for-field
 *     from those four files. `applyModerationAction` is the patch+commit half,
 *     and `payload/components/moderation-actions.tsx` is the button half.
 *   - `moderationAfterChange` is the webhook half — cache revalidation and the
 *     submitter email — running **in-process, in the same request that made
 *     the change, once its transaction has committed** (see "After the
 *     commit, not inside it" below), rather than arriving later over the
 *     network, best-effort, and only if Sanity's delivery succeeded.
 *
 * `sanity/actions/**` and the webhook route are deliberately left in place and
 * working. Phase 4 deletes them.
 *
 * ---------------------------------------------------------------------------
 * `moderationStatus`, never `status`
 * ---------------------------------------------------------------------------
 *
 * Payload stores the editorial review state as `moderationStatus`. A field
 * literally named `status` on a drafts-enabled collection collides with
 * Payload's own `_status` at the Postgres enum level and fails `payload
 * migrate`. Every field name written by this file is a literal in this file —
 * never a key forwarded from a caller — because Payload drops an unknown data
 * key **silently**: a write with a wrong field name succeeds, changes nothing,
 * and looks exactly like a write that worked.
 *
 * ---------------------------------------------------------------------------
 * Why `approve` publishes and `revision`/`reject` do not
 * ---------------------------------------------------------------------------
 *
 * Sanity models a draft as a second document (`drafts.<id>`); Payload models it
 * as a version of one id. Read from `payload/dist/collections/operations/`:
 * `updateByID` resolves its base document with `getLatestCollectionVersion`
 * **unconditionally**, so an update always merges onto the draft-latest when
 * one exists; the `draft` argument then only decides whether the result is
 * saved as another draft version or as the published row
 * (`utilities/update.js`: `isSavingDraft` forces `_status: 'draft'`).
 *
 * So on a drafts-enabled collection:
 *
 *   - `draft: false` publishes the in-flight draft's content together with the
 *     patch. That is exactly what "Approve & Publish" means, and it is the only
 *     way an approval reaches the public site at all — the anonymous gate is
 *     `_status: published` AND `moderationStatus: approved`, so stamping
 *     `approved` onto a draft alone would leave the public copy untouched and
 *     the approval invisible.
 *   - `draft: true` leaves the published row alone. That is what a rejection or
 *     a revision request must do: neither may push unreviewed draft content
 *     live as a side effect of recording a decision.
 *
 * That is only safe because **no drafts-enabled workflow offers `revision` or
 * `reject` from `approved`** — a live document can never be taken down by a
 * write that lands on a draft nobody reads. `events` and `researchOutputs` do
 * offer both from `approved`, and neither enables `versions.drafts`, so their
 * writes are direct and take effect immediately.
 * `takedownsThatWouldNotReachThePublicCopy()` pins that invariant so widening
 * the table later fails a test instead of quietly breaking a takedown.
 */
import type { CollectionAfterChangeHook } from "payload";

import { flushDeferred, runAfterCommit, withTimeout } from "@/payload/hooks/after-commit";
import {
  type Doc,
  MODERATION_WORKFLOWS,
  ModeratedCollection,
  SKIP_MODERATION_SIDE_EFFECTS,
  takedownsThatWouldNotReachThePublicCopy,
} from "@/payload/moderation/workflows";
export * from "@/payload/moderation/workflows";

// ---------------------------------------------------------------------------
// The vocabulary
// ---------------------------------------------------------------------------
// The side effects the Sanity webhook used to perform
// ---------------------------------------------------------------------------

export interface ModerationChange {
  collection: ModeratedCollection;
  doc: Doc;
  previousDoc: Doc | undefined;
  operation: "create" | "update";
  /** The moderator (`req.user.id`, a Clerk id); undefined for a script or import. */
  actorId?: string;
}

/** What the analytics event about a moderation transition may carry. Closed on
 *  purpose: ids and statuses, never the title or the reviewer's notes. */
export interface ModerationAnalyticsEvent {
  collection: ModeratedCollection;
  docId: string;
  from: string | null;
  to: string;
  moderatorId: string | null;
  submitterId: string | null;
}

export interface ModerationNotifyInput {
  caseStudyId: string;
  status: string;
  notifiedStatus?: string;
  submittedBy?: string;
  title?: string;
  reviewNotes?: string;
  locale?: string;
  siteUrl: string;
}

export interface ModerationSideEffectDeps {
  /** `lib/case-study-emails.ts`'s notifier, injected so a test can assert the
   *  attempt and its arguments. Delivery is not a usable signal: the Resend
   *  domain is unverified and every address but one 403s. */
  notify: (input: ModerationNotifyInput, deps: { markNotified: (id: string, status: string) => Promise<void> }) => Promise<string>;
  /** Persist `notifiedStatus`. Payload-local by construction — never the
   *  `CONTENT_BACKEND`-following seam, or a Payload-side approval would write
   *  its bookkeeping into Sanity. */
  markNotified: (id: string, status: string) => Promise<void>;
  revalidate: (targets: { tags: string[]; paths: string[] }) => void | Promise<void>;
  /** `submission_moderated` (Slice 11). Optional: scripts and the parity
   *  harness run the hook without analytics. Failures are reported through
   *  `onError` and never reach the write. */
  analytics?: (event: ModerationAnalyticsEvent) => Promise<void>;
  /** In-hub notifications on a real status change. Optional: scripts run without it. */
  inHub?: (change: ModerationChange) => Promise<void>;
  siteUrl?: string;
  onError?: (message: string, error: unknown) => void;
  /**
   * A ceiling on the notification step. Default 10s; `0` disables it.
   *
   * Not defensive decoration — this was **observed**. When this hook still ran
   * inside the write's Postgres transaction, the notifier's outbound HTTPS call
   * to Resend hung in `scripts/payload-moderation-live-check.ts` (no outbound
   * network), the transaction stayed open behind it, and Neon killed the
   * connection with `25P03 idle-in-transaction` after five minutes — taking
   * the write down with it. The side effects now run after the commit (see
   * `moderationAfterChange`), so a hung transport can no longer touch the
   * write; the ceiling stays because it can still pin a Vercel invocation,
   * which `after()` keeps alive until the work settles.
   *
   * The email is best-effort by design (the whole `notify` call is already
   * inside a `try`, so a failure cannot roll back an editorial decision that has
   * been made). A ceiling makes "best-effort" true of a *hung* transport too.
   */
  notifyTimeoutMs?: number;
}

const DEFAULT_NOTIFY_TIMEOUT_MS = 10_000;

/** The funnel step a target status means, for `submission_moderated.action`. */
export function moderationAction(to: string): "approve" | "revision" | "reject" | "other" {
  if (to === "approved" || to === "published") return "approve";
  if (to === "revision" || to === "needs_revision" || to === "changes_requested") return "revision";
  if (to === "rejected") return "reject";
  return "other";
}

export interface ModerationSideEffectResult {
  transitioned: boolean;
  from?: string;
  to?: string;
  revalidated: string[];
  /** The notifier's own one-line result, or a reason this never reached it. */
  email: string;
}

/** The webhook projected `title.en`; a Payload `afterChange` doc carries either
 *  the string for the request locale or, under `locale: "all"`, the whole
 *  object. Both are answered, so a reviewer working in Arabic does not silently
 *  change which title the submitter is emailed. */
function englishTitle(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const en = (value as Record<string, unknown>).en;
    if (typeof en === "string") return en;
  }
  return undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * Everything the webhook route did, minus the network.
 *
 * **Path revalidation is unconditional**, matching the route: it fired on
 * every delivery regardless of what changed, and only `caseStudy` has paths.
 * The blanket cache TAG the route also pushed is no longer fired from here:
 * `payload/hooks/revalidate-content.ts` fires the blanket and per-collection
 * tags after commit on every content write, this one included, and firing it
 * twice evicted the whole site twice per approval. **The email is
 * transition-gated**, and this is where `notifiedStatus`' duplicate
 * suppression is preserved — see the three brakes below.
 */
export async function runModerationSideEffects(
  change: ModerationChange,
  deps: ModerationSideEffectDeps,
): Promise<ModerationSideEffectResult> {
  const workflow = MODERATION_WORKFLOWS[change.collection];
  const tags: string[] = [];
  const paths = workflow.paths(change.doc);

  try {
    await deps.revalidate({ tags, paths });
  } catch (error) {
    // The webhook wrapped each revalidation in its own try/catch and carried
    // on; a cache tag that cannot be pushed must not fail the editorial write
    // that already succeeded.
    deps.onError?.("moderation revalidation failed", error);
  }

  const to = change.doc.moderationStatus;
  // On `create` Payload passes `previousDoc: {}` (verified in
  // payload/dist/collections/operations/create.js), so "there was no previous
  // status" is expressed by reading nothing rather than by inventing one.
  const from = change.operation === "create" ? undefined : change.previousDoc?.moderationStatus;
  const result: ModerationSideEffectResult = {
    transitioned: from !== to,
    from: asString(from),
    to: asString(to),
    revalidated: [...tags, ...paths],
    email: "skipped: collection does not notify",
  };

  // The analytics event fires for every moderated collection on a real
  // transition, whether or not the collection notifies by email.
  if (result.transitioned && deps.analytics) {
    try {
      await deps.analytics({
        collection: change.collection,
        docId: asString(change.doc.id) ?? "",
        from: result.from ?? null,
        to: result.to ?? "",
        moderatorId: change.actorId ?? null,
        submitterId: asString(change.doc.submittedBy) ?? null,
      });
    } catch (error) {
      deps.onError?.("moderation analytics failed", error);
    }
  }

  // In-hub notifications (opening-collaboration spec C6): the sender hears the
  // outcome — every moderated kind, email or not — and a newly approved event
  // reaches its region's followers. Failures never reach the write.
  if (result.transitioned && deps.inHub) {
    try {
      await deps.inHub(change);
    } catch (error) {
      deps.onError?.("moderation in-hub notification failed", error);
    }
  }

  if (!workflow.notifies) return result;

  // Brake 1 — the transition gate. The bookkeeping write below changes
  // `notifiedStatus` and nothing else, so it re-enters this hook with an
  // unchanged `moderationStatus` and stops here.
  if (!result.transitioned) {
    result.email = "skipped: moderationStatus unchanged";
    return result;
  }

  const id = asString(change.doc.id);
  if (!id) {
    result.email = "skipped: document has no id";
    return result;
  }

  try {
    // Brake 2 — `notifiedStatus` itself, passed through unchanged. The notifier
    // returns "skipped: already notified for this status" when it equals the
    // incoming status, exactly as it did for a redelivered webhook. It is no
    // longer the only brake, but it is still the one that survives a hook that
    // fires twice for reasons this file does not control.
    result.email = await withTimeout(
      deps.notify(
        {
          caseStudyId: id,
          status: String(to ?? ""),
          notifiedStatus: asString(change.doc.notifiedStatus),
          submittedBy: asString(change.doc.submittedBy),
          title: englishTitle(change.doc.title),
          reviewNotes: asString(change.doc.reviewNotes),
          // The webhook read `coalesce(submitterLocale, "en")`;
          // `submitterLocale` exists in neither schema and is referenced
          // nowhere else in the repository, so that coalesce has always
          // produced "en".
          locale: "en",
          siteUrl: deps.siteUrl ?? "https://hub.connectingclimateminds.org",
        },
        { markNotified: deps.markNotified },
      ),
      deps.notifyTimeoutMs ?? DEFAULT_NOTIFY_TIMEOUT_MS,
      "the moderation notification",
    );
  } catch (error) {
    deps.onError?.("moderation notification failed", error);
    result.email = "error";
  }

  return result;
}

/**
 * The collection hook. One per moderated collection.
 *
 * ---------------------------------------------------------------------------
 * After the commit, not inside it
 * ---------------------------------------------------------------------------
 *
 * Payload runs `afterChange` BEFORE `commitTransaction`
 * (`payload/dist/collections/operations/updateByID.js`). Until 2026-09-16 this
 * hook awaited `runModerationSideEffects` right here, which meant three things
 * happened inside the editor's open transaction: the Resend call (up to the
 * 10s ceiling); the `notifiedStatus` bookkeeping write — a second Local API
 * update with no `req`, so a second transaction on a second connection that
 * had to wait on the first's row lock while the first waited on it, every
 * approval paying the full ceiling; and `revalidateTag`, early enough that a
 * concurrent request could refill the cache with the pre-commit row. The
 * email also went out before the commit, so a rollback would still have
 * notified.
 *
 * Now the hook decides nothing and awaits nothing. It hands the whole run to
 * `payload/hooks/after-commit.ts` — `after()` inside a request, detached
 * outside one — and returns `doc`. The three brakes are unchanged, and
 * `runModerationSideEffects` is unchanged; only *when* it runs moved.
 *
 * `req.context.moderationSideEffects` is therefore a **promise** of the result
 * rather than the result. Payload hands the Local API caller's own `context`
 * object straight through (`utilities/createLocalReq.js`), so a caller —
 * notably `scripts/payload-moderation-live-check.ts` — awaits it after its
 * `payload.update` resolves to see what the hook actually did.
 *
 * Everything heavy is imported dynamically, inside the deferred run:
 * `next/cache` is a request-scoped API, and `lib/case-study-emails.ts` pulls
 * in Resend, Prisma and the whole content layer. `payload.config.ts` is loaded
 * by `payload migrate`, by `tsx` import scripts and by the Next build, none of
 * which should pay for either. `overrides` exist for the hook's own tests.
 */
export function moderationAfterChange(
  collection: ModeratedCollection,
  overrides: Partial<ModerationSideEffectDeps> = {},
): CollectionAfterChangeHook {
  return async ({ doc, previousDoc, req, operation }) => {
    // Brake 3 — the explicit context flag on the bookkeeping write. Cheapest
    // and most direct of the three; the other two hold even if a future caller
    // forgets it.
    if (req?.context?.[SKIP_MODERATION_SIDE_EFFECTS]) return doc;
    if (operation !== "create" && operation !== "update") return doc;

    const payload = req?.payload;
    const deps: ModerationSideEffectDeps = {
      notify: async (input, notifyDeps) => {
        const { notifySubmissionStatusChange } = await import("@/lib/case-study-emails");
        return notifySubmissionStatusChange({ ...input, kind: collection === "events" ? "event" : "caseStudy" }, notifyDeps);
      },
      markNotified: async (id, status) => {
        if (!payload) return;
        // Runs after the trigger's transaction committed, so this is an
        // ordinary write on its own connection with nothing to wait on.
        await payload.update({
          collection,
          id,
          data: { notifiedStatus: status } as never,
          // Brake 3's other half.
          context: { [SKIP_MODERATION_SIDE_EFFECTS]: true },
          overrideAccess: true,
          // Bookkeeping only — it must never publish an in-flight draft as a
          // side effect of recording that an email went out.
          draft: MODERATION_WORKFLOWS[collection].hasDrafts,
        });
      },
      revalidate: async ({ tags, paths }) => {
        const { revalidatePath, revalidateTag } = await import("next/cache");
        for (const tag of tags) revalidateTag(tag, "max");
        for (const path of paths) revalidatePath(path);
      },
      analytics: async (event) => {
        const { captureServer } = await import("@/lib/analytics/server");
        await withTimeout(
          captureServer({
            event: "submission_moderated",
            distinctId: event.moderatorId,
            properties: {
              kind: event.collection,
              from: event.from,
              to: event.to,
              action: moderationAction(event.to),
              doc_id: event.docId,
              submitter_id: event.submitterId,
            },
          }),
          3_000,
          "the analytics capture",
        );
      },
      inHub: async ({ collection: kindCollection, doc: changed }) => {
        const { notifyOutcomeInHub, notifyRegionFollowers } = await import("@/lib/notifications/outcomes");
        const KIND = { caseStudies: "caseStudy", livedExperiences: "livedExperience", researchOutputs: "researchOutput", events: "event" } as const;
        const raw = changed as Record<string, unknown>;
        const titleArm = raw.title && typeof raw.title === "object" ? (raw.title as Record<string, unknown>).en : raw.title;
        const title = typeof titleArm === "string" ? titleArm : "";
        const status = asString(raw.moderationStatus) ?? "";
        await notifyOutcomeInHub({ kind: KIND[kindCollection], submittedBy: asString(raw.submittedBy) ?? null, title, status });
        if (kindCollection === "events" && status === "approved" && payload) {
          // relatedCommunity is an id at depth 0; its slug is what region follows store.
          const related = raw.relatedCommunity;
          const relatedId = related && typeof related === "object" ? asString((related as Record<string, unknown>).id) : asString(related);
          const community = relatedId
            ? ((await payload.findByID({ collection: "regionalCommunities", id: relatedId, depth: 0, overrideAccess: true }).catch(() => null)) as { slug?: unknown } | null)
            : null;
          await notifyRegionFollowers({ communitySlug: asString(community?.slug) ?? null, eventSlug: asString(raw.slug) ?? "", eventTitle: title });
        }
      },
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || undefined,
      onError: (message, error) => {
        console.error(`[moderation:${collection}] ${message}:`, error);
      },
      ...overrides,
    };

    const change: ModerationChange = {
      collection,
      doc: doc as Doc,
      previousDoc: previousDoc as Doc | undefined,
      operation,
      actorId: asString((req as { user?: { id?: unknown } } | undefined)?.user?.id),
    };

    let settle!: (result: ModerationSideEffectResult) => void;
    const outcome = new Promise<ModerationSideEffectResult>((resolve) => {
      settle = resolve;
    });
    runAfterCommit(async () => {
      try {
        settle(await runModerationSideEffects(change, deps));
      } catch (error) {
        // runModerationSideEffects catches its own failures; this is the
        // backstop so `outcome` can never hang a caller that awaits it.
        deps.onError?.("moderation side effects failed", error);
        settle({ transitioned: false, revalidated: [], email: "error" });
      }
    });

    if (req?.context) req.context.moderationSideEffects = outcome;

    return doc;
  };
}

/** For tests and scripts: await every moderation side effect scheduled so far. */
export const flushModerationSideEffects = flushDeferred;
