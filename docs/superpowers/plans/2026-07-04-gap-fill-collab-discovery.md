# Gap-Fill Part 1: Workspace Outputs + Collab Space + Cases Gallery

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Checkbox steps.

**Goal:** Close the three highest-priority gaps from `docs/plans/2026-07-03-wireframe-gap-matrix.md`: dead/Untitled workspace output cards (G1), the missing Projects/Events tabs on /collaborate (§4.6, G2), and the never-executed case-studies gallery rebuild (§4.11, G3).

**Architecture:** G1 enriches outputs with live Sanity title+slug at page render (no schema change) and replaces orphan-doc creation with links into the real submit flows that auto-link back to the workspace. G2 restructures /collaborate into URL-driven tabs (Projects · People · Events) reusing the existing People client, a new public-projects Prisma query, and the existing events fetch. G3 replaces the per-region case-studies grouping with one masonry gallery + Gallery‖Map toggle sharing filter state.

**Tech Stack:** Next 16 App Router, Prisma (dev branch lucky-waterfall), Sanity GROQ, next-intl (4 locales), shadcn/Tailwind with ccm tokens.

## Global Constraints
- NEVER `sanity typegen generate`. No AI attribution in commits.
- New i18n keys get REAL en/es/fr/ar translations. RTL-safe, ≥44px targets, `<bdi>` on user text.
- Prisma CLI must be run with the `.env.local` DATABASE_URL explicitly (`.env` points at PROD). No `migrate resolve`. No schema changes in this plan.
- Gates per task: `npx tsc --noEmit` · `npx vitest run` · signed-in rendered validation (screenshot) — a task is NOT done on green gates alone.
- Definition of done: driven in the browser signed-in with evidence saved to `.superpowers/sdd/`.

---

### Task G1a: Enrich workspace outputs with live title + slug

**Files:**
- Modify: `lib/collaboration/service.ts` (getOutputs — enrich from Sanity)
- Modify: `components/collaboration/workspace-outputs.tsx` (Output type + links)
- Modify: `app/[locale]/(main)/collaborations/[id]/page.tsx` (no change if getOutputs signature stable)
- Test: `lib/__tests__/collaboration-outputs.test.ts` (new — href/status mapping already covered? extend)

**Interfaces:**
- Produces: `getOutputs(collaborationId)` now returns `{ id, sanityId, sanityType, title, status, slug: string | null }[]`.
- Consumes: `outputDetailHref(type, slug)` from `lib/collaboration/outputs.ts` (exists).

- [ ] **Step 1: failing test** for the pure merge helper. Add to `lib/collaboration/outputs.ts` a pure `mergeOutputDocs(rows, docs)` that merges Sanity `{_id,title,status,slug}` docs onto DB rows by sanityId (drafts.-prefix tolerant), preferring live title/status, defaulting slug null:

```ts
// lib/__tests__/collaboration-outputs.test.ts
import { describe, it, expect } from "vitest";
import { mergeOutputDocs } from "@/lib/collaboration/outputs";

describe("mergeOutputDocs", () => {
  const row = { id: "r1", sanityId: "abc", sanityType: "caseStudy", title: "Untitled", status: "pending" };
  it("prefers live Sanity title/status and carries slug", () => {
    const merged = mergeOutputDocs([row], [{ _id: "drafts.abc", title: "Real title", status: "approved", slug: "real-title" }]);
    expect(merged[0]).toMatchObject({ title: "Real title", status: "approved", slug: "real-title" });
  });
  it("falls back to cached row when doc missing", () => {
    const merged = mergeOutputDocs([row], []);
    expect(merged[0]).toMatchObject({ title: "Untitled", status: "pending", slug: null });
  });
});
```

- [ ] **Step 2:** run `npx vitest run lib/__tests__/collaboration-outputs.test.ts` → FAIL (mergeOutputDocs not exported).
- [ ] **Step 3:** implement `mergeOutputDocs` in `lib/collaboration/outputs.ts`:

