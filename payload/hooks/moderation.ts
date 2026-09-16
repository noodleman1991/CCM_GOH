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

// ---------------------------------------------------------------------------
// The vocabulary
// ---------------------------------------------------------------------------

export const MODERATION_STATUSES = ["pending", "rejected", "revision", "approved"] as const;
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export const MODERATION_ACTIONS = ["approve", "revision", "reject"] as const;
export type ModerationAction = (typeof MODERATION_ACTIONS)[number];

export const MODERATED_COLLECTIONS = ["caseStudies", "events", "livedExperiences", "researchOutputs"] as const;
export type ModeratedCollection = (typeof MODERATED_COLLECTIONS)[number];

export function isModerationStatus(value: unknown): value is ModerationStatus {
  return typeof value === "string" && (MODERATION_STATUSES as readonly string[]).includes(value);
}

export function isModerationAction(value: unknown): value is ModerationAction {
  return typeof value === "string" && (MODERATION_ACTIONS as readonly string[]).includes(value);
}

export function isModeratedCollection(value: unknown): value is ModeratedCollection {
  return typeof value === "string" && (MODERATED_COLLECTIONS as readonly string[]).includes(value);
}

type Doc = Record<string, unknown>;

/**
 * The Payload `context` flag the bookkeeping write carries.
 *
 * `notifiedStatus` is persisted with `payload.update`, which re-enters this
 * collection's `afterChange`. Three independent brakes stop that from looping,
 * and this is the cheapest and the most explicit of them; see
 * `runModerationSideEffects` for the other two.
 */
export const SKIP_MODERATION_SIDE_EFFECTS = "skipModerationSideEffects";

/** Mirrors `CONTENT_CACHE_TAG` in `lib/content/internal/payload-source.ts`.
 *  Duplicated as a literal rather than imported: this module is loaded by
 *  `payload.config.ts`, and importing the content seam here would drag the
 *  whole of `lib/content/` into every config load, including the migration
 *  CLI's. The tests assert the two stay equal. */


// ---------------------------------------------------------------------------
// The transition table — ported verbatim from sanity/actions/*
// ---------------------------------------------------------------------------

export interface ModerationActionSpec {
  /** The Studio action's own label, kept so the admin reads the same. */
  label: string;
  /** The status this action writes. */
  writes: ModerationStatus;
  /**
   * The action is offered only in these states. This is Studio's
   * `visibleWhenStatus`, copied per workflow rather than unified — the four
   * files genuinely disagree, and flattening them would silently widen two
   * workflows and narrow two others.
   */
  visibleWhen: readonly ModerationStatus[];
  /** Studio collected this from a `window.prompt` and abandoned the patch when
   *  the reviewer cancelled. Here it is a required argument instead. */
  requiresNotes: boolean;
  /** Studio additionally guarded these with a `window.confirm`. */
  requiresConfirmation: boolean;
}

export interface ModerationWorkflow {
  collection: ModeratedCollection;
  /** `versions.drafts` on the collection. Decides the `draft` argument — see
   *  the header. Asserted against the real config by the tests. */
  hasDrafts: boolean;
  /** Only `caseStudies` notifies its submitter today. The webhook route emails
   *  for `_type === 'caseStudy'` and for nothing else; that is preserved rather
   *  than widened, because widening it would start sending mail to three
   *  populations who have never received any. */
  notifies: boolean;
  actions: Record<ModerationAction, ModerationActionSpec>;
  /**
   * The extra fields an action stamps beside `moderationStatus`. Every key is a
   * literal here; only `reviewNotes`' value comes from the reviewer.
   */
  stamp: (action: ModerationAction, doc: Doc, now: string, reviewNotes?: string) => Doc;
  /** The paths the Sanity webhook revalidated for this document type. */
  paths: (doc: Doc) => string[];
}

const LOCALES = ["en", "es", "fr", "ar"] as const;

function existingOrNow(value: unknown, now: string): string {
  return typeof value === "string" && value.length > 0 ? value : now;
}

