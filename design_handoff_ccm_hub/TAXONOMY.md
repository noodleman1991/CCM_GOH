# CCM Hub — Taxonomy Inventory & Permissions Matrix

The single source of truth for every tag, code, status and colour used across the hub, plus the full role × action permissions matrix. Values are taken verbatim from `CCM Hub Redesign.dc.html`. When a value appears in the front end, the Sanity schema (`SANITY_SCHEMA.md`) and here, **these three must always match** — this file is the authority; change it first.

Legend: **Code** = stored value (lowercase, stable, never shown to users) · **Label** = display string · **Colour** = brand hex used by the front-end colour map.

---

## 1. Regions (7 — fixed, never user-editable)

| Code | Label | Short label | Colour | Atlas blob |
|---|---|---|---|---|
| `enam` | Europe & Northern America | Europe & N. America | `#0B3160` (midnight) | ✓ |
| `lac` | Latin America & the Caribbean | Latin America | `#2563ef` | ✓ |
| `nawa` | Northern Africa & Western Asia | N. Africa & W. Asia | `#4186C3` (water) | ✓ |
| `ssa` | Sub-Saharan Africa | Sub-Saharan Africa | `#205596` (sea) | ✓ |
| `csa` | Central & Southern Asia | Central & S. Asia | `#3a81f6` | ✓ |
| `esea` | Eastern & South-Eastern Asia | E. & SE Asia | `#1a4eda` | ✓ |
| `oce` | Oceania | Oceania | `#9BC6DA` (sky) | ✓ |

> "Global" is **not** a region — it's the absence of a region (`region` empty) on news/content, shown as the `GLOBAL` tag. Colour `#4974CA` (primary).

---

## 2. Themes

| Code | Label |
|---|---|
| `displacement` | Displacement |
| `livelihoods` | Livelihoods |
| `youth` | Youth |
| `indigenous` | Indigenous |

## 3. Populations

| Code | Label |
|---|---|
| `youth` | Children & youth |
| `women` | Women |
| `indigenous` | Indigenous peoples |
| `farmers` | Farmers & rural livelihoods |
| `displaced` | Displaced & migrants |

> ⚠️ `youth` and `indigenous` intentionally appear in **both** Themes and Populations — they are different facets (a theme of the work vs the population studied). Keep them as separate fields; do not merge.

---

## 4. Content types

| Code | Label | Publishes to hub | Layouts available | Localised | Versioned |
|---|---|---|---|---|---|
| `caseStudy` | Case study | ✅ | Story / Feature / Report | ✅ | ✅ |
| `livedExperience` | Lived experience | ✅ | Story | ✅ | — |
| `newsPost` | News / blog | ✅ | Brief / Feature / Story | ✅ | — |
| `researchOutput` | Research output / toolkit | ✅ | Report / Story | ✅ | ✅ |
| `event` | Event / open meeting | ✅ | — | ✅ | — |
| `fundingApplication` | Funding application | ❌ internal | — | partial | ✅ |
| `dataset` | Dataset / evidence | ❌ internal | — | — | ✅ |
| `ad` | Ad / open call | ✅ (lightweight) | — | — | — |

> Prototype's `contentTypeList`: Case study · News / blog · Lived experience · Research output · Funding application · Open meeting · Ad / open call. "Open meeting" is an `event` with `mode` online + public `scope`.

## 5. Layout archetypes (presentation, not content)

| Code | Label | Meaning (encoded in shape) |
|---|---|---|
| `story` | Story — cover + narrative | People & narrative; full-bleed cover + single airy column + breakout quotes |
| `feature` | Feature — bold split cover | One bold idea; oversized headline on a navy split panel |
| `report` | Report — dossier + sidebar | Evidence & reference; metadata bar + sticky "at a glance"/contents + numbered body |

News reuses the same archetypes as **Brief / Feature / Story**; research outputs as **Report / Story**.

---

## 6. Workflow status (publishable content)

Authoritative state set (`status`). Replaces the prototype's looser `stageMeta` + `submissionsData` strings — those map in as shown.

| Code | Label | Colour | Public-visible | Prototype equivalents |
|---|---|---|---|---|
| `draft` | Draft | `#8595AC` (slate) | ❌ | `draft` / "Draft" |
| `review` | In review | `#E0A53F` (amber) | ❌ | `review` / "In review" / "In Sanity review" |
| `changes` | Changes requested | `#E0A53F` | ❌ | (kickback from review) |
| `published` | Published | `#205596` (sea) | ✅ | `published` / "Approved" / "Final" |

