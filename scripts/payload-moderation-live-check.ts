/**
 * Task 16 — drive the moderation workflows through the **real** dev Payload
 * database, not a mock.
 *
 *   pnpm exec tsx scripts/payload-moderation-live-check.ts
 *
 * `lib/__tests__/payload-moderation.test.ts` proves the transition table, the
 * gate, the patch bodies and `notifiedStatus`' duplicate suppression against an
 * in-memory fake. What a fake cannot show is that Payload actually dispatches
 * `afterChange`, that the `context` channel carries the hook's decision back,
 * that `draft: false` really publishes the in-flight draft, or that the
 * bookkeeping write lands in Postgres. That is what this does.
 *
 * ## What it writes, and what it will not
 *
 * It creates **two throwaway case studies of its own** and deletes them again.
 * It never mutates an imported row, and the guard in
 * `scripts/payload-import/lib/runtime.ts` refuses anything but the recorded dev
 * endpoint's `payload_cms`. It takes a full census before and after and fails
 * if a single count moved — in particular the 30 draft-latest documents, 21 of
 * which are the in-flight moderation drafts these workflows exist to act on.
 *
 * ## Email stays mocked, deliberately — and by two independent means
 *
 * The Resend sending domain is unverified: every recipient but one is rejected
 * with a 403, so "an email arrived" is not a usable signal and a real send would
 * be both unobservable and, for the one address that works, unwanted.
 *
 * 1. `RESEND_API_KEY` is deleted from the process environment **after Payload
 *    boots**, because booting it re-runs dotenv and puts the key back.
 * 2. The probe documents carry a `submittedBy` that matches no Prisma user, so
 *    the hook-driven passes are refused by the notifier itself, whatever the
 *    environment holds. The single pass that runs the notifier through to a
 *    message injects its own `sendEmail`, and an injected sender means
 *    `new Resend(...)` is never constructed.
 *
 * What is proved here is that the hook fires with the right arguments and that
 * the state moves.
 */
import { createHash, randomUUID } from "node:crypto";

import {
  applyModerationAction,
  MODERATION_WORKFLOWS,
  ModerationActionNotAvailableError,
  runModerationSideEffects,
  SKIP_MODERATION_SIDE_EFFECTS,
  type ModerationSideEffectResult,
} from "@/payload/hooks/moderation";
import {
  assertPayloadDatabase,
  describeDatabase,
  getPayloadInstance,
  loadEnv,
  type PayloadInstance,
} from "./payload-import/lib/runtime";

type Doc = Record<string, unknown>;

const failures: string[] = [];
let checks = 0;

function check(label: string, condition: boolean, detail?: unknown): void {
  checks += 1;
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    console.log(`  FAIL  ${label}${detail === undefined ? "" : ` — ${JSON.stringify(detail)}`}`);
    failures.push(label);
  }
}

function equal(label: string, actual: unknown, expected: unknown): void {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  check(label, same, same ? undefined : { actual, expected });
}

// ---------------------------------------------------------------------------
// Census
// ---------------------------------------------------------------------------

interface Census {
  counts: Record<string, number>;
  draftLatest: Record<string, number>;
  draftLatestTotal: number;
}

async function census(payload: PayloadInstance): Promise<Census> {
  const counts: Record<string, number> = {};
  for (const collection of payload.config.collections) {
    if (collection.slug.startsWith("payload-")) continue;
    const { totalDocs } = await payload.count({ collection: collection.slug as never });
    counts[collection.slug] = totalDocs;
  }

  const draftLatest: Record<string, number> = {};
  for (const collection of payload.config.collections) {
    if (!collection.versions || !(collection.versions as { drafts?: unknown }).drafts) continue;
    const { docs } = await payload.db.findVersions({
      collection: collection.slug,
      limit: 0,
      pagination: false,
      where: { and: [{ latest: { equals: true } }, { "version._status": { equals: "draft" } }] },
    });
    const parents = new Set(docs.map((row) => String((row as { parent: unknown }).parent)));
    if (parents.size > 0) draftLatest[collection.slug] = parents.size;
  }

  return {
    counts,
    draftLatest,
    draftLatestTotal: Object.values(draftLatest).reduce((total, n) => total + n, 0),
  };
}

