# P1 Collab Infrastructure Implementation Plan (Conversation.kind + project channels + doc comments groundwork)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add conversation typing (DIRECT/PROJECT/COMMUNITY) with lazily-provisioned project channels, and extend the comment engine to `collaborationDoc` targets — the schema groundwork for the grouped inbox (P3) and doc threads (P2).

**Architecture:** One Prisma migration adds `ConversationKind` + optional `collaborationId`/`communityId` to `Conversation` (existing rows default `DIRECT`). A service function lazily creates/returns a workspace's `PROJECT` conversation; `ConversationSummary` grows `kind` + `title`. The comment action's collaboration-authz branch and target validators learn `collaborationDoc`, reusing `collab:comment`.

**Tech Stack:** Prisma/Postgres, Next.js server actions, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-02-atlas-people-content-collab-design.md` (Track F1, Track E2 v1 groundwork).

## Global Constraints

- NEVER run `sanity typegen generate` (breaks committed types — project gotcha).
- NEVER include Claude/AI attribution in commit messages (CLAUDE.md).
- Tests run with `npx vitest run <file>`; the whole suite must stay green (355+ tests).
- After schema changes run `npx prisma generate` (types) — migrations via `npx prisma migrate dev --name <name>`.
- All privacy/authz decisions server-side; no client-received hidden fields.

---

### Task 1: `ConversationKind` schema migration

**Files:**
- Modify: `prisma/schema.prisma` (Conversation model, ~line 623)
- Test: `lib/__tests__/conversation-kind.test.ts`

**Interfaces:**
- Produces: `ConversationKind` enum (`DIRECT | PROJECT | COMMUNITY`), `Conversation.kind` (default `DIRECT`), `Conversation.collaborationId String?`, `Conversation.communityId String?`, relations + indexes. Task 2 consumes all of these.

- [ ] **Step 1: Write the failing test** (type-level guard that the generated client has the new fields)

```ts
// lib/__tests__/conversation-kind.test.ts
import { describe, it, expect } from "vitest";
import { ConversationKind } from "@/generated/prisma";

