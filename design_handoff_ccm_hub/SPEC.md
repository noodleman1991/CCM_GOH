# CCM Hub Redesign — Validation, Inventory & Spec Notes

Working doc for turning the prototype (`CCM Hub Redesign.dc.html`) into a build spec.
Status legend: ✅ wired · ◻︎ static affordance (intentional, no backend in prototype) · ⚠️ dead/unclear (decide) · ♻️ redundant (remove/merge)

## 1. Screen inventory (what exists)
Public / discovery: **Home**, **Atlas & Explore**, **Case Studies** (gallery + map), **Case study detail** (Editorial / Feature / Report + Mobile), **Regional community**, **News**, **Discussion thread**, **Search results**.
Collaboration: **Collab space** (Projects / People / Events), **Project — public page**, **Project workspace** (Home · Conversation · Documents), **Content editor** (block editor + PDF annotation + Sanity pipeline).
Account: **Dashboard** (personal), **Profile** (public), **Account settings**, **Messages** (project / community / direct).

## 2. Button & link validation
### ✅ Wired (navigate / mutate state)
Sidebar nav (Home, Collab, Messages, Atlas, Case Studies, Regional, News) · user chip → Dashboard · topbar Discover → Collab · sidebar search → Search results · case cards → detail · project cards → workspace (mine) / public page · region chips & map blobs → filter/Atlas · layer + theme facets · Collab tabs · gallery/map toggle · content items → editor · workspace tabs · task controls (status cycle, move step, delete, add) · file select · layout switch + Mobile toggle · news region filter · regional threads → thread · "View public page" · dashboard cross-links · account back · profile ↔ account ↔ dashboard.

### ◻︎ Static affordances (fine for prototype; wire at build)
Connect · Message · RSVP · Request to join · Follow · Offer to help · Invite collaborator · Submit / Start a project / Start a thread · New · Save changes · Manage account · notification toggles · message composers + send · "+ Add block" · "Pull into draft" · Read the Global Agenda · Get involved · favourite (♥).

### ⚠️ / ♻️ Decide or clean up
- ⚠️ **Sidebar "Lived Experiences"** — no screen/handler (dead). → build a Lived Experiences screen (see §6) or remove.
- ⚠️ **Sidebar About / Feedback** — no handlers. → simple content pages or external links.
- ♻️ **Topbar "Discover"** duplicates the sidebar Collab entry → consider dropping, or repurpose as global "+ Create".
- ♻️ **Topbar ♥** — purpose unclear (saved items?) → define or remove.
- ♻️ **Stale data in `renderVals`** no longer rendered: `taskCols`, `submissions`, `agenda`, `memberAvatars`, `atlasProjectsData` partially → remove to keep logic clean.
- ⚠️ Atlas "Collaborators / Projects" result tabs and region→country **drill** are stubbed (no country layer yet) → spec the drill.

## 3. Tag & coding inventory  → unify
Today these enumerations exist independently with ad-hoc colors:
| Dimension | Values | Notes |
|---|---|---|
| **Region** | enam · lac · nawa · ssa · csa · esea · oce | each has a brand-blue color; **canonical** geo facet |
| **Content type** | Case study · News/blog · Lived experience · Research output · Funding application · Open meeting · Ad/open call | |
| **Pipeline stage** | draft → review (Sanity) → published · (internal: draft → final) | |
| **Project status** | Active · Recruiting | |
| **Visibility** | Public · Private | |
| **Person status** | Seeking · Offering · Member | (was "looking/offering") |
| **Event scope** | Community · Project | |
| **Atlas layer** | Cases · Lived experiences · Projects · Contributors | overlaps with Content type |
| **Theme** | Displacement · Livelihoods · Youth · Indigenous | ⚠️ mixes *theme* (displacement, livelihoods) and *population* (youth, indigenous) |
| **Task status** | To do · In progress · Done | |