```ts
export type OutputRow = { id: string; sanityId: string; sanityType: string; title: string; status: string };
export type OutputDoc = { _id: string; title?: string; status?: string; slug?: string | null };
export type EnrichedOutput = OutputRow & { slug: string | null };

export function mergeOutputDocs(rows: OutputRow[], docs: OutputDoc[]): EnrichedOutput[] {
  const norm = (id: string) => id.replace(/^drafts\./, "");
  const byId = new Map(docs.map((d) => [norm(d._id), d]));
  return rows.map((row) => {
    const d = byId.get(norm(row.sanityId));
    return {
      ...row,
      title: d?.title || row.title,
      status: d?.status ? mapSanityStatus(d.status) : row.status,
      slug: d?.slug ?? null,
    };
  });
}
```

- [ ] **Step 4:** vitest PASS. In `lib/collaboration/service.ts` `getOutputs`, after the Prisma read, fetch docs in ONE GROQ (`*[_id in $ids || ("drafts."+_id) in $ids]{_id,"title":coalesce(title.en,title),status,"slug":slug.current}`) inside try/catch (Sanity down → cached values), return `mergeOutputDocs(rows, docs)`.
- [ ] **Step 5:** `workspace-outputs.tsx`: Output type gains `slug: string | null`. Card becomes a `next-intl` Link when `status==="approved" && slug` → `outputDetailHref(o.sanityType, o.slug)`; otherwise a plain card with a localized status hint line `t("pendingHint")` ("Will link here once published" — es "Se enlazará aquí cuando se publique" · fr "Le lien apparaîtra ici après publication" · ar "سيظهر الرابط هنا بعد النشر"). Wrap `{o.title}` in `<bdi>`.
- [ ] **Step 6:** gates (tsc, vitest) · commit `fix(workspace): outputs resolve live title+slug; approved cards link to the published page`.

### Task G1b: Stop creating orphan outputs — route creation through the real submit flows

**Files:**
- Modify: `components/collaboration/workspace-outputs.tsx` (create → navigate)
- Modify: `app/api/case-studies/submit/route.ts` (accept `collaborationId`, auto-link)
- Modify: `components/forms/case-study-form.tsx` + `case-study-submission-layout.tsx` (carry `?workspace=` through to submit payload)
- Modify: `app/[locale]/(main)/research-and-action/case-studies/submit/page.tsx` (read searchParam, pass down)
- Test: extend `lib/__tests__/` only if pure logic extracted; otherwise gates + rendered validation.

