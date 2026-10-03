/**
 * The moderation vocabulary and workflows, with no dependencies (2026-09-20).
 *
 * Split out of payload/hooks/moderation.ts because the admin panel's client
 * component (payload/components/moderation-actions.tsx) imports the workflow
 * table, and the hook module also reaches — through its side effects — the
 * email sender, the content layer and `next/headers`. Turbopack pulled that
 * whole graph into the admin's client bundle and refused to compile /admin.
 * Everything here is data, types and pure functions; the hook re-exports it.
 */
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

export type Doc = Record<string, unknown>;

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
  /** Whether the sender is emailed the outcome: case studies, and since
   *  2026-10 event suggestions (events spec §3.4). */
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
    // Members hear the outcome of an event suggestion (events spec §3.4).
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