export const MODERATION_WORKFLOWS: Record<ModeratedCollection, ModerationWorkflow> = {
  // sanity/actions/case-study-actions.ts
  caseStudies: {
    collection: "caseStudies",
    hasDrafts: true,
    notifies: true,
    actions: {
      approve: {
        label: "Approve & Publish",
        writes: "approved",
        visibleWhen: ["pending", "revision"],
        requiresNotes: false,
        requiresConfirmation: false,
      },
      revision: {
        label: "Request Revision",
        writes: "revision",
        visibleWhen: ["pending"],
        requiresNotes: true,
        requiresConfirmation: false,
      },
      reject: {
        label: "Reject",
        writes: "rejected",
        visibleWhen: ["pending", "revision"],
        requiresNotes: true,
        requiresConfirmation: true,
      },
    },
    // Approve keeps an existing publishedAt (re-approval after a revision must
    // not restamp the original publication date) and always sets reviewedAt.
    stamp: (action, doc, now, reviewNotes) =>
      action === "approve"
        ? { publishedAt: existingOrNow(doc.publishedAt, now), reviewedAt: now }
        : { reviewNotes, reviewedAt: now },
    paths: (doc) => {
      const slug = typeof doc.slug === "string" ? doc.slug : undefined;
      return LOCALES.flatMap((locale) => {
        const base = `/${locale}/research-and-action/case-studies`;
        return slug ? [base, `${base}/${slug}`] : [base];
      });
    },
  },

  // sanity/actions/event-actions.ts — revision and reject are also offered on
  // an approved event, so an editor can pull a live one back or remove it.
  events: {
    collection: "events",
    hasDrafts: false,
    notifies: false,
    actions: {
      approve: {
        label: "Approve & Publish",
        writes: "approved",
        visibleWhen: ["pending", "revision"],
        requiresNotes: false,
        requiresConfirmation: false,
      },
      revision: {
        label: "Request Revision",
        writes: "revision",
        visibleWhen: ["pending", "approved"],
        requiresNotes: true,
        requiresConfirmation: false,
      },
      reject: {
        label: "Reject / Remove",
        writes: "rejected",
        visibleWhen: ["pending", "revision", "approved"],
        requiresNotes: true,
        requiresConfirmation: true,
      },
    },
    // The event action stamps no dates at all — `{ status: 'approved' }` and
    // `{ status, reviewNotes }` are the whole patch in Studio.
    stamp: (action, _doc, _now, reviewNotes) => (action === "approve" ? {} : { reviewNotes }),
    paths: () => [],
  },

  // sanity/actions/lived-experience-actions.ts
  livedExperiences: {
    collection: "livedExperiences",
    hasDrafts: true,
    notifies: false,
    actions: {
      approve: {
        label: "Approve & Publish",
        writes: "approved",
        visibleWhen: ["pending", "revision"],
        requiresNotes: false,
        requiresConfirmation: false,
      },
      revision: {
        label: "Request Revision",
        writes: "revision",
        visibleWhen: ["pending"],
        requiresNotes: true,
        requiresConfirmation: false,
      },
      reject: {
        label: "Reject",
        writes: "rejected",
        visibleWhen: ["pending", "revision"],
        requiresNotes: true,
        requiresConfirmation: true,
      },
    },
    stamp: (action, doc, now, reviewNotes) =>
      action === "approve" ? { publishedAt: existingOrNow(doc.publishedAt, now) } : { reviewNotes },
    paths: () => [],
  },

  // sanity/actions/research-output-actions.ts — `publishDate`, not
  // `publishedAt`; the two collections genuinely name it differently.
  researchOutputs: {
    collection: "researchOutputs",
    hasDrafts: false,
    notifies: false,
    actions: {
      approve: {
        label: "Approve & Publish",
        writes: "approved",
        visibleWhen: ["pending", "revision"],
        requiresNotes: false,
        requiresConfirmation: false,
      },
      revision: {
        label: "Request Revision",
        writes: "revision",
        visibleWhen: ["pending", "approved"],
        requiresNotes: true,
        requiresConfirmation: false,
      },
      reject: {
        label: "Reject / Remove",
        writes: "rejected",
        visibleWhen: ["pending", "revision", "approved"],
        requiresNotes: true,
        requiresConfirmation: true,
      },
    },
    stamp: (action, doc, now, reviewNotes) =>
      action === "approve" ? { publishDate: existingOrNow(doc.publishDate, now) } : { reviewNotes },
    paths: () => [],
  },
};