**Interfaces:**
- Consumes: `addOutput({collaborationId, sanityType, mode:"link", sanityId, title})` (exists, authz inside).
- Produces: submit API accepts optional `collaborationId: string` in its JSON/multipart fields; on successful Sanity create it calls `addOutput` with mode "link" (failure to link is non-fatal — log, don't fail the submission).

- [ ] **Step 1:** In `workspace-outputs.tsx`, replace the `create(sanityType)` transition for `caseStudy` with `router.push(\`/research-and-action/case-studies/submit?workspace=${collaborationId}\`)`; for `livedExperience` → `/lived-experiences/submit?workspace=…`; keep `researchOutput` on the existing create-draft path (no public submit flow yet) — label its button `t("createDraft")`. Delete the `mode:"create"` orphan path for the two types with real flows.
- [ ] **Step 2:** submit page reads `searchParams.workspace`, passes `workspaceId` prop → layout → form; form includes it in the submit POST body.
- [ ] **Step 3:** in `app/api/case-studies/submit/route.ts` after the doc create: `if (collaborationId) { const r = await addOutput({collaborationId, sanityType:"caseStudy", mode:"link", sanityId: createdId, title: titleEn}); if (!r.ok) console.warn("workspace link failed", r.error); }` (authz enforced by addOutput itself).
- [ ] **Step 4:** same param on the LE submit route (`/api/lived-experiences/submit`).
- [ ] **Step 5:** gates · rendered validation: from the workspace click "+ Add an output → Case study" → land on the editor with workspace param; submit a test case study → back in workspace, the output appears with its real title, pending badge; screenshot to `.superpowers/sdd/g1-workspace-outputs.png`. Commit `feat(workspace): output creation goes through the real submit flows and auto-links back`.

### Task G2a: getPublicProjects query + ProjectCard

**Files:**
- Create: `lib/collaboration/public-list.ts`
- Create: `components/collaborate/project-card.tsx`
- Test: `lib/__tests__/public-list.test.ts` (shape mapping pure fn)

**Interfaces:**
- Produces: `getPublicProjects(): Promise<PublicProjectCard[]>` where `PublicProjectCard = { id, title, description, memberCount, leadName, isMember: boolean }` (isMember computed for the current actor, false for anon);
  `<ProjectCard project={PublicProjectCard} />` renders title/about/lead/member-count, "Members only"/"Public" chip, and the CTA: member → "Open workspace" (`/collaborations/{id}`), non-member → "View project →" (`/collaborations/{id}` — the route already branches to the public page for non-members).

- [ ] **Step 1:** `lib/collaboration/public-list.ts`:

```ts
import "server-only";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/prisma";
import { getActor } from "@/lib/authz";

export type PublicProjectCard = {
  id: string; title: string; description: string | null;
  memberCount: number; leadName: string | null; isMember: boolean;
};

export async function getPublicProjects(): Promise<PublicProjectCard[]> {
  const actor = await getActor().catch(() => null);
  const r = await safeQuery(() =>
    prisma.collaboration.findMany({
      where: { visibility: "PUBLIC", status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      take: 60,
      select: {
        id: true, title: true, description: true,
        createdBy: { select: { firstName: true, lastName: true, username: true } },
        _count: { select: { members: true } },
        members: actor ? { where: { userId: actor.id }, select: { userId: true } } : false,
      },
    })
  );
  if (!r.success) return [];
  return r.data.map((c) => ({
    id: c.id, title: c.title, description: c.description,
    memberCount: c._count.members,
    leadName: [c.createdBy?.firstName, c.createdBy?.lastName].filter(Boolean).join(" ") || c.createdBy?.username || null,
    isMember: Array.isArray(c.members) && c.members.length > 0,
  }));
}
```

(Verify field names `firstName/lastName/username` against the User model before coding; adjust to actual names.)
- [ ] **Step 2:** `project-card.tsx` (server component): Card with title (`<bdi>`), 2-line clamped description, meta row `{leadName} · {memberCount} members` (i18n plural), chip Public, CTA Button asChild Link per isMember. i18n ns `collabSpace`: projectsTab/peopleTab/eventsTab/openWorkspace/viewProject/members/noProjects (+es/fr/ar real translations).
- [ ] **Step 3:** gates · commit `feat(collab): public projects query + project card`.

### Task G2b: /collaborate tabs — Projects · People · Events

**Files:**
- Modify: `app/[locale]/(main)/collaborate/page.tsx` (fetch projects+events, tab param)
- Create: `components/collaborate/collab-tabs.tsx` (client, URL-synced tabs shell)
- Modify: `app/[locale]/(main)/collaborate/events/page.tsx` stays (deep link) but the listing renders inside the Events tab too — extract the event list into `components/collaborate/events-list.tsx` reused by both.

**Interfaces:**
- Consumes: `getPublicProjects()` (G2a), `fetchApprovedEvents(limit)` from `lib/events.ts`, existing `CollaboratePageClient` for People.
- Produces: `/collaborate?tab=projects|people|events` (default projects per spec §4.6 order; keep `?search=`/filter params working on the people tab).

- [ ] **Step 1:** `collab-tabs.tsx`: shadcn Tabs, value from `useSearchParams().get("tab") ?? "projects"`, `router.replace` on change (scroll:false), panels passed as props (`projects`, `people`, `events` ReactNode). 44px min-height triggers; RTL works out of the box with logical props.
- [ ] **Step 2:** page.tsx: keep auth redirect + existing people data fetch; add `const [projects, events] = await Promise.all([getPublicProjects(), fetchApprovedEvents(12)])`; header per spec: title `t("collabSpace.header")` ("Find people, projects & events" ×4 locales) + existing "Start a workspace" button; render `<CollabTabs projects={<ProjectsPanel…>} people={<CollaboratePageClient …/>} events={<EventsList events={events}/>}/>`. ProjectsPanel = grid `sm:grid-cols-2 lg:grid-cols-3` of ProjectCard + empty state `t("noProjects")` + a "Start a workspace" CTA card.
- [ ] **Step 3:** extract `EventsList` from the events page (move the card list markup; events page imports it). Keep RSVP button working inside the tab (it's a client child).
- [ ] **Step 4:** gates · rendered validation signed-in: three tabs render, deep links work, people filters still work, project card CTA routes to workspace (member) — screenshots `g2-collab-{projects,people,events}.png` desktop+375. Commit `feat(collab): §4.6 collab space — Projects/People/Events tabs with project discovery`.

### Task G2c: Connect + Message on people cards

**Files:**
- Modify: `components/collaborate/collaborate-user-card.tsx`
- Consumes: `requestContact` (lib/actions/requests.ts, exists), `startConversation` (lib/actions/messaging.ts, exists — verify exported signature before wiring; it takes the target userId and returns the conversation id used by /messages?c=).

- [ ] **Step 1:** add a footer row to the card: `Message` (outline, → startConversation then router.push(`/messages?c=${id}`)) and `Connect` (ghost, → requestContact with optimistic "Requested ✓" state; error toast on failure). Both only when signed-in and not self; respect `allowMessagesFrom` errors by toasting the server message.
- [ ] **Step 2:** i18n `collabSpace.message/connect/requested` ×4. Gates · rendered check (buttons visible, Message opens a conversation — THIS also live-verifies yesterday's DB fix). Commit `feat(collab): connect + message actions on people cards`.

### Task G3: Case-studies browse rebuild — single gallery + Gallery|Map toggle (§4.11)

**Files:**
- Modify: `app/[locale]/(main)/research-and-action/case-studies/page.tsx`
- Create: `components/case-studies/cases-browser.tsx` (client: toggle + filters + views)
- Reuse: `components/grid-case-study.tsx` card variants (feature/wide/classic), `components/ui/content-filters.tsx`, `components/maps/region-choropleth.tsx` (or LocaleMap) for the map view.
- Test: pure layout-assignment helper.

**Interfaces:**
- Produces: `assignGalleryLayouts(n: number): ("feature"|"quote"|"wide"|"standard")[]` — deterministic masonry rhythm: index 0 → feature, every 5th after → wide, every 7th → quote (falls back to standard when no pull-quote), else standard.
- Consumes: existing case-study list GROQ (keep server fetch; filters client-side on the already-shipped fields region/themes/tags — verify the projection includes them, extend if not).

- [ ] **Step 1: failing test** for `assignGalleryLayouts` (new file `lib/case-studies/gallery-layout.ts` + test): length n, index 0 feature, deterministic (same input → same output), only allowed values.
- [ ] **Step 2:** implement (pure, no Date/random).
- [ ] **Step 3:** `cases-browser.tsx`: header + count; `Gallery | Map` segmented toggle (URL `?view=`); shared chips: Region (7 short codes → localized labels) + Theme (CMS themes — reuse the taxonomy source Atlas uses; NO hardcoded vocab, commented fallback only); Gallery = CSS masonry (`columns-1 sm:columns-2 lg:columns-3` with `break-inside-avoid`) rendering grid-case-study variants per assignGalleryLayouts; Map = two-pane `lg:grid-cols-[1fr_1.2fr]`: filtered result list (compact cards) + `RegionChoropleth` filtered to the same state, region click sets the region chip.
- [ ] **Step 4:** page.tsx: drop the per-region sections; keep Submit CTA + search input (wire `?q=` client filter over title/excerpt).
- [ ] **Step 5:** gates · rendered validation en+ar+375 (`g3-cases-{gallery,map}.png`); empty-filter state shows STATES §2 copy. Commit `feat(cases): §4.11 gallery+map browse — masonry layouts, shared region/theme chips`.

---

## Deferred to Part 2 (mock-gated)
- G4 editorial reading experience §4.12 (figure/caption, pull-quotes, references, chart-as-editorial-object) — REQUIRES an approved mock first (user contract 2026-07-03).
- G5 editor right rail (pipeline/connections/reviewers) + chart UX (CSV paste, caption/source, placement) + edit-existing-submission route (needed so workspace pending outputs can be reopened).
- G6 dashboard personal pipeline.

## Sequencing
G1a → G1b → G2a → G2b → G2c → G3. Rendered-evidence checkpoint after G1b, G2c, and G3 for user eyeball.
