# Detailed Content Audit - What We Have vs. What We're Missing

**Generated:** October 7, 2025
**Status:** Honest assessment of scraped data

---

## ✅ What We SUCCESSFULLY Scraped:

### 1. **Full HTML Content** (YES ✅)
- All 29 pages downloaded with complete rendered HTML
- All Plasmic components and structure preserved
- All CSS classes and styling information included
- Total: 231KB for homepage alone

### 2. **Image URLs** (YES ✅)
- 763 unique image URLs extracted
- All image paths catalogued (e.g., `/plasmic/dev_goh/images/...`)
- Image dimensions in some cases (from SVG placeholders)

### 3. **PDF Links** (YES ✅)
- 59 PDF download URLs extracted
- Includes multilingual PDFs (EN, ES, FR, PT, AR)
- Full Supabase storage URLs preserved

### 4. **Page Metadata** (YES ✅)
- Titles
- Meta descriptions
- URLs/slugs
- Basic structure

---

## ❌ What We DID NOT Extract (Yet):

### 1. **Detailed Component Descriptions** (NO ❌)

**Example - Research Agendas Grid:**
- The HTML contains: `<div class="plasmic...">Research Agendas</div>`
- **BUT** the descriptive text like "Explore our rich repository of co-created research..." is EMBEDDED in the HTML
- **Status:** We have the RAW HTML but have NOT parsed it into structured text fields

**What this means:**
- We need a Phase 2 script to:
  - Parse HTML → Extract text content
  - Map text to Sanity Portable Text format
  - Identify which text belongs to which component field

### 2. **Organizations & People Data** (PARTIAL ⚠️)

**What we have:**
- Mentions of organizations in text (e.g., "University of the West Indies")
- Team member names visible in HTML

**What we DON'T have:**
- Structured organization documents
- Individual person/author documents
- Affiliations mapped to `organization` schema
- Contact details, roles, biographies

**Why:**
- This data might be in the Strapi CMS (case studies section - which you excluded)
- OR it needs to be manually created
- OR extracted from additional pages we didn't scrape

### 3. **Multilingual Content** (NO ❌)

**Reality check:**
- The scraped pages are **English only**
- PDFs are multilingual (EN, ES, FR, PT, AR)
- But page content (titles, descriptions, body text) = English only

**Questions:**
- Do multilingual versions exist at different URLs? (e.g., `/es/`, `/fr/`)
- Or is translation done in Sanity CMS only?
- Should we scrape other language versions?

### 4. **Regional Community Metadata** (PARTIAL ⚠️)

**What we HAVE:**
- Regional community page content
- Names (e.g., "Latin America and the Caribbean")
- Welcome text, descriptions
- Images

**What we DON'T HAVE:**
- `boundaries` (geographic coordinates) - Need manual entry or GeoJSON source
- `members` array with structured person references
- `contact` details (email, org) - Visible in text but not structured
- Active/inactive status
- Member count (might be visible in HTML, needs parsing)

---

## 📊 Homepage Schema Matching Analysis:

### Homepage Schema Fields (11 sections):

| # | Schema Field | Type | Scraped? | Status |
|---|--------------|------|----------|--------|
| 1 | `heroWelcome` | hero-1 | ✅ | HTML contains all elements (title, subtitle, image, CTAs) but needs parsing |
| 2 | `globalAgenda` | split-row | ✅ | HTML has heading, content, image, link - needs extraction |
| 3 | `howToUse` | split-row | ✅ | HTML present - needs parsing |
| 4 | `agendasModule` | grid-row | ✅ | Grid items visible in HTML - needs structured extraction |
| 5 | `livedExperiences` | carousel-2 | ⚠️ | References to lived experiences exist, but actual story content might be in Strapi (excluded) |
| 6 | `regionalCommunities` | grid-row | ✅ | All 7 regions present in HTML with images/links |
| 7 | `collaboration` | split-row | ❓ | Need to verify if this section exists on scraped page |
| 8 | `news` | grid-row | ✅ | News items visible in HTML |
| 9 | `projectInfo` | split-row | ❓ | Need to verify |
| 10 | `mentalHealthDefinition` | cta-1 | ❓ | Need to verify |
| 11 | `partnerLogos` | logo-cloud-1 | ✅ | Logo images present in HTML |

