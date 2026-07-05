# Workspace Functional Audit — every interaction, not every screen

Date: 2026-07-05 · Method: code-level inventory of every server action vs. its UI, then browser verification of the ambiguous rows. This is the "how to properly audit gaps" answer: the unit of audit is the **interaction** (can a member actually do X end-to-end), not the screen.

Legend: ✅ works end-to-end · 🟡 action exists, no/partial UI · 🔴 missing entirely · 🔵 notified (emits to the spine)

## Plan (stages & tasks)
| Interaction | Action | UI | Verdict |
|---|---|---|---|
| Add stage | `addStage` | input row | ✅ |
| **Rename stage** | `renameStage` | **none** | 🟡 → FIXED this audit (inline edit) |
| Delete stage | `deleteStage` | ✕ button | ✅ |
| Reorder stages | `reorderStages` | **none** | 🟡 (queued) |
| Add task | `addTask` | input row | ✅ |
| **Edit task title** | **none** | none | 🔴 → FIXED this audit (`renameTask` + inline edit) |
| Cycle task status | `cycleTaskStatus` | click task | ✅ |
| Reorder tasks (drag) | `reorderTasks` | dnd-kit | ✅ (within stage; cross-stage = move) |
| Move task between stages | `moveTask` | drag | ✅ |
| Assign task | `assignTask` | member picker | ✅ 🔵 TASK_ASSIGNED |
| Delete task | `deleteTask` | button | ✅ |
| Task due dates / reminders | none | none | 🔴 (design decision: deliberately deferred in mock I) |
| **@mention in a task** | none | none | 🔴 — mentions live only in the Comment engine; tasks are plain strings. Design: task DESCRIPTION field with mentions, or task-attached comments. Queued as a designed slice, not a quick patch. |

## Outputs
| Interaction | Verdict |
|---|---|
| Add output → real submit flow (caseStudy/LE/event) with link-back | ✅ (G1b/X6) |
| Add researchOutput | 🟡 draft-only path (no public submit flow exists) |
| Live title/slug on cards; published cards link out | ✅ (G1a) |
| **Edit pending caseStudy** ("Continue editing") | ✅ (X7) |
| **Edit pending LE / event / researchOutput** | 🔴 — X7 built the pattern for caseStudy only; extending needs per-type edit loaders + form prefill. Queued (X7 tail). |
| Remove output | ✅ |
| Output status change → team notified | ✅ 🔵 OUTPUT_STATUS |

## Docs / Threads / Files / Media
| Interaction | Verdict |
|---|---|
| Docs: create · rename · autosave PT content · delete · read-only for viewers | ✅ (W3/W5) |
| Threads: create · rename · comment (members) | ✅ 🔵 THREAD_REPLY |
| Thread delete/archive | 🔴 (no action) |
| Files: presign upload → confirm → list → PDF annotate | 🟡 — code complete; **blocked by the missing R2 bucket CORS (user action)** |
| Media: paste-URL add · list | ✅ |

## Members & lifecycle
| Interaction | Verdict |
|---|---|
| Join request → accept/decline (notified both ways) | ✅ 🔵 REQUEST + MEMBER_JOINED |
| Change member role | ✅ (`setMemberRole`, members tab) |
| Leave workspace | ✅ |
| **Invite someone directly** (outbound) | 🔴 — only inbound join requests exist. Wireframe §4.8 shows "+invite". Queued. |
| Remove a member (by lead) | 🔴 (no action; role change only) |
| Archive workspace | ✅ (`archiveCollaboration`) |
| Edit title/description inline | ✅ (W1) |

## Notifications coverage (the spine, X3)
Task assigned ✅ · output status ✅ · thread reply ✅ · member joined ✅ · follower publish ✅ · event reminder ✅ (cron) · comment reply/mention (comments only) ✅ · **task mentions 🔴 (no task text to mention in)** · RSVP receipt 🔴 (queued).

## Fix order (user-named first)
1. ✅ Stage rename (this audit)
2. ✅ Task title edit (this audit)
3. Edit pending LE/event/researchOutput (X7 tail — next slice)
4. Task descriptions with @mentions → mention notifications (designed slice)
5. Outbound invites + remove member
6. Reorder stages UI · thread archive · RSVP receipt · organiser RSVP list
