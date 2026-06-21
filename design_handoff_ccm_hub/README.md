# Handoff: Connecting Climate Minds Hub — Redesign

## Overview
A redesign of **hub.connectingclimateminds.org** — a collaborative research hub where researchers, practitioners and people with lived experience across 7 global regions discover content, run projects together, and publish case studies, lived experiences, news and research outputs through a CMS-moderated pipeline.

This bundle is the complete design + specification package for implementing that redesign.

## About the design files
The files here are **design references created in HTML** — a clickable prototype showing intended look and behaviour, **not production code to copy directly**. The task is to **recreate these designs in the target codebase's environment** using its established patterns and libraries.

The live hub is **Next.js + Tailwind + Sanity CMS**. The prototype's design tokens already match the live hub's Tailwind theme, so recreate the UI in that stack (or, if starting fresh, Next.js + Tailwind + Sanity is the intended target). The prototype is built in a bespoke HTML component runtime (`support.js`) purely for prototyping — **do not** port that runtime; reimplement the screens as React components.

## Fidelity
**High-fidelity.** Final colours, typography, spacing, layouts and interactions. Recreate the UI faithfully using the codebase's React + Tailwind patterns. Exact tokens are in `TAXONOMY.md §16` and `WIREFRAMES.md`.

## How to read this package
1. **Open `CCM Hub Redesign.dc.html`** in a browser — the clickable prototype, the visual + interaction reference. (It needs `support.js`, `image-slot.js` and `uploads/`, all included.)
2. **`SPEC.md`** — product decisions & rationale (the *why*).
3. **`WIREFRAMES.md`** — screen-by-screen structure, components, responsive behaviour (the *what*).
4. **`FLOWS.md`** — navigation blueprint: Mermaid flow charts, click-by-click wiring table (✅ wired / ⚠️ static affordance / ❌ backend task), feature→location matrix.
5. **`SANITY_SCHEMA.md`** — build-ready Sanity v3 schema: content types, blocks, localization, versions, references, the review workflow + roles, Studio desk structure, and a front-end data contract mapping every prototype value to its source.
6. **`TAXONOMY.md`** — authoritative tag/code/colour inventory + the full role × action permissions matrix + validation rules. **This is the design-token + enum source of truth.**
7. **`STATES_AND_COPY.md`** — loading/empty/error/gated states, real microcopy & notification strings, onboarding copy, accessibility rules, and the **operational data model** (the live state that is NOT in Sanity: messaging, tasks, RSVP, follows, notifications).

## The 20 screens
Home · Sign-up / onboarding · Dashboard · Profile · Account settings · Collab space (Projects / People / Events) · Project public page · Workspace (Home / Conversation / Documents) · Content editor · Atlas & Explore · Case Studies (gallery + map) · Case detail (Story / Feature / Report + mobile) · Regional community · News · News detail · Lived experiences (+ detail) · Messages (Conversations + Notifications) · Thread / discussion · Search · About / Feedback.

Each is documented in `WIREFRAMES.md` (layout, components, copy) and `FLOWS.md` (navigation). Rather than duplicate that here, treat those two files as the per-screen spec the Claude Code skill asks for — they are written to be self-sufficient.

## Architecture at a glance
- **Front end:** Next.js + Tailwind (tokens match the live hub). Reads **Sanity** for published content via GROQ (`status == 'published'`, respecting `visibility`).
- **CMS:** Sanity Studio. Members submit from the hub; regional editors review & publish. Full schema in `SANITY_SCHEMA.md`.
- **App DB** (Postgres/Firestore/Convex — implementer's choice): live interaction state — messaging, tasks/kanban, files/annotations, RSVP, follows, join/contact requests, notifications. Schema in `STATES_AND_COPY.md §6`. Joins to Sanity on `sanityPersonId`.
- **i18n:** EN / FR / AR / ES, RTL for Arabic (design-system `[dir="rtl"]` rules). Field-level localization in Sanity.
- **a11y:** WCAG AA — rules in `STATES_AND_COPY.md §8`.

## Design tokens (summary — full map in `TAXONOMY.md §16`)
- **Fonts:** Poppins (headings, buttons, labels — 700/600/500), Lato (body). Arabic: Lalezar (headings), Tajawal (body).
- **CCM blue family:** midnight `#0B3160` · sea `#205596` · water `#4186C3` · sky `#9BC6DA`. Primary `#4974CA`, secondary `#90E0F4`. Accent amber `#E0A53F`, slate `#8595AC`.
- **Radius:** `--radius: 0.625rem` (cards 12–18px, pills 999px). **Shadow:** `0 1px 3px rgba(11,49,96,.06)` for cards.
- Region / status / intent / layer colours: see `TAXONOMY.md §16` (one colour map, used for every chip/blob/dot/badge).

## Assets
- `uploads/` — brand asset used by the prototype.
- Icons/illustrations in the prototype are glyph/placeholder stand-ins (image-slots). Use the codebase's existing icon set and the hub's real illustrations in production.

## Files in this bundle
- `CCM Hub Redesign.dc.html` — the clickable prototype (open in a browser).
- `support.js`, `image-slot.js`, `uploads/` — needed for the prototype to run; **not** for production.
- `SPEC.md`, `WIREFRAMES.md`, `FLOWS.md`, `SANITY_SCHEMA.md`, `TAXONOMY.md`, `STATES_AND_COPY.md` — the specification set.
- `design-notes.md` — early research notes (background context only; superseded by the specs above — don't build from it).

> A developer who wasn't in the original conversation can implement the redesign from these files alone: prototype for look & feel, the six markdown specs for structure, data, behaviour and copy.