/**
 * Which buttons an editor is offered on a document in this state.
 *
 * Studio's gate is `visibleWhenStatus.includes(doc?.status)`, and an **unset**
 * status matches nothing — so a document with no `moderationStatus` gets no
 * actions. That is preserved deliberately, and it has a live consequence worth
 * naming: `livedExperiences.moderationStatus` is 0/56 populated, so every real
 * lived experience currently offers no moderation actions in Studio either.
 * Inventing a default here would be a behaviour change dressed as a port.
 */
export function availableModerationActions(
  collection: ModeratedCollection,
  status: unknown,
): ModerationAction[] {
  if (!isModerationStatus(status)) return [];
  const workflow = MODERATION_WORKFLOWS[collection];
  return MODERATION_ACTIONS.filter((action) => workflow.actions[action].visibleWhen.includes(status));
}

/**
 * The header's safety argument, as an assertion rather than a comment: a
 * takedown (`revision`/`reject`) from `approved` may only be offered by a
 * workflow whose write reaches the public copy — i.e. one without drafts.
 * Returns the offending pairs so a test can name them.
 */
export function takedownsThatWouldNotReachThePublicCopy(): string[] {
  const offenders: string[] = [];
  for (const collection of MODERATED_COLLECTIONS) {
    const workflow = MODERATION_WORKFLOWS[collection];
    if (!workflow.hasDrafts) continue;
    for (const action of ["revision", "reject"] as const) {
      if (workflow.actions[action].visibleWhen.includes("approved")) {
        offenders.push(`${collection}.${action}`);
      }
    }
  }
  return offenders;
}

// ---------------------------------------------------------------------------
// Applying an action
// ---------------------------------------------------------------------------

export class ModerationActionNotAvailableError extends Error {
  constructor(
    readonly collection: ModeratedCollection,
    readonly action: ModerationAction,
    readonly status: unknown,
  ) {
    super(
      `"${action}" is not available on a ${collection} document whose moderationStatus is ${JSON.stringify(status)}`,
    );
    this.name = "ModerationActionNotAvailableError";
  }
}

export class ModerationNotesRequiredError extends Error {
  constructor(readonly action: ModerationAction) {
    super(`"${action}" requires reviewer notes`);
    this.name = "ModerationNotesRequiredError";
  }
}

/**
 * The subset of Payload's Local API this needs, declared structurally so the
 * tests can drive a fake and the real `BasePayload` still satisfies it.
 *
 * Written with method shorthand, not function-typed properties, and
 * deliberately: under `strictFunctionTypes` a property's parameters are checked
 * contravariantly, and Payload's own `findByID` — which requires a `collection`
 * and an `id` — cannot accept an arbitrary record. Method shorthand is checked
 * bivariantly, which is what lets the real client be passed without a cast.
 * The arguments below are the exact ones this file sends.
 */
export interface ModerationFindArgs {
  collection: ModeratedCollection;
  id: string;
  draft: boolean;
  depth: number;
  locale: "en";
  overrideAccess: boolean;
}

export interface ModerationUpdateArgs {
  collection: ModeratedCollection;
  id: string;
  data: Doc;
  locale: "en";
  draft: boolean;
  user?: unknown;
  overrideAccess: boolean;
  /** Payload's own hook-coordination channel, passed straight through. The
   *  admin never sets it; the live-database check does, because it is how a
   *  caller observes what `afterChange` decided. */
  context?: Record<string, unknown>;
}

export interface ModerationClient {
  findByID(args: ModerationFindArgs): Promise<unknown>;
  update(args: ModerationUpdateArgs): Promise<unknown>;
}