> Internal-only docs (funding, datasets) use `draft → review → final`; `final` is an internal alias of `published` that is **never** exposed publicly.

## 7. Task status (workspace — operational, app-side not CMS)

| Code | Label | Colour | Marker |
|---|---|---|---|
| `done` | Done | `#205596` | ✓ (filled) |
| `doing` | In progress | `#4186C3` | (outline) |
| `todo` | To do | `#9BC6DA` | (empty) |

---

## 8. People / collaboration intent

| Code | Label | Colour | Meaning |
|---|---|---|---|
| `looking` | Looking | `#E0A53F` (amber) | Seeking a specific collaborator/skill |
| `offering` | Offering | `#205596` (sea) | Offering a skill/help to others |
| `member` | Member | `#8595AC` (slate) | Listed, open to connect, no active call |

Used on `person.collabStatus` and the Collab → People facet. Project-level equivalents live in `project.openCalls` with the same `seeking` / `offering` split.

## 9. Project facets

| Field | Code | Label | Colour |
|---|---|---|---|
| Visibility | `Public` | Public | `#205596` |
| Visibility | `Private` | Private | `#8595AC` |
| Status | `Active` | Active | `#205596` |
| Status | `Recruiting` | Recruiting | `#E0A53F` |
| Status | `Completed` | Completed | `#8595AC` |

## 10. Events

| Field | Codes |
|---|---|
| `scope` | `Project` (`#4186C3`) · `Community` (`#205596`) · `Global` |
| `mode` | `in-person` · `online` · `hybrid` |
| links | `linkedProject` (ref) and/or `linkedRegion` (ref) — both optional |

## 11. Atlas layers (data facets on the map)

| Code | Label | Dot colour |
|---|---|---|
| `cases` | Case studies | `#205596` |
| `lived` | Lived experiences | `#4186C3` |
| `projects` | Active projects | `#0B3160` |
| `people` | Contributors | `#9BC6DA` |

## 12. Languages

| Code | Label | Dir |
|---|---|---|
| `en` | English | ltr |
| `fr` | Français | ltr |
| `ar` | العربية | **rtl** |
| `es` | Español | ltr |

## 13. Document version kinds

| Code | Label |
|---|---|
| `summary` | Summary |
| `full` | Full report |
| `brief` | Brief |
| `deck` | Slide deck |

## 14. Connection relations (content-to-content)

| Code | Label | Example |
|---|---|---|
| `about` | About | News post **about** a project |
| `part-of` | Part of | Output **part of** a project |
| `output-of` | Output of | Case study **output of** a project |
| `follows-up` | Follows up | News post **follows up** an event |
| `related` | Related | Loosely related content |

## 15. Thread scopes

| Code | Label | Anchored to |
|---|---|---|
| `community` | Community discussion | a `region` |
| `content` | Comment on content | a published item |
| `project` | Project discussion | a `project` |

---

## 16. Front-end colour map (single object)

Every code above resolves through one map so a tag's colour is identical everywhere it appears (chip, blob, dot, badge).

```js
// the only place colours are decided — mirror in Sanity preview & front end
export const CCM = { midnight:'#0B3160', sea:'#205596', water:'#4186C3', sky:'#9BC6DA', primary:'#4974CA', secondary:'#90E0F4', amber:'#E0A53F', slate:'#8595AC' };

export const COLOR = {
  region: { enam:'#0B3160', lac:'#2563ef', nawa:'#4186C3', ssa:'#205596', csa:'#3a81f6', esea:'#1a4eda', oce:'#9BC6DA' },
  global: '#4974CA',
  status: { draft:'#8595AC', review:'#E0A53F', changes:'#E0A53F', published:'#205596' },
  task:   { done:'#205596', doing:'#4186C3', todo:'#9BC6DA' },
  intent: { looking:'#E0A53F', offering:'#205596', member:'#8595AC' },
  project:{ Active:'#205596', Recruiting:'#E0A53F', Completed:'#8595AC', Public:'#205596', Private:'#8595AC' },
  layer:  { cases:'#205596', lived:'#4186C3', projects:'#0B3160', people:'#9BC6DA' },
};
```

---

## 17. Permissions matrix

Three roles (from spec). **Visitor** = not signed in, included for completeness.

### 17.1 Roles

