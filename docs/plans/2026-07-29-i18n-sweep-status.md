# i18n / RTL sweep — status & remaining inventory (2026-07-29)

Goal: every native (hardcoded English) string translated to en/es/fr/ar; RTL best practices
(logical CSS, bidi-safe mixed-direction content). Branch: feat/redesign-and-comments.

## Done (this pass — all gated: tsc 0 errors, vitest 533/533, ar rendered spot-checks)

- **RTL-unsafe physical classes → logical** (`text-start`, `ms-/me-`, `start-/end-`, `border-s/e`,
  `rounded-s/e`): auth-nav-user, nav-user, community-selector, 5 onboarding panels,
  modern-progress-sidebar, dashboard page-client, case-study-card, case-studies-listing,
  header, disable-draft-mode, profiles page, calendar. Kept: side-aware primitives
  (sheet/sidebar/scroll-area — Radix side APIs), per-language option rows (semantic dir).
- **Locale-unaware dates fixed** (were browser/server-default): typed-card (DateTile/shortDate now
  take locale), news-card, case-study-review, case-study-form (draft time), revision-alert-dialog.
  Sites already passing locale left as-is.
- **Hardcoded attrs/labels → i18n keys ×4 locales** (key parity verified 4×):
  - `search.filterLabels` namespace: all 19 filter section titles + Filters/Active filters/
    Year range/to/Apply/Clear in content-search-filters.
  - `common` additions (close, goToHomepage, toggleSidebar, openMenu, prev/next page+slide,
    morePages, copyCode, scrollBack/Forward, removeFilter, clearSearch, selectLanguage,
    regionalMap, share labels, sharePost, enterYourEmail, emailRequired/emailInvalid,
    mainNavigation(+Description), toggleTheme + theme names) wired into: pagination, dialog,
    sheet, carousel, breadcrumb, ui/sidebar (trigger/rail/drawer), filter-chip, copy-button,
    scroll-row, custom-search-box, cookie banner, logo, app-sidebar, footer, header,
    mobile-nav, language-switcher, menu-toggle, region-choropleth, newsletter (incl. Zod
    messages via in-component schema closure — the pattern for the wider Zod slice),
    post-hero. `revisionAlert.submittedOn/revisionBadge` added.
- **Bidi/mixed-direction** (user directive: LTR text on RTL pages and vice versa must order/align
  correctly): `dir="auto"` on content-derived titles/excerpts — news-post-card, external-source-card,
  grid-news, grid-post, grid-case-study, case-study-card, and the 4 detail-page `h1`s + post-hero.
  typed-card already used `<bdi>`. Pattern for the rest of the sweep: any element rendering CMS/user
  text that may fall back to another language gets `dir="auto"` (or `<bdi>` for inline).

## Remaining (inventoried 2026-07-28, ~340 strings across ~50 files)

Full agent inventory of 384 hardcoded strings/62 files; minus what's fixed above. Slices by surface:

1. **Search results** — content-search-results.tsx (~23: Featured/Authors/more/agenda type names/
   empty-state copy), search-results, search-error-boundary (7).
2. **Case-study submission** — case-study-form (~35 incl. 8 Zod messages), case-study-review (~20),
   case-study-submission-layout (6 section titles), lived-experience-form, research-output-form.
   Zod pattern: move schema inside component, messages via `t()` (proven in newsletter).
3. **Dashboard** — user-submissions-dashboard (~40 incl. a 15-item hardcoded TOPIC list that should
   come from CMS taxonomy per standing rule), dashboard/page.tsx setup states.
4. **Onboarding** — welcome-panel feature copy (~10), modern-onboarding-container error messages (8),
   work-info-panel links section, review-panel, "% complete"/"~2 min left".
5. **Profile/account** — profile-edit-form (~20 Zod+errors), account-management (~15; keep the
   literal DELETE confirm token), recent-work-form (5).
6. **Moderation/staff** — broadcast-form (~11), moderation-queue (~10), moderation pages.
7. **Grid/block leftovers** — grid-report-download (4), regional-agendas-grid (3), portable-text
   renderer (References/Source:/Image), read-more toggles, expandable-grid defaults, content-flow
   errors, case-studies-listing empty state, misc "more"/"Featured"/"Untitled" fallbacks.
8. **Detail-page metadata titles** — "X Not Found" page titles (news/case-study/research-output/
   profiles), reader placeholder copy, onboarding page region names (should use REGION i18n keys).
9. **Systemic (design decision needed)** — notification snippets are stored as raw English in the
   DB (`lib/actions/rsvp.ts` et al): localizing means storing keys+params instead of prose.
   nav-projects.tsx appears to be dead shadcn scaffolding — delete rather than translate.

## Verification recipe per slice
tsc + vitest + `node -e` 4-locale key-parity check + ar rendered spot-check (green build ≠ validated).