export interface ApplyModerationActionInput {
  collection: ModeratedCollection;
  id: string;
  action: ModerationAction;
  /** Only used by actions whose spec sets `requiresNotes`. */
  reviewNotes?: string;
  /** The signed-in Payload user. Passed straight through so the collection's
   *  own `update: isEditor` decides, rather than a second copy of that rule. */
  user?: unknown;
  now?: Date;
  /** Payload's hook-coordination context, forwarded to the write. */
  context?: Record<string, unknown>;
}

export interface ModerationActionResult {
  id: string;
  collection: ModeratedCollection;
  from: ModerationStatus;
  to: ModerationStatus;
  /** Whether this write published the document. */
  published: boolean;
}

/**
 * Run one moderation action against one document.
 *
 * The current status is read from the **persisted** document, never taken from
 * the caller: the gate has to run against what is stored, exactly as Studio's
 * gate ran against the document it had open. The read is `draft: true` on a
 * drafts-enabled collection because the thing under review *is* the in-flight
 * draft — 21 of the 30 draft-latest documents in the dev database are precisely
 * that. This is a decision about which version to act on, not the retention
 * decision from Task 15, where a drafts-visible read would have been the wrong
 * primitive.
 */
export async function applyModerationAction(
  payload: ModerationClient,
  input: ApplyModerationActionInput,
): Promise<ModerationActionResult> {
  const { collection, id, action } = input;
  const workflow = MODERATION_WORKFLOWS[collection];
  if (!workflow) throw new Error(`Unknown moderated collection: ${String(collection)}`);
  const spec = workflow.actions[action];
  if (!spec) throw new Error(`Unknown moderation action: ${String(action)}`);

  const reviewNotes = input.reviewNotes?.trim();
  if (spec.requiresNotes && !reviewNotes) throw new ModerationNotesRequiredError(action);

  const current = (await payload.findByID({
    collection,
    id,
    // The document under review. On `events`/`researchOutputs` there are no
    // versions, so this is simply the row.
    draft: workflow.hasDrafts,
    depth: 0,
    // `en` so the notification hook downstream sees the English title the
    // Sanity webhook projected (`"title": title.en`), whatever locale the
    // reviewer's admin happens to be in.
    locale: "en",
    overrideAccess: true,
  })) as Doc | null;

  const from = current?.moderationStatus;
  if (!isModerationStatus(from) || !spec.visibleWhen.includes(from)) {
    throw new ModerationActionNotAvailableError(collection, action, from);
  }

  const now = (input.now ?? new Date()).toISOString();
  // See the header: publish on approve, leave the published copy alone
  // otherwise. On a collection without drafts both branches are the same
  // direct write.
  const published = action === "approve";

  // Every key below is a literal in this file. Payload drops an unknown data
  // key silently, so a caller-supplied field name would look like a successful
  // write that changed nothing.
  const data: Doc = {
    moderationStatus: spec.writes,
    ...workflow.stamp(action, current ?? {}, now, reviewNotes),
    // `draft: false` alone does NOT publish, and the live check is what proved
    // it: `payload/dist/versions/baseFields.js` gives `_status` a
    // `defaultValue: 'draft'`, and `collections/operations/utilities/update.js`
    // only ever *forces* `_status: 'draft'` (when saving a draft) — it never
    // sets `'published'`. The admin's own Publish button carries
    // `_status: 'published'` in its request body, and so must this. Without it
    // an approved case study stayed `_status: 'draft'` and
    // `publishedAndApproved` kept it invisible: the approval succeeded and
    // nothing reached the site.
    ...(published && workflow.hasDrafts ? { _status: "published" } : {}),
  };
  await payload.update({
    collection,
    id,
    data,
    locale: "en",
    draft: workflow.hasDrafts && !published,
    user: input.user,
    overrideAccess: false,
    context: input.context,
  });

  return { id, collection, from, to: spec.writes, published };
}

// ---------------------------------------------------------------------------
// The side effects the Sanity webhook used to perform
// ---------------------------------------------------------------------------

export interface ModerationChange {
  collection: ModeratedCollection;
  doc: Doc;
  previousDoc: Doc | undefined;
  operation: "create" | "update";
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
        const { notifyCaseStudyStatusChange } = await import("@/lib/case-study-emails");
        return notifyCaseStudyStatusChange(input, notifyDeps);
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