// ---------------------------------------------------------------------------
// The probe documents
// ---------------------------------------------------------------------------

/**
 * The reviewer this script acts as.
 *
 * `applyModerationAction` writes with `overrideAccess: false` on purpose, so the
 * collection's own `update: isEditor` decides — and the first live run proved it
 * does, refusing the write with a 403 because no user was supplied. The `users`
 * collection is empty (Clerk is the identity system; a Payload user row is
 * minted on first admin sign-in), so there is no real row to borrow. This is the
 * shape `payload/auth/clerk-strategy.ts` puts on `req.user`, and `hasEditorRole`
 * reads nothing else off it.
 */
const REVIEWER = { id: "task16-live-check", role: "admin", collection: "users" } as const;

/** A Clerk-shaped id that matches no Prisma user, so the hook-driven passes can
 *  reach the notifier and be refused by it rather than by the environment. */
const NO_SUCH_SUBMITTER = "task16-live-check-no-such-user";

const RUN = createHash("sha256").update(randomUUID()).digest("hex").slice(0, 8);

function probeId(suffix: string): string {
  return `task16-moderation-probe-${RUN}-${suffix}`;
}

function lexical(text: string): Doc {
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      children: [
        {
          type: "paragraph",
          format: "",
          indent: 0,
          version: 1,
          direction: "ltr",
          children: [{ type: "text", detail: 0, format: 0, mode: "normal", style: "", text, version: 1 }],
        },
      ],
    },
  };
}

async function createProbe(payload: PayloadInstance, suffix: string, submittedBy: string | undefined) {
  const id = probeId(suffix);
  const context: Doc = {};
  await payload.create({
    collection: "caseStudies",
    locale: "en",
    draft: false,
    context,
    overrideAccess: true,
    data: {
      id,
      slug: id,
      title: `Task 16 probe ${suffix}`,
      content: lexical("Throwaway document created by scripts/payload-moderation-live-check.ts."),
      topic: "other",
      moderationStatus: "pending",
      submittedBy,
      // `draft: false` is not enough: `_status` defaults to "draft"
      // (payload/dist/versions/baseFields.js), so a probe created without this
      // would be invisible to the anonymous gate no matter what the moderation
      // workflow did — and the check below would blame the workflow.
      _status: "published",
    } as never,
  });
  return { id, context };
}

async function readProbe(payload: PayloadInstance, id: string, draft: boolean): Promise<Doc> {
  return (await payload.findByID({
    collection: "caseStudies",
    id,
    draft,
    depth: 0,
    locale: "en",
    overrideAccess: true,
  })) as unknown as Doc;
}

/**
 * Since 2026-09-16 the hook runs its side effects after the write's
 * transaction commits and leaves a PROMISE of the result on the context, so
 * this awaits it. `undefined` still means the hook never fired.
 */
