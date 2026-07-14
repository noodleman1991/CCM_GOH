# Workspace Robustness Audit — collaboration + output editing failure modes

Date: 2026-07-14 · Method: code-level hazard inventory (data-loss > silent-failure > confusion). Feature presence was audited 2026-07-05; this audit is about what breaks, clobbers or lies.

## Architectural findings
- **No optimistic concurrency anywhere**: Prisma doc/plan writes have no updatedAt guard; every Sanity resubmit patch is bare `.set()` (no `ifRevisionId`). Everything is last-write-wins.
- **No user-facing versioning/recovery**: no doc revisions, no output history, no undo. Sanity `_rev` history is Studio-only.

## Data-loss
| # | Hazard | Where | Fix |
|---|---|---|---|
| D1 | Docs autosave shares ONE debounce timer across docs — switching docs inside 800ms drops doc A's edits | workspace-docs.tsx:34,63-67 | per-doc timer + flush on close |
| D2 | No unload/nav flush — last ≤800ms of typing lost | workspace-docs.tsx:64-67 | pagehide/route-change flush |
| D3 | Doc save = full-content overwrite, two editors clobber each other silently | docs.ts:47-58 | updatedAt-guarded update → conflict toast |
| D4 | Concurrent Continue-editing on same output: second resubmit silently replaces first | all 4 submit routes' patch | capture `_rev` on load → `.ifRevisionId()` → 409 message |
| D5 | Resubmit while editor reviews replaces the version under review | edit loaders gate on status only | review-lock status or ifRevisionId |
| D6 | deleteDoc/deleteStage/deleteTask are hard deletes, doc delete has NO confirm | docs.ts:60-65, plans.ts:73-78,198-203 | soft-delete + undo toast |
| D7 | Personal case-study draft survives edit mode and later resurrects over the form | case-study-form.tsx:202-218 | reconcile/clear draft on edit-mode entry |
| D8 | Upload-then-patch not transactional — orphaned Sanity assets on patch failure | research-outputs submit:116-183 et al | upload-after-validate + orphan GC |

## Silent-failure
| # | Hazard | Where | Fix |
|---|---|---|---|
| S1 | DB blip → getCollaboration null → notFound(): "your workspace doesn't exist" | service.ts:111-124, page.tsx:49-50 | distinguish failed from missing; error boundary |
| S2 | EVERY collab read degrades failure→empty ("No stages yet" incident class); getMembershipRole failure silently downgrades member to public view | service.ts throughout | discriminated results; explicit retry state; authz fail-closed-distinct |
| S3 | refreshOutputStatuses swallows Sanity errors — stale statuses render as truth | service.ts:184,268 | staleness indicator |
| S4 | Plan mutations that never revert on failure: rename stage/task, describe, moveStage, reorder (onAssign is the correct pattern) | workspace-plan.tsx | capture prev + revert |
| S5 | Concurrent reorders interleave to an order nobody chose; moveTask can duplicate order values | plans.ts:105-141 | plan version / order computed in txn |
| S6 | Workspace link-back failure = console.warn; submission "vanishes" from Outputs tab | all 4 submit routes | user-visible retry / reconciliation |
| S7 | InlineText keeps rejected text on screen (never awaits onCommit) | inline-text.tsx:48-53 | await commit, reset draft on failure |
| S8 | Draft autosave error doesn't retry or block navigation | case-study-form.tsx:276-282 | backoff retry + nav warning |

## Confusion
- C1 held-for-review comments don't appear for author → duplicate posts (comment-section.tsx:116-140)
- C2 thread archive has no undo · C3 output add/remove does location.reload() discarding unsaved edits elsewhere

## Fix-order
1. D3+D4+D5 optimistic concurrency (Prisma updatedAt guard; Sanity ifRevisionId) — kills the silent-clobber class
2. D1+D2 per-doc debounce + unload flush
3. S1+S2 discriminated read failures; empty ≠ failed; authz fail-closed
4. D6 soft-delete + undo
5. S4+S5+S7 revert-on-failure + concurrency-safe reorder + InlineText await
6. D8+S6+S3 orphan cleanup, link-back surfacing, staleness
7. D7+S8+C1-C3 draft reconciliation, retry, optimistic comments, undo affordances
+ Cross-cutting: minimal doc-revision snapshots would convert several data-loss items into recoverable ones.