describe("ConversationKind", () => {
  it("exposes the three kinds", () => {
    expect(ConversationKind.DIRECT).toBe("DIRECT");
    expect(ConversationKind.PROJECT).toBe("PROJECT");
    expect(ConversationKind.COMMUNITY).toBe("COMMUNITY");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/conversation-kind.test.ts`
Expected: FAIL — `ConversationKind` is not exported.

- [ ] **Step 3: Edit the schema**

In `prisma/schema.prisma`, above `model Conversation` add:

```prisma
enum ConversationKind {
  DIRECT
  PROJECT
  COMMUNITY
}
```

Replace the `Conversation` model with:

```prisma
model Conversation {
  id              String                    @id @default(cuid())
  kind            ConversationKind          @default(DIRECT)
  // Set when kind=PROJECT / kind=COMMUNITY; the channel's home.
  collaborationId String?
  collaboration   Collaboration?            @relation(fields: [collaborationId], references: [id], onDelete: Cascade)
  communityId     String?
  community       Community?                @relation(fields: [communityId], references: [id], onDelete: Cascade)
  createdAt       DateTime                  @default(now())
  lastMessageAt   DateTime                  @default(now())
  participants    ConversationParticipant[]
  messages        Message[]

  @@unique([kind, collaborationId])
  @@index([lastMessageAt])
}
```

Add the back-relations: on `model Collaboration` add `conversations Conversation[]`; on `model Community` add `conversations Conversation[]`.

Note: `@@unique([kind, collaborationId])` gives us "one PROJECT channel per workspace" for free (nulls don't collide in Postgres).

- [ ] **Step 4: Migrate + generate, run test**

Run: `npx prisma migrate dev --name conversation-kind && npx prisma generate`
Run: `npx vitest run lib/__tests__/conversation-kind.test.ts`
Expected: PASS. Existing rows carry `kind=DIRECT` via the default — no data migration needed.

- [ ] **Step 5: Full suite + commit**

Run: `npx vitest run` → all pass.

```bash
git add prisma lib/__tests__/conversation-kind.test.ts
git commit -m "feat(messaging): ConversationKind enum + project/community channel fields"
```

---

### Task 2: Lazy project channel + kind-aware conversation summaries

**Files:**
- Modify: `lib/messaging/service.ts` (ConversationSummary + listConversations, lines 4–50)
- Modify: `lib/actions/messaging.ts` (new action at end of file)
- Test: `lib/__tests__/project-channel.test.ts`

**Interfaces:**
- Consumes: Task 1's `ConversationKind`, `Conversation.kind/collaborationId`.
- Produces:
  - `getOrCreateProjectConversation(collaborationId: string, userId: string): Promise<{ id: string } | null>` in `lib/messaging/service.ts` — null when the user is not a workspace member.
  - `startProjectConversation(collaborationId: string): Promise<Result<{ id: string }>>` server action in `lib/actions/messaging.ts` (the "Message team" button target; P3 wires the UI).
  - `ConversationSummary` gains `kind: "DIRECT" | "PROJECT" | "COMMUNITY"` and `title: string | null` (project title for channels; `otherName` stays for DMs).

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/project-channel.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = {
  collaborationMember: { findUnique: vi.fn() },
  collaboration: { findUnique: vi.fn() },
  conversation: { findUnique: vi.fn(), create: vi.fn() },
  conversationParticipant: { createMany: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
  safeQuery: async (fn: () => Promise<unknown>) => {
    try { return { success: true, data: await fn() }; }
    catch (e) { return { success: false, error: e }; }
  },
}));

import { getOrCreateProjectConversation } from "@/lib/messaging/service";

describe("getOrCreateProjectConversation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null for non-members", async () => {
    prismaMock.collaborationMember.findUnique.mockResolvedValue(null);
    expect(await getOrCreateProjectConversation("c1", "u1")).toBeNull();
    expect(prismaMock.conversation.create).not.toHaveBeenCalled();
  });

  it("returns the existing channel without creating", async () => {
    prismaMock.collaborationMember.findUnique.mockResolvedValue({ role: "EDITOR" });
    prismaMock.conversation.findUnique.mockResolvedValue({ id: "conv1" });
    expect(await getOrCreateProjectConversation("c1", "u1")).toEqual({ id: "conv1" });
    expect(prismaMock.conversation.create).not.toHaveBeenCalled();
  });

  it("creates the channel with all current members as participants", async () => {
    prismaMock.collaborationMember.findUnique.mockResolvedValue({ role: "OWNER" });
    prismaMock.conversation.findUnique.mockResolvedValue(null);
    prismaMock.collaboration.findUnique.mockResolvedValue({
      members: [{ userId: "u1" }, { userId: "u2" }],
    });
    prismaMock.conversation.create.mockResolvedValue({ id: "conv2" });
    expect(await getOrCreateProjectConversation("c1", "u1")).toEqual({ id: "conv2" });
    const createArg = prismaMock.conversation.create.mock.calls[0][0];
    expect(createArg.data.kind).toBe("PROJECT");
    expect(createArg.data.collaborationId).toBe("c1");
    expect(createArg.data.participants.createMany.data).toEqual([
      { userId: "u1" }, { userId: "u2" },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/project-channel.test.ts`
Expected: FAIL — `getOrCreateProjectConversation` is not exported.

- [ ] **Step 3: Implement the service function + summary extension**

In `lib/messaging/service.ts`, extend the summary type (replace the existing `ConversationSummary`):

```ts
export type ConversationSummary = {
  id: string;
  kind: "DIRECT" | "PROJECT" | "COMMUNITY";
  /** Channel title (project/community name); null for DMs (use otherName). */
  title: string | null;
  otherName: string | null;
  otherImage: string | null;
  otherUsername: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unread: boolean;
};
```

In `listConversations`, add `kind: true`-style data by including the collaboration title. Change the `include` to add:

```ts
        collaboration: { select: { title: true } },
```

and the mapped return object to add:

```ts
      kind: c.kind,
      title: c.kind === "PROJECT" ? (c.collaboration?.title ?? null) : null,
```

(`community` title resolution lands with the community-discussion track; `COMMUNITY` rows don't exist yet.)

Append the new function:

```ts
/**
 * The workspace's single PROJECT channel, created lazily on first use
 * ("no empty rooms" — spec F1). Member-gated; all current members join.
 */
export async function getOrCreateProjectConversation(
  collaborationId: string,
  userId: string
): Promise<{ id: string } | null> {
  const membership = await prisma.collaborationMember.findUnique({
    where: { collaborationId_userId: { collaborationId, userId } },
    select: { role: true },
  });
  if (!membership) return null;

  const existing = await prisma.conversation.findUnique({
    where: { kind_collaborationId: { kind: "PROJECT", collaborationId } },
    select: { id: true },
  });
  if (existing) return existing;

  const collab = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    select: { members: { select: { userId: true } } },
  });
  if (!collab) return null;

  const created = await prisma.conversation.create({
    data: {
      kind: "PROJECT",
      collaborationId,
      participants: { createMany: { data: collab.members.map((m) => ({ userId: m.userId })) } },
    },
    select: { id: true },
  });
  return created;
}
```

Note: if the generated composite-unique accessor name differs (check `generated/prisma` after Task 1 — it is derived from `@@unique([kind, collaborationId])` as `kind_collaborationId`), use the generated name.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/project-channel.test.ts`
Expected: PASS (3/3).

- [ ] **Step 5: Add the server action**

Append to `lib/actions/messaging.ts` (it already imports `getActor`-style auth — mirror `startConversation` at line 15 for the auth pattern used in this file):

```ts
/** "Message team" — opens (lazily creating) the workspace's project channel. */
export async function startProjectConversation(
  collaborationId: string
): Promise<Result<{ id: string }>> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to send messages." };
  const conv = await getOrCreateProjectConversation(collaborationId, userId);
  if (!conv) return { ok: false, error: "Only workspace members can message the team." };
  return { ok: true, data: conv };
}
```

Import `getOrCreateProjectConversation` from `@/lib/messaging/service` at the top. Use the same current-user helper the file already uses (see `startConversation` — reuse its exact auth call rather than inventing one).

- [ ] **Step 6: Typecheck + full suite + commit**

Run: `npx tsc --noEmit && npx vitest run`
Expected: clean, all pass.

```bash
git add lib/messaging/service.ts lib/actions/messaging.ts lib/__tests__/project-channel.test.ts
git commit -m "feat(messaging): lazy project channels + kind-aware conversation summaries"
```

---

### Task 3: `collaborationDoc` comment target

**Files:**
- Modify: `prisma/schema.prisma` (`CommentTargetType` enum, ~line 320)
- Modify: `lib/actions/comments.ts` (authz branch ~line 134; plus `collaborationIdForTarget` and `isCommentTargetValid` — locate both with grep, they live in `lib/actions/comments.ts` or `lib/comments/*`)
- Test: `lib/__tests__/comment-doc-target.test.ts`

**Interfaces:**
- Consumes: existing `authorizeCollab(collaborationId, "collab:comment")`, `CollaborationDoc` model.
- Produces: comments accepted with `targetType: "collaborationDoc"`, membership-gated exactly like `collaborationFile`. P2's doc-thread UI mounts `CommentSection` with this target.

- [ ] **Step 1: Add the enum value + migrate**

In `prisma/schema.prisma`:

```prisma
enum CommentTargetType {
  caseStudy
  newsPost
  livedExperience
  researchOutput
  collaborationThread
  collaborationFile
  collaborationDoc
}
```

Run: `npx prisma migrate dev --name comment-doc-target && npx prisma generate`

- [ ] **Step 2: Write the failing test**

First locate the two helpers: `grep -n "collaborationIdForTarget\|isCommentTargetValid" lib/actions/comments.ts lib/comments/*.ts`. The test targets `collaborationIdForTarget` (adjust the import path to where grep finds it):

```ts
// lib/__tests__/comment-doc-target.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = {
  collaborationThread: { findUnique: vi.fn() },
  collaborationFile: { findUnique: vi.fn() },
  collaborationDoc: { findUnique: vi.fn() },
};
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock, safeQuery: async (fn: any) => ({ success: true, data: await fn() }) }));

import { collaborationIdForTarget } from "@/lib/actions/comments"; // adjust to grep result

describe("collaborationIdForTarget(collaborationDoc)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("resolves the doc's collaboration id", async () => {
    prismaMock.collaborationDoc.findUnique.mockResolvedValue({ collaborationId: "c9" });
    expect(await collaborationIdForTarget("collaborationDoc", "d1")).toBe("c9");
  });

  it("returns null for a missing doc", async () => {
    prismaMock.collaborationDoc.findUnique.mockResolvedValue(null);
    expect(await collaborationIdForTarget("collaborationDoc", "nope")).toBeNull();
  });
});
```

(If `collaborationIdForTarget` is not exported, export it — it's a pure lookup, safe to expose for tests.)

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/comment-doc-target.test.ts`
Expected: FAIL — the doc branch doesn't exist (returns null/throws for `collaborationDoc`).

- [ ] **Step 4: Implement**

In the file grep found, extend `collaborationIdForTarget` with a doc branch mirroring the file branch:

```ts
  if (targetType === "collaborationDoc") {
    const doc = await prisma.collaborationDoc.findUnique({
      where: { id: targetId },
      select: { collaborationId: true },
    });
    return doc?.collaborationId ?? null;
  }
```

Extend `isCommentTargetValid` the same way (existence check on `collaborationDoc`). In `lib/actions/comments.ts` change the authz condition (~line 134) to:

```ts
  if (
    data.targetType === "collaborationThread" ||
    data.targetType === "collaborationFile" ||
    data.targetType === "collaborationDoc"
  ) {
```

Also grep for the zod enum of target types in the same file (`z.enum([...targetTypes])` or similar) and add `"collaborationDoc"`; and check `lib/comments/` for any read-path visibility switch on `targetType` (the list endpoint must gate doc comments to members exactly as it gates `collaborationFile` — mirror that branch).

- [ ] **Step 5: Run test + full suite**

Run: `npx vitest run lib/__tests__/comment-doc-target.test.ts && npx vitest run`
Expected: PASS; suite green.

- [ ] **Step 6: Commit**

```bash
git add prisma lib
git commit -m "feat(comments): collaborationDoc target (membership-gated, groundwork for doc threads)"
```

---

## Self-review notes

- Spec F1 coverage: enum ✓, relations ✓, lazy provisioning ✓, DIRECT backfill via column default ✓ (no group→PROJECT matching exists to migrate — spec accepts this).
- Spec E2 groundwork: enum value + authz + validity + read-gating ✓ (UI is P2).
- `COMMUNITY` rows intentionally have no creator yet — lands with community-discussion.
- Verify the generated composite-unique accessor name in Task 2 Step 3 before assuming `kind_collaborationId`.
