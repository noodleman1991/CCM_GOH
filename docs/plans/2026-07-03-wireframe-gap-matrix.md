# Wireframe Gap Matrix — signed-in audit vs design_handoff_ccm_hub

Date: 2026-07-03 evening · Auditor: Claude (signed-in walkthrough as amit2@pm.me on localhost:3000, dev DB + staging Sanity)
Method: every claim below was either SEEN TODAY in the running app, carries a prior rendered-evidence marker, or is explicitly marked unverified. Nothing is graded from code or ledgers alone.

Legend: ✅ works · 🟡 partial/thin vs spec · 🔴 broken or missing · ⚠️ user action needed · ⬜ not yet audited

## Verified today (signed in)

| Screen (spec §) | Grade | What I saw |
|---|---|---|
| Home §4.1 | ✅/🟡 | Hero CTAs, submit-story banner, news, events, region map all render (en+ar RTL). Gaps: LE carousel shows empty state (no approved LE in dev data); several seed images 404 on Sanity CDN; "Explore by region" heading is EN in the AR locale (CMS doc content is single-language). |
| Dashboard §4.3 | 🟡 | Welcome + profile-% + quick-action cards ONLY. Spec wants the personal pipeline: drafts, my tasks, submissions status. `myTasks` action exists with no UI (known follow-on since Phase 5). |
| Collab space §4.6 | 🔴 | **Biggest gap.** Spec: tabs Projects · People · Events, project cards w/ status + open-call + "View project / Open workspace", Connect/Message on people. Built: a People directory only. No project discovery ANYWHERE public, no Events tab (events page exists separately at /collaborate/events, empty on dev data, not linked as a tab), no Connect/Message buttons. |
| Workspace §4.8 | 🟡 | Substantially built (Overview/Outputs/Plan/Docs/Threads/Files/Media/Members — richer than spec's 3 tabs). **Broken inside:** output cards are UNCLICKABLE (click = nothing) and show "Untitled" (multilingual title not resolved). Files upload fails at browser PUT — R2 bucket has NO CORS policy (⚠️ user: Cloudflare dashboard). |
| Content editor §4.9 | 🟡 | E3 shell is real and matches the archetype-chooser spec (Story/Feature/Report cards w/ captions, language pills, big title, cover drop zone, slash menu opens/filters/inserts). Missing vs spec: right settings rail (pipeline status, connections, reviewers), template-reflow preview, and the chart block is a bare data form — no caption/source/units, no CSV paste, no size/placement (image block got placement; chart didn't), no editorial framing. Timeline/mermaid nodes unaudited. |
| Case studies browse §4.11 | 🔴 | The locked 2026-06-22 decision (single Gallery + Gallery‖Map toggle + region/theme chips + Feature/Quote/Wide/Standard masonry) was NEVER built. Still per-region grouping w/ giant feature card + visibly empty side slots, and dropdown filters. Cards DO open detail (public list is clickable — the dead cards are the workspace outputs). |
| Case-study detail §4.12 | 🟡 | Story layout renders and reads. Editorial quality is poor on real content: inline images MISSING while their captions render as italic body text ("(Photo courtesy of AKU team)"), quotes are plain italics not pull-quotes, references are an unstyled run-on wall, no comments section seen after "Written by" (verify — spec requires public thread + composer). Feature/Report archetypes exist (Phase 6, prior evidence) but content rarely uses them. |
| Messages §4.16/4.19 | ✅ | Inbox renders, Messages‖Notifications tabs work. startConversation crashed on a MISSING DB COLUMN — root-caused and fixed today (dev DB was 2 migrations behind; `migrate resolve` + .env/.env.local split-brain). Needs one retry to confirm end-to-end. |
| Events §4.6-Events | 🟡 | Page + submit exist (Phase 5.4, previously validated); empty on dev data; not integrated into a collab-space tab. |

## Prior rendered evidence, not re-checked today
- Atlas §4.10 — E1 validated this morning (thumbnail cards, tooltip, region=all row; screenshots in .superpowers/sdd/e1-*).
- News §4.14 — E6 validated with screenshots (lead story, Global pill, detail polish).
- Regional community §4.13, Project public §4.7 — validated during P1 (project-public had a full live check incl. authz).
- Search §4.18 — wiring validated but ⚠️ NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY is invalid → all searches return nothing until the user rotates the key.

## Not yet audited (remaining pass)
⬜ Sign-up/onboarding §4.2 · ⬜ Public profile §4.4 · ⬜ Account settings §4.5 · ⬜ LE detail w/ video + submit video step §4.15/E2 (blocked partly by no published video LE) · ⬜ Thread §4.17 · ⬜ E8 timeline/mermaid authoring + published render · ⬜ mobile 375px + full AR pass of all authed screens.

## ⚠️ User actions (nothing I can do)
1. R2 bucket `ccm-collab` CORS policy (Cloudflare dashboard) — blocks ALL workspace file upload.
2. Rotate the Algolia search-only key — blocks ALL search results.
3. Publish/approve some dev content: ≥1 video lived-experience, ≥1 event, tag themes — half the "missing" UI is actually empty-state on unseeded data.

## Proposed rebuild priorities (Phase B — for user approval, mocks before code)
1. **Collab space §4.6** — Projects/People/Events tabs + project discovery cards (status, open-call, View project/Open workspace). The public entry to the whole collaboration system is missing.
2. **Case-studies browse §4.11** — execute the already-locked gallery+map rebuild.
3. **Editorial reading experience §4.12** — inline images render w/ proper figure+caption treatment, pull-quotes, styled references, figure/chart as first-class editorial objects (caption/source/units/size/placement), comments section verified on all content types.
4. **Workspace outputs** — cards clickable (open the editor for drafts / detail for published), resolve real titles, proper type labels.
5. **Editor completion §4.9** — right rail (pipeline status, connections, reviewers), chart usability (CSV paste, caption/source, placement), output typing.
6. **Dashboard §4.3** — personal pipeline (drafts, my tasks, submission statuses).

Definition of done for every slice above: driven signed-in against seeded dev data, screenshot/recording attached, user eyeballs it at the checkpoint. No ledger-only completes.