**Proposed unified taxonomy** (one source of truth, shared color tokens):
- **Region** (7, fixed) — geo facet, drives the Atlas + every page's regional cut.
- **Theme** (hazard/impact): displacement, livelihoods, heat, flooding, drought…
- **Population** (who): youth, Indigenous, small farmers & fishers, women, general — *split out from Theme*.
- **Content type** (7 above) — also the Atlas "layer".
- **Stage** (one pipeline; "final" = published-internal).
- **Status / Visibility / Scope** — keep, but render from one shared status-color map.
Single color system: region colors (blue family) for geo; one neutral status palette (grey=draft/todo, blue=in-progress/review, amber=attention, green/sea=done/published). Stop hand-coding per-component.

## 4. Documents — multilingual & versioned (to build)
A document/output is **one item with N versions × M languages**:
```
output { title, type, region, ...,
  versions: [
    { label: "Summary",     langs: ["EN","FR","AR"], sizes: {...} },
    { label: "Full report", langs: ["EN","FR"] }
  ] }
```
UI: version selector (Summary / Full report) + language chips (EN · FR · العربية · ES) on the Documents tab, content editor source list, and the public output/case pages. Mirrors the live hub's multi-language downloads.

## 5. Threads & comments — where they live
- **PDF / document annotations** — anchored threads in Project → Documents (margin pins p.4 ¶2 …) and surfaced in the Content editor "Annotations" rail with "Pull into draft".
- **Comments on published content** — comment thread at the bottom of a case-study detail (public).
- **Community discussion threads** — Regional page → thread detail (replies + composer).
- **Project messaging** — channels + DMs in Messages, grouped by project/community/direct.
→ All four share one comment/thread component; spec a single `Thread{ anchor?, posts[] }` model.

## 6. Atlas & facets — production logic
- **One filter state** shared by Atlas + Case Studies + Collab + Search (region · theme · population · type · year · q).
- **Layers** = content type (cases / lived exp / projects / contributors / outputs / toolkits). Toggling a layer changes what the region counts represent.
- **Region → country drill**: clicking a region zooms to its countries; country shows **only pinned content** (no choropleth by default — stylized, on-brand). Optional choropleth as a layer later.
- **Discovery modes**: Content · Collaborators · Projects · Events — all geo-faceted.
- Region facet **embeds** on each community page focused on that region.

## 7. Recommended next build order
1. Unify tags/colors (§3) — foundational, touches everything.
2. Multilingual/versioned documents (§4).
3. Lived Experiences screen (video / audio / written types) + improve News (filters, type, author).
4. Tighten Collab working pages + project management (consistent thread/comment component, §5).
5. Atlas region→country drill + shared filter state (§6).
6. Wire the ◻︎ affordances that matter; remove ⚠️/♻️ items.

## 8. Authoring & templates (publishing UX)
Every content type is authored in the **block editor** but starts from a **template** the user picks; switching template keeps the content, only re-flows the layout. Templates per type:
- **Case study** — Editorial · Feature · Report (built; mirrors the public detail layouts).
- **News / blog** — Standard · Feature · Brief (same engine, distinct design: tighter type, dateline/byline, smaller hero).
- **Lived experience** — Video-led · Audio · Written story (media block leads; transcript optional).
- **Funding application** — Structured form (sections + budget table; internal).
- **Research output** — Report · Data brief.

Authoring affordances (in editor): pick template · set **lead/standfirst** · add blocks (heading, text, pull-quote, **image**, **video/audio**, dataset/table, embed) · drag to reorder · per-block media placement. The same blocks render on the public page, so authors see roughly what publishes. News reuses the engine with its own type scale + meta (date, author, tag) so it reads as news, not a case study.

## 9. Connecting content types (cross-links)
A piece of content can be **linked** to a Project, Event, Region, or other content (e.g. *news on a project*, *news on an event*, *report → related lived experience*). Set in the editor's **Connections** panel; on the public frontend these render as contextual chips/links ("From the Niger Delta study", "Posted for the SSA community call", "Related: Sunday's story") and back-link into the workspace/community. Model: `content.links: [{ kind: project|event|region|content, id }]`.