async function hookResult(context: Doc): Promise<ModerationSideEffectResult | undefined> {
  const pending = context.moderationSideEffects as Promise<ModerationSideEffectResult> | undefined;
  return pending ? await pending : undefined;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  await loadEnv();
  console.log(`RESEND_API_KEY present after loadEnv: ${Boolean(process.env.RESEND_API_KEY)}`);

  const url = process.env.PAYLOAD_DATABASE_URL;
  assertPayloadDatabase(url, { action: "run the moderation live check" });
  console.log("target:", describeDatabase(url!), "\n");

  // Warm every module the hook imports lazily, BEFORE any write.
  //
  // The first live run died on `terminating connection due to idle-in-
  // transaction timeout`: Payload runs `afterChange` inside the write's
  // transaction, and the hook's `await import("@/lib/case-study-emails")` had
  // to be compiled by tsx from cold, which held that transaction open long
  // enough for Neon to kill the connection. A bundled production build does not
  // pay that cost, but it is a real property of putting slow work inside
  // `afterChange` and it is recorded in the task report rather than hidden
  // behind this warm-up.
  await Promise.all([import("@/lib/case-study-emails"), import("next/cache"), import("@/lib/prisma")]);

  const payload = await getPayloadInstance();

  /**
   * No mail can leave this process, by two independent means.
   *
   * 1. `RESEND_API_KEY` is deleted — **after** Payload boots, because booting it
   *    puts the key back: loading the config re-runs dotenv, so deleting the key
   *    first (as the first version of this script did) is undone before the
   *    first write. That was not theoretical; see the task report.
   * 2. The probe documents carry a `submittedBy` that matches no Prisma user, so
   *    the hook-driven passes stop at "submitter has no email on file" whatever
   *    the environment says. The one pass that goes all the way through the
   *    notifier injects its own `sendEmail`, and an injected sender means
   *    `new Resend(...)` is never constructed at all.
   */
  const keyWasBack = Boolean(process.env.RESEND_API_KEY);
  delete process.env.RESEND_API_KEY;
  console.log(
    `RESEND_API_KEY after the Payload boot: ${keyWasBack ? "present again (dotenv re-ran) and now removed" : "absent"}`,
  );

  // Anything a previous interrupted run left behind. The slug prefix is this
  // script's own and nothing else in the database uses it.
  const leftovers = await payload.find({
    collection: "caseStudies",
    draft: true,
    limit: 100,
    overrideAccess: true,
    where: { slug: { like: "task16-" } },
  });
  for (const doc of leftovers.docs) {
    await payload.delete({ collection: "caseStudies", id: String(doc.id), overrideAccess: true });
    console.log(`cleaned up a leftover probe: ${String(doc.id)}`);
  }

  console.log("== baseline census ==");
  const before = await census(payload);
  console.log(JSON.stringify(before, null, 1), "\n");

  // A real submitter id, read-only, used ONLY in the injected-sender pass —
  // where `new Resend(...)` cannot be constructed. The probe documents
  // themselves carry a submitter that resolves to nobody.
  const { prisma } = await import("@/lib/prisma");
  const submitter = await prisma.user.findFirst({ where: { email: { not: null } }, select: { id: true } });
  if (!submitter) console.log("no Prisma user with an email — the notifier pass will report that instead\n");

  const created: string[] = [];

  try {
    // -----------------------------------------------------------------------
    console.log("== A: pending -> revision -> pending -> approved ==");
    const a = await createProbe(payload, "a", NO_SUCH_SUBMITTER);
    created.push(a.id);

    const aHook = await hookResult(a.context);
    check("afterChange fired on create", aHook !== undefined, a.context);
    equal("create is a transition from nothing", aHook?.from, undefined);
    equal("create's status", aHook?.to, "pending");
    equal("pending is not notifiable", aHook?.email, "skipped: status not notifiable");
    check(
      "the blanket tag and the eight case-study paths were revalidated",
      aHook?.revalidated.length === 9,
      aHook?.revalidated,
    );

    const revisionContext: Doc = {};
    const revision = await applyModerationAction(payload, {
      collection: "caseStudies",
      id: a.id,
      action: "revision",
      reviewNotes: "Please add a methods section.",
      context: revisionContext,
      user: REVIEWER,
    });
    equal("revision transition", [revision.from, revision.to], ["pending", "revision"]);
    equal("revision did not publish", revision.published, false);
    const revisionHook = await hookResult(revisionContext);
    equal("afterChange saw the transition", revisionHook?.from, "pending");
    equal("afterChange saw the new status", revisionHook?.to, "revision");
    // The hook reached the notifier, which got past "notifiable", past
    // "already notified" and past "no submitter", and queried Prisma for the
    // submitter's address. Nothing could have been sent.
    equal(
      "the hook ran the notifier, which resolved no address and sent nothing",
      revisionHook?.email,
      "skipped: submitter has no email on file",
    );

    const afterRevisionDraft = await readProbe(payload, a.id, true);
    const afterRevisionPublished = await readProbe(payload, a.id, false);
    equal("the draft carries the revision", afterRevisionDraft.moderationStatus, "revision");
    equal("the reviewer's notes landed", afterRevisionDraft.reviewNotes, "Please add a methods section.");
    // The published row is untouched: a revision request must not push
    // unreviewed content live as a side effect of recording a decision.
    equal("the published row is untouched", afterRevisionPublished.moderationStatus, "pending");
    equal("and it is still published", afterRevisionPublished._status, "published");

    // The submitter resubmits. Not a moderation action — `submitCaseStudy`
    // does this, and on the Payload arm it is a published write.
    await payload.update({
      collection: "caseStudies",
      id: a.id,
      locale: "en",
      overrideAccess: true,
      data: { moderationStatus: "pending", title: "Task 16 probe a, revised" } as never,
    });
    const afterResubmit = await readProbe(payload, a.id, true);
    equal("resubmission returns it to pending", afterResubmit.moderationStatus, "pending");

    const approveContext: Doc = {};
    const approve = await applyModerationAction(payload, {
      collection: "caseStudies",
      id: a.id,
      action: "approve",
      context: approveContext,
      user: REVIEWER,
    });
    equal("approve transition", [approve.from, approve.to], ["pending", "approved"]);
    equal("approve publishes", approve.published, true);
    const approveHook = await hookResult(approveContext);
    equal("afterChange saw pending -> approved", [approveHook?.from, approveHook?.to], [
      "pending",
      "approved",
    ]);

    const approved = await readProbe(payload, a.id, false);
    equal("the published row is approved", approved.moderationStatus, "approved");
    equal("and published", approved._status, "published");
    check("publishedAt was stamped", typeof approved.publishedAt === "string", approved.publishedAt);
    check("reviewedAt was stamped", typeof approved.reviewedAt === "string", approved.reviewedAt);
    equal("the resubmitted title was published", approved.title, "Task 16 probe a, revised");

    // -----------------------------------------------------------------------
    console.log("\n== A: the gate refuses an action the stored status does not offer ==");
    let refused = false;
    try {
      await applyModerationAction(payload, {
        collection: "caseStudies",
        id: a.id,
        action: "revision",
        reviewNotes: "not allowed from approved",
        user: REVIEWER,
      });
    } catch (error) {
      refused = error instanceof ModerationActionNotAvailableError;
    }
    check("revision is refused on an approved case study", refused);
    const stillApproved = await readProbe(payload, a.id, false);
    equal("and nothing moved", stillApproved.moderationStatus, "approved");

    // -----------------------------------------------------------------------
    console.log("\n== A: the notifier, with the sender injected and the bookkeeping real ==");
    const { notifyCaseStudyStatusChange } = await import("@/lib/case-study-emails");
    const sent: { to: string; subject: string }[] = [];
    const markNotifiedCalls: string[] = [];

    const runNotifier = async (doc: Doc) =>
      runModerationSideEffects(
        { collection: "caseStudies", doc, previousDoc: { moderationStatus: "pending" }, operation: "update" },
        {
          notify: (input, deps) =>
            notifyCaseStudyStatusChange(input, {
              ...deps,
              sendEmail: async (message) => {
                sent.push({ to: message.to, subject: message.subject });
                return { id: "injected" };
              },
            }),
          markNotified: async (id, status) => {
            markNotifiedCalls.push(status);
            await payload.update({
              collection: "caseStudies",
              id,
              data: { notifiedStatus: status } as never,
              draft: MODERATION_WORKFLOWS.caseStudies.hasDrafts,
              overrideAccess: true,
              context: { [SKIP_MODERATION_SIDE_EFFECTS]: true },
            });
          },
          revalidate: () => {},
          siteUrl: "https://example.org",
        },
      );

    const first = await runNotifier({
      ...(await readProbe(payload, a.id, true)),
      // The one place a real address is used, and the sender is injected, so
      // `new Resend(...)` is never constructed.
      submittedBy: submitter?.id,
    });
    if (submitter) {
      check("a send was attempted", sent.length === 1, sent);
      check("to the submitter's own address", sent[0]?.to.includes("@") ?? false, sent[0]?.to);
      equal("with the approved subject", sent[0]?.subject, 'Your case study "Task 16 probe a, revised" has been published');
      equal("and the notifier reported a send", first.email.startsWith("sent: approved"), true);
      equal("notifiedStatus was written", markNotifiedCalls, ["approved"]);

      const bookkept = await readProbe(payload, a.id, true);
      equal("and it is in Postgres", bookkept.notifiedStatus, "approved");
      // Brake 3's other half: the bookkeeping write carries the skip flag, so
      // it did not re-enter the notifier.
      equal("the bookkeeping write stayed on the draft", (await readProbe(payload, a.id, false)).notifiedStatus, null);

      // Brake 2: the same terminal status a second time.
      const second = await runNotifier({
        ...(await readProbe(payload, a.id, true)),
        submittedBy: submitter?.id,
      });
      equal("a repeat is suppressed", second.email, "skipped: already notified for this status");
      check("and no second send was attempted", sent.length === 1, sent);
    } else {
      equal("no submitter on file, reported rather than sent", first.email, "skipped: submitter has no email on file");
    }

    // -----------------------------------------------------------------------
    console.log("\n== B: pending -> rejected ==");
    const b = await createProbe(payload, "b", NO_SUCH_SUBMITTER);
    created.push(b.id);

    const rejectContext: Doc = {};
    const reject = await applyModerationAction(payload, {
      collection: "caseStudies",
      id: b.id,
      action: "reject",
      reviewNotes: "Out of scope for this collection.",
      context: rejectContext,
      user: REVIEWER,
    });
    equal("reject transition", [reject.from, reject.to], ["pending", "rejected"]);
    equal("reject did not publish", reject.published, false);
    const rejectHook = await hookResult(rejectContext);
    equal("afterChange saw pending -> rejected", [rejectHook?.from, rejectHook?.to], [
      "pending",
      "rejected",
    ]);
    const rejectedDraft = await readProbe(payload, b.id, true);
    equal("the draft is rejected", rejectedDraft.moderationStatus, "rejected");
    equal("the reason landed", rejectedDraft.reviewNotes, "Out of scope for this collection.");

    // -----------------------------------------------------------------------
    console.log("\n== the anonymous gate, against the real rows ==");
    for (const [label, id] of [
      ["the approved probe", a.id],
      ["the rejected probe", b.id],
    ] as const) {
      const { totalDocs } = await payload.count({
        collection: "caseStudies",
        overrideAccess: false,
        where: { id: { equals: id } },
      });
      // `publishedAndApproved` with no user: published AND approved.
      const expected = id === a.id ? 1 : 0;
      equal(`${label} is ${expected === 1 ? "visible" : "hidden"} anonymously`, totalDocs, expected);
    }
  } finally {
    console.log("\n== cleanup ==");
    for (const id of created) {
      try {
        await payload.delete({ collection: "caseStudies", id, overrideAccess: true });
        console.log(`  deleted ${id}`);
      } catch (error) {
        console.log(`  FAILED to delete ${id}:`, error);
        failures.push(`cleanup ${id}`);
      }
    }
  }

  console.log("\n== census after cleanup ==");
  const after = await census(payload);
  equal("every collection count is back to baseline", after.counts, before.counts);
  equal("the draft-latest breakdown is back to baseline", after.draftLatest, before.draftLatest);
  equal("the draft-latest total is back to 30", after.draftLatestTotal, before.draftLatestTotal);
  console.log(JSON.stringify(after, null, 1));

  console.log(`\n${checks - failures.length}/${checks} checks passed.`);
  if (failures.length > 0) {
    console.log("FAILED:", failures.join(", "));
    process.exit(1);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