**Legend:**
- ✅ = Scraped and identifiable in HTML
- ⚠️ = Partially scraped or might be missing
- ❓ = Need to verify existence
- ❌ = Definitely missing

---

## 📄 Regional Community Page Schema Matching:

### Regional Community Document Schema:

| Field | Have Data? | Notes |
|-------|------------|-------|
| `name` (multilingual) | ⚠️ Partial | Have EN, need ES/FR/AR translations |
| `slug` | ✅ Yes | Extracted from URLs |
| `coverImage` | ✅ Yes | Image URLs extracted |
| `boundaries` | ❌ No | Need manual entry or GeoJSON source |
| `members` | ❌ No | Text mentions exist, but not structured as references |
| `contact` | ⚠️ Partial | Names visible in HTML, emails/orgs need extraction |
| `featured` | ❌ No | Need manual setting |
| `active` | ❌ No | Need manual setting |

### Regional Community Page Schema:

| Field | Have Data? | Notes |
|-------|------------|-------|
| `title` | ✅ Yes | Extracted |
| `slug` | ✅ Yes | Extracted |
| `regionalCommunity` (ref) | ✅ Can create | Based on slug matching |
| `language` | ⚠️ Partial | Only EN scraped |
| `welcomeHero` | ✅ Yes | HTML contains title, description, image - needs parsing |
| `whyJoinCTA` | ✅ Yes | Title, bullet points, image, button all in HTML |
| `regionalAgenda` | ✅ Yes | Title, description, image, multilingual PDF links all present |
| `caseStudiesGrid` | ⚠️ Dynamic | Grid exists but references case studies from Strapi (excluded) |
| `newsGrid` | ⚠️ Dynamic | Grid exists but might reference Strapi news |
| `teamGrid` | ❌ No | Team member references not structured |

---

## 🔍 Specific Example: Research Agendas Grid Description

**Question:** Did we scrape "Explore our rich repository of co-created research..."?

**Answer:** Let me check the actual HTML content...

I need to create a script to extract this. The HTML is there, but it's nested in Plasmic component wrappers.

**Current Status:** Raw HTML = ✅ | Parsed text content = ❌

---

## 📋 What Needs to Happen Next:

### Phase 2A: HTML Content Extraction (Required)
1. **Parser script** to extract text from Plasmic HTML:
   - Strip HTML tags
   - Identify section boundaries
   - Map text to component fields
   - Convert to Portable Text format

2. **Component mapping**:
   - For each homepage section, extract:
     - Titles
     - Descriptions/body text
     - Button text
     - Link URLs

3. **Regional page extraction**:
   - Extract all text content
   - Map to regionalCommunityPage fields

### Phase 2B: Missing Data Sources (Optional/Manual)
1. **Organizations**:
   - Create manually OR
   - Scrape from team/about pages OR
   - Import from external source

2. **People/Authors**:
   - Create manually OR
   - Extract from team sections

3. **Multilingual content**:
   - Check if other language URLs exist
   - OR translate in Sanity
   - OR leave English only

4. **Geographic boundaries**:
   - Manual entry of coordinates
   - OR use default regions
   - OR import GeoJSON

---

## 🎯 Recommendation:

**What I should build next:**

1. **HTML → Structured Content Parser** (Priority 1)
   - Extracts all text from scraped HTML
   - Creates properly formatted content for each field
   - Handles Portable Text conversion
   - **This will answer your question about the "Explore our rich repository..." text**

2. **Content Verifier** (Priority 2)
   - Compares extracted content with schema requirements
   - Identifies missing fields
   - Creates detailed gap report

3. **Manual Entry Template** (Priority 3)
   - CSV/spreadsheet for missing data
   - Organizations list
   - People list
   - Translations needed

**Should I proceed with building the HTML parser to extract the actual text content?**