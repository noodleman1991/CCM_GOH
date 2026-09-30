# One filter system, built from real content — design

**Date:** 2026-09-30 · **Status:** direction approved in conversation ("one system from real content"), awaiting written-spec review

## 1. What we found (dev data, 2026-09-30)

- **"Themes" is a dead end.** Themes are tags with a `useAsTheme` tick; none is ticked, so the atlas shows a hard-coded fallback list (Displacement, Livelihoods, Youth, Indigenous) — against the standing rule of no hard-coded filter vocabularies — and "Livelihoods" matches nothing.
- **Tags only work for case studies.** Case studies 27/27 tagged, meaningfully. Lived experiences: 33 of 35 carry the same four generic tags (Mental Health Support, Climate Change, Community Action, Storytelling). Research outputs 0/29, agendas 0/29, news 1/4, events 0 tagged.
- **35 of 68 tags are unused.** Tag kinds: topic 42, impact 9, audience 9, location 7 (duplicates regions), method 1.
- **Every list page filters differently**: news (region, tags, date), case studies (region, tags), lived experiences (region, tags, client-side), research outputs (none), atlas (show, theme, when). Parameter names differ (`tags`, `theme`, `topic`, `communities`, `regions`).

## 2. Goal

Visitors filter everything the same way, and every choice they see finds something. Editors never maintain a separate "themes" list: the choices come from the tags content actually carries.

**Success:** on the atlas and on every list page, each filter option shows a count and returns at least that many items; no option returns nothing; the same filter names and URL parameters everywhere; editors can see what is untagged.

## 3. Design

**3.1 Four axes, everywhere.**
| Filter | Values | URL |
|---|---|---|
| **Region** | the 7 regions (matches an item's own region *or* its community's) | `region=oce,ssa` |
| **Communities** | audience tags (Indigenous Communities, Youth, Fisher People…) | `communities=<tag values>` |
| **Themes** | topic + impact tags | `themes=<tag values>` |
| **When** | past year / past 3 years / earlier (events: upcoming / past) | `when=` |
Plus **Search** (`q=`). Several values per filter; values within a filter match *any*, filters combine with *and*. Location and method tags are not offered (regions cover location).

**3.2 Options come from content, with counts.** One server helper, `getFilterOptions({ kinds, active })`, returns for each axis only the tags used by at least one visible (published, approved) item of the page's content types, each with a count that respects the *other* active filters. A tag carried by more than 90% of a type's items is left out for that type (it can't narrow anything — e.g. the lived experiences' four generic tags). Sorted by count, then name. Cached like other content reads.

**3.3 One filter bar.** The atlas's existing labelled filter rows (`FilterRowGroup` / `FilterRow` / `FilterChip`) become the shared bar for: atlas, case studies, news, lived experiences, research outputs (new), and — with the events project — events. Mobile: rows scroll sideways as on the atlas today; RTL-correct; four languages.

**3.4 Old links keep working.** `tags=`, `theme=`, `topic=` map onto `themes=`/`communities=` by the tag's kind; `regions=`/`communities=<community slug>` map onto `region=`.

**3.5 Retire the tick-box.** `useAsTheme` is hidden in the admin (data kept); `FALLBACK_THEMES` is removed. Content feeds (the admin's Region / Communities / Themes pickers, already built) stay as they are.

**3.6 Help editors close the gaps.** The admin home gets a **"Needs tags"** panel: per content type, how many published items have no Themes and how many no Communities tag, each linking to the admin list filtered to those items. Tagging stays an editorial job; nothing is auto-tagged.

## 4. Build order (each step checked on the rendered pages)

1. `getFilterOptions` + URL mapping (pure parts unit-tested; queries checked on the dev database).
2. Atlas on the new options (removes the fixed list).
3. Case studies, news, lived experiences on the shared bar.
4. Research outputs gets filters.
5. "Needs tags" panel; hide `useAsTheme`.

## 5. Testing

Unit: option building (used-only, counts, the 90% rule, sort), axis split by tag kind, URL mapping of old parameters, region-or-community matching. Dev database: every option's count equals the number of items its filter returns, for each page. Rendered (1280/375, en/ar): each page's bar, a filtered result, an old `?tags=` link. Full suite, tsc, lint.

## 6. Out of scope

Automatic tagging; merging or renaming tags; tagging the untagged content (editorial — the panel makes it visible); events filters (arrive with the events project on this same bar).