## 10. CMS / Sanity moderation flow
- Author in the hub workspace → **Submit** moves the item to **In Sanity review**.
- A **Regional convenor/editor** reviews in **Sanity Studio**; only approved items go live (publish gate).
- **Reviewer feedback returns to the project** — comments/annotations surface back in the workspace so the team can revise, not lost in email.
- Internal types (funding application, datasets) never publish — they stop at **Final**.
- Layout/style is enforced by the hub's block templates, so editors review **content & framing**, not design.

## 11. Membership actions — follow, requests, notifications, privacy
- **Follow a project** = a lightweight, no-approval subscription: you get its public updates (new outputs, events, open calls) in your feed/notifications. It does **not** grant workspace access. (Follow a person/region/theme works the same.)
- **Request to join a project** = membership ask → the requester writes a **short prompt** ("what you'd bring / why"). Goes to the project lead as an actionable notification; **Accept / Decline** (decline can send a note). Accept adds them as a **collaborator** (workspace + channels). Public projects accept requests; private projects are invite-only.
- **Offer to help / propose collaboration** = response to an open call → also a short prompt to the lead; can become a task, a guest role, or a DM.
- **Contact / message** = governed by privacy: *Anyone · Members in my region · No one*. If "require a request before contact" is on, first contact is a **request with a note** the recipient accepts before a thread opens.
- **Notifications** — one inbox, grouped by source (Project · Community · Direct · Requests), each type toggleable in settings (mentions, project activity, events, requests, weekly digest); surfaced via the topbar bell + a Requests queue on the Dashboard. Email digest optional.
- **Settings** — Account (name/email/region/role), Notifications (per-type), **Privacy & contact** (profile visibility, who can message, require-request, show email), plus language and sign-out.

## 12. Events & calendars · project ↔ community
- An **event belongs to either a community or a project** (its `scope` + `link`), and can be cross-posted. Community events are open to all members; project events default to the project (can be opened up).
- **RSVP** sets your status (Going / Interested); **+ Add to calendar** exports a single event (iCal/Google). **Subscribe to calendar** adds the whole community's or project's feed to your own calendar (live iCal URL).
- **Project ↔ community**: every project is anchored to **one home region/community** (shown on the project + in Collab), and may tag **additional communities** it's relevant to. The community page lists its projects; a project's events and outputs surface in its community. Managed by the project lead at creation (home community) and editable in project settings.

## 13. Layout use cases · mobile · collaborative editing
**When each layout is used** (the author picks to fit the content, design stays on-brand):
- **Editorial** — narrative, image-led case studies/features; big hero, generous reading column. Default for compelling stories.
- **Feature** — flagship pieces; split title/media panel for impact. Use when one strong image + title carries it.
- **Report** — research-heavy outputs; dense body + sticky "at a glance" sidebar (region, source, type, methods). Use for evidence/reference.
- **Standard / Brief** (news) — Standard for a normal post, Brief for a short update/announcement; dateline + byline, smaller hero.
- **Video-led / Audio / Written** (lived experience) — chosen by the medium of the testimony; media block leads, transcript optional.
- **Structured form** (funding/internal) — sections + budget table; never public.

**Mobile versions** — every template collapses to one reading column: hero scales down, Feature's split **stacks** (title → media → body), Report's sidebar moves **below** the body (or a collapsible "At a glance"), media goes full-width, sticky elements unstick, type steps down one scale. The editor's **Mobile** toggle previews exactly this, so authors check both before publishing.

**How it's edited & collaborated** —
- Authored in the **block editor**: pick template → set lead → add/reorder blocks (text, quote, image, video/audio, dataset, embed) → place media. Switching template **keeps content**, only reflows.
- **Collaborative**: multiple project members on one draft (presence/co-editing), **block-level comments** + PDF/source **annotations**, **version history**, and the **draft → team → Sanity review → published** flow. Reviewer/editor feedback returns into the project to revise.
- **Roles**: project collaborators edit; the regional convenor/editor approves in Sanity (publish gate). Layout is a content-team choice; brand/templates keep it consistent so review is about content, not pixels.