| Role | Who | Studio access |
|---|---|---|
| Visitor | not signed in | none |
| **Member** | anyone signed in | none (app-side only) |
| **Project collaborator** | member added to a project | none (app-side authoring on their project) |
| **Regional convenor / editor** | appointed per region | Studio, scoped to their region |

### 17.2 Action × role

✅ allowed · 🟡 conditional (see notes) · ❌ denied

| Action | Visitor | Member | Collaborator | Editor |
|---|---|---|---|---|
| **Browse & discovery** |
| View published content / Atlas / regions | ✅ | ✅ | ✅ | ✅ |
| Universal search & filters | ✅ | ✅ | ✅ | ✅ |
| View public project pages & profiles | ✅ | ✅ | ✅ | ✅ |
| Follow regions / themes | ❌ | ✅ | ✅ | ✅ |
| **Community participation** |
| Post / reply in community threads | ❌ | ✅ | ✅ | ✅ |
| Comment on published content | ❌ | ✅ | ✅ | ✅ |
| RSVP / attend events | ❌ | ✅ | ✅ | ✅ |
| Be listed as collaborator / expert | ❌ | ✅ | ✅ | ✅ |
| **Projects** |
| Start a new project | ❌ | ✅ | ✅ | ✅ |
| Request to join a project | ❌ | ✅ | ✅ | ✅ |
| Post an open call (seeking/offering) | ❌ | 🟡 own project | ✅ own project | ✅ |
| Accept join requests | ❌ | 🟡 if lead | 🟡 if lead | ✅ region |
| Edit project workspace (plan, tasks, files, messages) | ❌ | ❌ | ✅ member of | ✅ region |
| **Content authoring** |
| Create a draft (any publishable type) | ❌ | ✅ | ✅ | ✅ |
| Submit lived experience (own/consent) | ❌ | ✅ | ✅ | ✅ |
| Edit a draft | ❌ | 🟡 own | ✅ project's | ✅ region |
| Choose layout / place media / leads | ❌ | ✅ own draft | ✅ project's | ✅ |
| Annotate PDFs / documents | ❌ | 🟡 project member | ✅ project's | ✅ |
| **Review workflow** |
| Submit for review (`draft → review`) | ❌ | ✅ own | ✅ project's | ✅ |
| Request changes (`review → changes`) | ❌ | ❌ | ❌ | ✅ region |
| **Approve & publish** (`review → published`) | ❌ | ❌ | ❌ | ✅ region |
| Edit taxonomy tags on submission | ❌ | 🟡 own draft | 🟡 project's draft | ✅ region |
| Moderate / remove threads & comments | ❌ | ❌ | ❌ | ✅ region |
| Curate region page (pin, feature) | ❌ | ❌ | ❌ | ✅ region |
| **Account & privacy** |
| Edit own profile & section visibility | ❌ | ✅ | ✅ | ✅ |
| Set contact / privacy preferences | ❌ | ✅ | ✅ | ✅ |
| Receive & handle contact requests | ❌ | 🟡 if contactable | 🟡 | 🟡 |

### 17.3 Notes on conditional (🟡) rules

- **Project lead vs collaborator** — accepting join requests and posting open calls is the **lead's** right; a plain collaborator can author/edit but not admit members. Lead is `project.lead`; collaborators are `project.members[]`.
- **"Own" draft** — a member can only edit drafts where `submittedBy == them`. A collaborator can edit any draft attached to a project they belong to.
- **Editor scope** — every editor power is bounded to documents/threads/projects where the region matches the editor's `reviewRegion`. A NAWA editor cannot publish an SSA submission.
- **Contactable** — contact requests obey the target's `person.visibility.contact` and contact preference; an uncontactable member receives none.
- **Publish gate** — `status → published` is reachable **only** through the editor-only *Approve & publish* document action. No member/collaborator path sets `published`; the public API filters `status == 'published'`, so an unapproved item is never live even if a state were forced.

---

## 18. Validation rules (enforce in Sanity)

- `region` required on all content except `newsPost` (empty = Global).
- `livedExperience.consentObtained == true` required before `status` can leave `draft`.
- `status == 'changes'` requires at least one `reviewNotes[]` entry with a note.
- `documentVersion` requires `kind` + `lang`; `label` auto-derives if blank.
- Taxonomy fields accept **only** codes in §1–§5, §8–§15 (Sanity `list` options enforce this — no free text).
- An editor action is rejected if `document.reviewRegion != user.reviewRegion`.
