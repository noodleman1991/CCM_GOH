# Connecting Climate Minds Hub — Design & Structure Notes

> Working reference for designs in this project. Built from study of hub.connectingclimateminds.org (June 2026).
> **Open item:** exact font families, hex colors, and illustration style still need confirmation from screenshots — see end.

## What it is
A Wellcome-funded digital platform (hosted by Imperial College London's **Climate Cares Centre**) that unites
**mental health** and **climate change** research & action. Built from dialogues with **960+ experts across 90 countries**.
Two core aims: (1) an aligned, inclusive **Global Research & Action Agenda** grounded in lived experience;
(2) **connected communities of practice** in **7 global regions**.

Tone: warm, hopeful, human, globally inclusive. Soft illustrated imagery. Mission-driven, not corporate.

## Information architecture

### Top navigation
- **Research & Action** (dropdown / section hub)
- **Lived Experiences**
- **Regional Communities** (dropdown)
- **Collaborate**
- **News**
- **About**
- **Feedback**
- Language switcher (EN; site also serves AR / ES / FR content)
- "Toggle Sidebar" control (collapsible left sidebar nav pattern)
- Auth: **Sign up / Create an Account**

### Home page sections (in order)
1. Hero — welcome headline + "View our Research" CTA + large illustration
2. Global Agenda promo — "Prioritizing Global Research and Action…" + "Read the Global Agenda"
3. "Your collaborative space…" + "Create an Account" + illustration
4. **Catalysing interdisciplinary research** — 6 output cards:
   Agendas for amplified-impact populations · Regional Agendas · Global Agenda · Impact Reports · Toolkits · Case Studies
5. "Stories of grief, resilience, and hope" — Lived Experiences intro
6. **Regional communities** — 7 region cards (links to /communities/<slug>)
7. "Facilitating meaningful connection" — Collaborate promo
8. **Latest news** — news cards (title, dek, summary, date, author)
9. Funder strip — "Funded by Wellcome, hosted by Climate Cares Centre"
10. "What do we mean by mental health?" — definitional explainer w/ bullet list
11. "Who is involved" — large **partner logo wall** (~22 orgs, repeated marquee)

### Research & Action → All Outputs page
Long structured catalogue. Pattern repeats: **section header + intro paragraph + header illustration**, then a grid of **output cards**.
- **Global Agenda**: featured cards (⭐ Featured badge), multi-language download chips (e.g. `English (38.8 MB)`, `العربية`, `Español`, `Français`), plus link-cards to Accessible Reader (reader.connectingclimateminds.org) and a 1-minute explainer video.
- **Regional Agendas**: intro, then "Agendas summary" grid (7 regions) + "Agendas" grid (7 regions, full docs).
- **Agendas for populations facing amplified climate mental-health impacts**: Youth (incl. a **Youth Declaration**), Indigenous Communities, Small Farmers & Fisher Peoples — each a sub-section with summary + full agenda.

**Output card anatomy:** thumbnail image · category tag (`Research Agenda` / `Other`) · optional `⭐ Featured` · title (H3) · short subtitle · 1–2 sentence description · "Available in N language(s)" · language download chips with file sizes.

Other Research & Action sub-pages: **Global Agenda**, **Regional Agendas**, **Impact Reports**, **Toolkits**, **Case Studies**.

### The 7 regional communities (/communities/<slug>)
sub-saharan-africa · northern-africa-and-western-asia · central-and-southern-asia ·
eastern-and-south-eastern-asia · latin-america-and-the-caribbean · oceania · europe-and-northern-america
(SDG regional groupings.) Each is a "Regional Community of Practice".

### Regional community page (/communities/<slug>) — anatomy
1. Hero — "Welcome to the [Region] regional community of practice" + intro + wide photo
2. "Why join our regional community?" — 3 bullets + **Get Involved** CTA + illustration
3. **Regional research & action agenda** — output cards (full + summary, with year + language chips)
4. **Case studies from across the region** — case-study cards (image, tag, title, description, date, author)
5. **Lived experience insights** — YouTube video cards (thumb, title, "CCM Community", date)
6. **The regional team** — people cards (photo, name, role; Convenor / Co-Convenor / Youth Ambassador / Lived Experience Advisory Group)
7. Partner-logo strip

### Collaborate page
**Auth-gated** — renders empty to the public (members-only space). This is the prime area to reimagine: messaging, workspaces, file-annotation threads, find-collaborators.

### About page
"The Journey of Connecting Climate Minds" → project story → "Connecting Climate Minds Project" (mission: Connection)
→ "Connecting Climate Minds Hub" (the platform) + Create Account CTA → "Who is involved" partner wall.

## Recurring layout patterns / components
- Collapsible **left sidebar** + top nav.
- **Section header block**: big H1/H2 + 1–2 intro paragraphs + wide header illustration.
- **Card grids**: output cards, region cards, news cards.
- **Language download chips** with file sizes.
- **Category tag** + **Featured** badge on cards.
- **Partner logo marquee** (logos on circular/square white tiles).
- Soft, friendly **spot illustrations** anchoring most major sections.
- Primary CTAs as buttons ("Read the Global Agenda", "Create an Account", "View …").

## Tech (for fidelity, not to copy)
Next.js front end + **Sanity** CMS (images via cdn.sanity.io, served through Next image optimizer).
Multilingual routing (`/en/...`). Separate "Accessible Reader" app at reader.connectingclimateminds.org.

## ⚠ Still to confirm visually (need screenshots)
- **Typography**: heading + body font families, weights, scale.
- **Color palette**: exact background tone, primary/accent colors, button colors, tag/badge colors.
- **Illustration style**: line vs. flat, palette, motifs.
- **Spacing/radius/shadow**: card corner radius, shadow depth, density.
