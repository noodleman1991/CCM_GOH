# Connecting Climate Minds CMS - Editor Guide

Welcome to the Connecting Climate Minds content management system! This guide will help you create and manage content effectively, even if you're not technical. Think of Sanity as your content workshop where you can build pages, write articles, and share stories.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Quick Start Checklist](#quick-start-checklist)
3. [Understanding Content Types](#understanding-content-types)
4. [Block Components Reference](#block-components-reference)
5. [Rich Text Editing](#rich-text-editing)
6. [Working with Multiple Languages](#working-with-multiple-languages)
7. [Metadata, Slugs & SEO](#metadata-slugs--seo)
8. [Workflow Best Practices](#workflow-best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the CMS

Your Sanity Studio is available at: **`/studio`** (on your website domain)

Once logged in, you'll see the main navigation on the left side with different content types organized by category.

### Basic Navigation

- **Left sidebar**: Content types (Pages, Posts, Case Studies, etc.)
- **Center panel**: List of content items
- **Right panel**: Editing area (when you open an item)
- **Publish button**: Top-right corner (must click to make content live!)

---

## Quick Start Checklist

### Creating Your First Page

- [ ] Click "Page" in the left sidebar
- [ ] Click "+ Create" button
- [ ] Choose your language (English recommended first)
- [ ] Fill in the **Title** (this also generates the URL slug)
- [ ] Add a **Hero block** at the top for visual impact
- [ ] Add content blocks (Split Row, Grid Row, etc.) to build your page
- [ ] Fill in **Meta Description** (for Google search results)
- [ ] Preview your page using the preview button
- [ ] Click **Publish** when ready

### Creating Your First Blog Post

- [ ] Click "Post" in the left sidebar
- [ ] Click "+ Create" button
- [ ] Choose your language
- [ ] Fill in **Title**, **Excerpt** (summary), and select an **Author**
- [ ] Add a featured **Image**
- [ ] Write your content in the **Body** field (rich text editor)
- [ ] Add **Categories** and **Tags** for organization
- [ ] Fill in SEO fields (Meta Title, Meta Description)
- [ ] Click **Publish**

---

## Understanding Content Types

Your CMS has different types of content, each designed for specific purposes. Here's when to use each one:

### Pages (Building Blocks Approach)

**What it is**: Flexible pages where you assemble content using building blocks
**When to use**: General pages like "About Us", "Get Involved", "Resources"
**Structure**: Completely customizable - you choose which blocks to add

**Example pages you might create**:
- About the project
- How to participate
- Privacy policy
- Contact information

Think of this like **LEGO blocks** - you pick and arrange the pieces to build your page.

---

### Homepage (Fixed Template)

**What it is**: Your website's front page with pre-defined sections
**When to use**: Only for the main homepage
**Structure**: Fixed sections that you fill in (not customizable order)

**Pre-defined sections**:
1. Welcome Hero - First thing visitors see
2. Global Agenda - Introduce the research topics
3. How to Use - Guide for using the platform
4. Agendas Module - Grid of research agendas
5. Lived Experiences - Carousel of video stories
6. Regional Communities - Grid of communities
7. Collaboration - Partnership information
8. News - Latest updates
9. Project Info - About the project
10. Mental Health Definition - CTA section
11. Partner Logos - Organization partners

You **cannot add, remove, or rearrange** these sections, but you can fill each one with content.

---

### Regional Community Pages (Template or Custom)

**What it is**: Dedicated pages for each regional community
**When to use**: Creating community-specific landing pages
**Special feature**: Toggle between Template Mode or Custom Mode

#### Template Mode (Recommended)
**Best for**: Consistent look across all community pages

Pre-defined sections:
1. **Welcome Hero** - Community introduction
2. **Why Join CTA** - Call-to-action to join
3. **Team Grid** - Community members (can auto-populate from member database)
4. **Agendas Grid** - Research agendas (can auto-filter by community)
5. **News Grid** - Community news (can auto-populate recent or featured)
6. **Case Studies Grid** - Published research
7. **Lived Experiences Carousel** - Video stories
8. **Testimonials** - Member testimonials
9. **Logo Cloud** - Partner organizations

Each section has **Manual** or **Dynamic** modes:
- **Manual**: You handpick each item to display
- **Dynamic**: System automatically shows recent or featured content filtered by the community

#### Custom Mode
**Best for**: Unique community pages that need special layouts

You get full flexibility to add any blocks in any order, just like regular Pages.

---

### Blog Posts (Post)

**What it is**: Traditional blog articles
**When to use**: Reflections, updates, opinion pieces, general articles
**Content type**: Long-form writing with images

**Key fields**:
- Title, Slug (URL), Excerpt (summary)
- Author, Featured Image
- Body (rich text with formatting)
- Categories, Tags (up to 15)
- Related Community (optional link)
- SEO fields

**Example posts**:
- "Reflections from the 2024 Regional Summit"
- "Why Mental Health Matters in Climate Research"
- "Interview with Dr. Smith on Climate Adaptation"

---

### News Posts (News Post)

**What it is**: Newsworthy updates with sources and locations
**When to use**: Announcements, events, external news coverage
**Special features**: Location data, sources, field-level translations

**Different from Blog Posts**:
- Has **location** information (where the news happened)
- Has **sources** (links to original articles, publishers, dates)
- Uses **field-level internationalization** (see translation section)
- Can be marked as **Featured** for homepage

**Key fields**:
- Title, Subtitle, Excerpt (each has language versions)
- Location (map pin + text description)
- Organizations & Projects (related entities)
- Sources (URL, publisher, published date)
- Body (rich styled text)
- Featured flag

**Example news posts**:
- "CCM Launches New Regional Hub in Sub-Saharan Africa"
- "UN Report Highlights Mental Health in Climate Policy"
- "Regional Community Meeting Scheduled for March 2025"

---

### Case Studies (Case Study)

**What it is**: Research publications with review workflow
**When to use**: Sharing research findings, methodologies, or project outcomes
**Special features**: Multi-author support, review process, approval workflow

**Key fields**:
- Title, Excerpt (field-level translations)
- **Multiple authors** with roles (lead, co-author, contributor, advisor)
- Study period (start and end dates)
- Locations (primary location + additional study areas)
- Organizations, Projects, Related Community
- Body (rich styled text)
- **Workflow status**: Pending → Revision → Approved/Rejected

**Author roles explained**:
- **Lead Author**: Primary researcher, main contact
- **Co-Author**: Significant contribution to research
- **Contributor**: Provided input or support
- **Advisor**: Guided or supervised the research

**Workflow states**:
1. **Pending**: Just submitted, awaiting review
2. **Revision Requested**: Needs changes before approval
3. **Rejected**: Not suitable for publication
4. **Approved**: Ready to be published (only approved cases show on site)

**Review process**:
- Reviewers can add **review notes** with feedback
- System tracks **who reviewed** and **when**
- Authors can see feedback and make revisions
- Only **approved** case studies appear on the public website

**Example case studies**:
- "Community-Based Climate Adaptation in Coastal Kenya"
- "Mental Health Impacts of Extreme Weather Events: A 2-Year Study"
- "Youth Engagement in Climate Action Across Latin America"

---

### Lived Experiences (Lived Experience)

**What it is**: Personal video stories
**When to use**: Sharing first-person accounts, community voices, video testimonials
**Format**: Video-focused content (requires video URL)

**Key fields**:
- Title, Description (field-level translations)
- **Video Link** (required - YouTube, Vimeo, etc.)
- Thumbnail image (optional, for preview)
- Duration (e.g., "3:45")
- Author, Related Community
- Organizations, Projects, Tags (up to 10)
- Featured flag

**Example lived experiences**:
- "María's Story: Adapting to Drought in Southern Spain"
- "Youth Activist on Climate Anxiety and Hope"
- "Community Leader Shares Local Climate Solutions"

---

### Support Content Types

These are supporting documents that you reference in your main content:

- **Authors**: Contributor profiles (name, bio, photo, affiliation)
- **Categories**: Post categories (e.g., "Research", "Community", "Policy")
- **Tags**: Keywords for content (e.g., "adaptation", "youth", "agriculture")
- **FAQs**: Frequently asked questions
- **Testimonials**: Member testimonials
- **Regional Communities**: Community definitions (regions, descriptions)
- **Organizations**: Partner organizations
- **Projects**: Research projects
- **Agendas**: Research agenda items

Create these first, then reference them when creating pages and posts.

---

## Block Components Reference

When building **Pages** or **Regional Community Pages (custom mode)**, you'll add content using **blocks**. Each block serves a specific purpose and layout style.

### Visual Layout Patterns

```
HERO BLOCK
┌─────────────────────────────────────────────────┐
│  ┌──────────┐                                   │
│  │          │  Large Title                      │
│  │  Image   │  Body text description here       │
│  │          │  [Button] [Button]                │
│  └──────────┘                                   │
└─────────────────────────────────────────────────┘
Use at: Top of pages for visual impact
```

```
SPLIT ROW (2 columns)
┌───────────────────┬────────────────────┐
│                   │                    │
│  Content          │  Content           │
│  (text, cards,    │  (text, image,     │
│   or image)       │   cards, or info)  │
│                   │                    │
└───────────────────┴────────────────────┘
Use for: Side-by-side comparisons, text + image layouts
```

```
GRID ROW (2-5 columns)
┌──────────┬──────────┬──────────┬──────────┐
│  Card    │  Card    │  Card    │  Card    │
│          │          │          │          │
└──────────┴──────────┴──────────┴──────────┘
Use for: Multiple items, blog post lists, features
```

```
CAROUSEL
┌─────────────────────────────────────────────────┐
│   ◄    [Image/Card]  [Image/Card]    ►        │
│                ○ ● ○ ○                         │
└─────────────────────────────────────────────────┘
Use for: Image galleries, multiple stories, testimonials
```

### Block Component Guide

#### Hero Blocks (hero-1, hero-2)

**Purpose**: Make a strong first impression at the top of pages
**Best for**: Page headers, campaign launches, important announcements

**What you can include**:
- Tag line (small text above title)
- Large title (main heading)
- Body text (description/explanation)
- Image (visual element)
- Up to 2 buttons/links
- Background styling options
- Image position (left or right side)

**When to use**:
- Top of landing pages
- Campaign or initiative launches
- Important announcements
- Section introductions

**Tips**:
- Keep titles short and impactful (under 60 characters)
- Use high-quality images (at least 1200px wide)
- Limit to 1-2 buttons (too many = confusing)

---

#### Split Row

**Purpose**: Create two-column layouts for side-by-side content
**Best for**: Feature explanations, text with supporting images, comparisons

**Column types you can mix**:
1. **Content Column**: Text with tagline, title, description, and optional link
2. **Cards List**: Multiple small cards in one column
3. **Image**: Single large image
4. **Info List**: Bullet points or key information items

**Layout options**:
- Image on left or right
- No gap between columns (full bleed)
- Color variants for styling
- Padding adjustments

**Example combinations**:
- Text (left) + Image (right) = Classic feature explanation
- Image (left) + Cards List (right) = Visual with supporting points
- Content (left) + Info List (right) = Details with key facts

**When to use**:
- Explaining features with visuals
- "How it works" sections
- Team introductions with photos
- Before/after comparisons

**Tips**:
- Balance text length between columns
- Use images that complement (not repeat) the text
- Keep card lists to 3-4 items maximum per column

---

#### Grid Row

**Purpose**: Display multiple items in a card grid layout
**Best for**: Blog post lists, team members, features, resources

**Grid options**:
- 2-5 columns (adjustable)
- Card variants: Classic (3:2 ratio) or Wide (16:9 ratio)

**Card types**:
1. **Generic Card**: Custom title, excerpt, image, link
2. **Post Card**: Automatically pulls from a blog post
3. **Agenda Card**: Links to a research agenda
4. **Case Study Card**: Links to a case study
5. **News Card**: Links to a news post
6. **Lived Experience Card**: Links to a video story

**Options**:
- Section title and description
- Background color
- Padding adjustments
- Number of columns (2-5)

**When to use**:
- Latest blog posts section
- Team member directory
- Resource libraries
- Feature highlights
- Partner showcases

**Tips**:
- Use 3 columns for balanced layouts on most screens
- Keep card titles consistent in length
- Use high-quality images (all same dimensions)
- Don't exceed 8-12 cards per grid (use pagination for more)

---

#### Carousel Blocks (carousel-1, carousel-2)

**Purpose**: Showcase multiple images or items in a sliding format
**Best for**: Photo galleries, testimonials, success stories

**Display options**:
- Show 1, 2, or 3 items at a time
- Indicator styles: dots, count, or none
- Card variants: classic or wide format
- Auto-advance or manual navigation

**When to use**:
- Photo galleries from events
- Multiple testimonials
- Story showcases
- Partner highlights
- Before/after sequences

**Tips**:
- Use 3-7 items (too few = not worth carousel, too many = overwhelming)
- Keep all images the same dimensions
- Write descriptive alt text for accessibility
- Test on mobile (carousels can be tricky on small screens)

---

#### Call-to-Action (CTA-1)

**Purpose**: Encourage visitors to take specific actions
**Best for**: Sign-ups, downloads, contact prompts

**What you can include**:
- Tag line (small text above)
- Title (main message)
- Body text (explanation)
- Up to 2 buttons/links
- Background styling
- Alignment options

**When to use**:
- Newsletter sign-up prompts
- "Get Involved" sections
- Download research reports
- Join community invitations
- Contact us prompts

**Tips**:
- Use action-oriented language ("Join Now", "Download Report")
- Keep it concise (visitors should understand in 3 seconds)
- Use contrasting colors to stand out
- Place strategically (middle or end of pages)

---

#### Section Header

**Purpose**: Organize page content with clear headings
**Best for**: Breaking up long pages, introducing new sections

**What you can include**:
- Title (main heading)
- Description (optional subtitle/explanation)
- Alignment options (left, center, right)

**When to use**:
- Before major content sections
- To break up long pages
- When changing topics
- To improve scannability

**Tips**:
- Use hierarchically (follow logical order)
- Keep titles short (under 50 characters)
- Use sparingly (too many = cluttered)

---

#### Timeline Row

**Purpose**: Display chronological information or processes
**Best for**: Project history, process steps, event sequences

**When to use**:
- Project milestones
- Historical overviews
- Step-by-step processes
- Event schedules
- Program timelines

**Tips**:
- Keep entries concise (3-7 items ideal)
- Use consistent date formats
- Include brief descriptions for each point

---

#### FAQs Block

**Purpose**: Answer common questions in an organized format
**Best for**: Reducing support questions, providing clarity

**When to use**:
- About pages
- Program information pages
- Help/support sections
- Onboarding pages

**Tips**:
- Group related questions together
- Keep answers concise (2-3 sentences)
- Link to detailed pages if needed
- Order by most common questions first

---

#### Logo Cloud

**Purpose**: Display partner or sponsor logos
**Best for**: Showing organizational partnerships, credibility

**When to use**:
- Partner sections
- Funder acknowledgments
- Bottom of pages
- About pages

**Tips**:
- Use consistent logo sizes
- Ensure logos have transparent backgrounds
- Arrange in visual balance (not strict grid)
- Link logos to partner websites

---

#### Newsletter Form

**Purpose**: Collect email subscriptions
**Best for**: Building your email list

**When to use**:
- Bottom of blog posts
- Dedicated subscription pages
- Homepage
- Resource download pages

**Tips**:
- Keep form fields minimal (email only is best)
- Clear value proposition ("Get monthly updates")
- Privacy note (what you'll do with emails)
- Thank you message after submission

---

#### All Posts Block

**Purpose**: Display paginated list of all blog posts
**Best for**: Blog index pages, archive pages

**When to use**:
- Main blog listing page
- Category pages
- Archive pages

**Tips**:
- Combine with filters (categories, tags)
- Set reasonable pagination (10-20 per page)
- Include search functionality if you have many posts

---

### Special Blocks for Rich Text

These blocks appear **within** your text editor (in Post body, Case Study body, etc.):

#### Info Box
**Purpose**: Highlight important information within text
**Appears as**: Colored box with icon
**Use for**: Key takeaways, warnings, tips, definitions

```
┌─────────────────────────────────────┐
│ ℹ️  Important Note                  │
│                                     │
│ This is emphasized information      │
│ that stands out from regular text   │
└─────────────────────────────────────┘
```

#### Break/Separator
**Purpose**: Visual divider between content sections
**Appears as**: Horizontal line or spacing
**Use for**: Topic transitions, breaking up long text

---

## Rich Text Editing

When writing content in **Posts**, **News Posts**, or **Case Studies**, you'll use the rich text editor. Your CMS has two types:

### Basic Block Content
Used in: Regular **Posts**

**Formatting options**:
- Headings: H1, H2, H3, H4
- Text styles: Bold, Italic
- Lists: Bullet points, Numbered lists
- Links: URL links to external sites
- Blockquotes: For quotations

**Embeds**:
- Images (with alt text for accessibility)
- YouTube videos (paste video ID)
- Code blocks (17 programming languages)

**When to use**: Regular blog posts, simple articles

---

### Styled Block Content (Enhanced)
Used in: **News Posts** and **Case Studies**

**Everything from Basic, plus**:

**Additional text styles**:
- Lead text (larger intro paragraph)
- Caption (small text under images)
- Sidebar note (offset information)
- CTA style (call-to-action text)

**Additional marks**:
- Underline
- Strike-through
- Highlight (yellow background)

**Enhanced links**:
- Internal links (link to other posts/pages/case studies)
- External links with "open in new tab" option

**Enhanced embeds**:
- Images with internationalized captions (captions in multiple languages)
- YouTube videos with internationalized captions

**Special blocks**:
- Info boxes (highlighted important information)
- Break/separator (visual divider)
- Code blocks with filename labels

**When to use**: Research case studies, news articles, content requiring richer formatting

---

### Rich Text Best Practices

1. **Headings hierarchy**
   - Use H2 for main sections
   - Use H3 for subsections
   - Use H4 for minor subsections
   - Don't skip levels (H2 → H4 is confusing)

2. **Links**
   - Write descriptive link text ("Read the full report" not "Click here")
   - Use internal links to connect related content
   - Open external links in new tab (keeps visitors on your site)

3. **Images**
   - Always add alt text (describes image for screen readers)
   - Keep images under 2MB for fast loading
   - Use meaningful captions when helpful
   - Place images near related text

4. **Lists**
   - Use bullet points for unordered items
   - Use numbered lists for sequential steps
   - Keep list items parallel in structure
   - Don't exceed 7-10 items per list

5. **Formatting**
   - Use bold for emphasis (sparingly)
   - Use italic for terms, titles, slight emphasis
   - Avoid underlining (confusing with links)
   - Use blockquotes for actual quotations

---

## Working with Multiple Languages

Your CMS supports content in **four languages**: English (EN), Spanish (ES), French (FR), and Arabic (AR).

There are **two different systems** for managing translations:

### System 1: Document-Level Internationalization

**Used by**: Most content (Pages, Posts, Homepage, Regional Community Pages)

**How it works**: You create **separate documents** for each language, and the system links them together.

**Visual explanation**:
```
English Document          Spanish Document         French Document
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ Title: About │ ←────→  │ Title: Acerca│ ←────→  │ Title: À     │
│ Language: EN │         │ Language: ES │         │ Language: FR │
│ Content: ... │         │ Content: ... │         │ Content: ... │
└──────────────┘         └──────────────┘         └──────────────┘
    (Linked translations managed by CMS)
```

**Workflow**:
1. Create your content in **English first** (recommended)
2. Fill in all fields completely
3. Preview and test
4. Publish the English version
5. Create translations:
   - In the document, look for the language/translation menu
   - Click "Create translation" and select language (ES, FR, or AR)
   - A new document opens with the same structure
   - Translate all fields into the new language
   - Publish the translation

**Important notes**:
- Each language version has its own **slug** (URL)
- Each must be **published separately**
- Visitors automatically see their language (based on browser settings)
- You can link between language versions manually if needed

**Example**:
- English page: `yoursite.com/en/about`
- Spanish page: `yoursite.com/es/acerca`
- French page: `yoursite.com/fr/a-propos`

---

### System 2: Field-Level Internationalization

**Used by**: News Posts, Case Studies, Lived Experiences

**How it works**: You create **one document** with fields that contain all language versions.

**Visual explanation**:
```
Single Document
┌─────────────────────────────────────────────┐
│ Title:                                      │
│   ├─ EN: "New Initiative Launched"          │
│   ├─ ES: "Nueva iniciativa lanzada"         │
│   ├─ FR: "Nouvelle initiative lancée"       │
│   └─ AR: "إطلاق مبادرة جديدة"               │
│                                             │
│ Content: (same structure for body)         │
└─────────────────────────────────────────────┘
```

**Workflow**:
1. Create **one document**
2. For each translatable field (Title, Excerpt, Description), you'll see **language tabs** or **language fields**:
   - English (EN)
   - Spanish (ES)
   - French (FR)
   - Arabic (AR)
3. Fill in the **English version first**
4. Then fill in each other language
5. **Publish once** - all languages go live together

**Important notes**:
- Visitors see content in their preferred language automatically
- All translations managed in one place
- **Must fill in all languages** before publishing (or leave empty gracefully)
- More efficient for content with frequent updates
- One URL serves all languages

**Example**:
- Single URL: `yoursite.com/news/new-initiative`
- Content adapts based on visitor's language preference

---

### Which System Does My Content Use?

| Content Type | Translation System | Create Separate Docs? |
|--------------|-------------------|----------------------|
| **Pages** | Document-level | Yes (one per language) |
| **Homepage** | Document-level | Yes (one per language) |
| **Regional Community Pages** | Document-level | Yes (one per language) |
| **Posts** | Document-level | Yes (one per language) |
| **News Posts** | **Field-level** | **No (one doc, all languages)** |
| **Case Studies** | **Field-level** | **No (one doc, all languages)** |
| **Lived Experiences** | **Field-level** | **No (one doc, all languages)** |

---

### Best Practices for Translations

1. **Always complete English first**
   - Easier to maintain as your default
   - Helps translators understand intent
   - Allows you to publish and test before translating

2. **Be consistent**
   - Use same terminology across languages
   - Keep formatting consistent
   - Match image selections across versions

3. **Cultural adaptation**
   - Don't just translate word-for-word
   - Adapt examples and references for local audiences
   - Consider cultural sensitivities

4. **Arabic (RTL) considerations**
   - Text flows right-to-left automatically
   - Images may need mirroring for context
   - Test layouts carefully

5. **Field-level translations**
   - Fill in all language versions before publishing
   - If a translation isn't ready, use English as placeholder
   - Update all languages together to keep content synchronized

6. **Document-level translations**
   - Publish English first to test functionality
   - Create translations only when ready
   - Keep slugs logical (e.g., "about" → "acerca" → "a-propos")

---

## Metadata, Slugs & SEO

These fields help people find your content through search engines (like Google) and social media.

### Slugs (URLs)

**What it is**: The readable part of your page URL
**Example**: `yoursite.com/blog/`**`climate-mental-health`** ← this is the slug

**How it works**:
- Automatically generated from your **Title** when you first save
- You can edit it manually
- Must be unique (no two pages can have the same slug)
- Lowercase with hyphens (not spaces or special characters)

**Best practices**:
- Keep it short (under 60 characters)
- Include keywords (good for SEO)
- Use hyphens, not underscores
- Avoid numbers or dates (unless necessary)
- Make it readable (people should understand what the page is about)

**Good slugs**:
- `about-our-mission`
- `join-regional-community`
- `climate-adaptation-case-study`

**Bad slugs**:
- `page-1` (not descriptive)
- `this_is_a_very_long_page_title_about_climate_change_and_mental_health` (too long, underscores)
- `pg123` (meaningless)

**Multilingual slugs**:
- English: `about-us`
- Spanish: `acerca-de-nosotros`
- French: `a-propos-de-nous`
- Arabic: `من-نحن` (RTL)

---

### Page Titles

**What it is**: The main title of your page/post
**Appears**: Browser tab, search results, social media shares

**Best practices**:
- Keep it under 60 characters (Google truncates longer titles)
- Front-load important keywords
- Make it compelling (encourages clicks)
- Accurately describe the page content
- Unique for each page

**Examples**:
- "Join Our Regional Community - Connecting Climate Minds"
- "Climate Adaptation in Coastal Regions - New Case Study"
- "Mental Health and Climate Change: What You Need to Know"

---

### Meta Description

**What it is**: Short summary of your page (appears under the title in search results)
**Character limit**: 150-160 characters (Google truncates longer descriptions)

**Best practices**:
- Write a compelling summary (encourages clicks)
- Include your main keyword naturally
- Make it actionable ("Learn how...", "Discover...")
- Unique for each page
- Don't stuff keywords

**Good example**:
> "Discover how communities in Kenya are adapting to climate change while supporting mental health. Read our latest research case study."

**Bad example**:
> "Climate change mental health Kenya adaptation community research psychology climate crisis mental health climate change..." ← keyword stuffing

---

### SEO Image (ogImage)

**What it is**: Image that appears when your page is shared on social media (Facebook, Twitter, LinkedIn)
**Dimensions**: 1200 x 630 pixels (specific size for optimal display)
**Format**: JPG or PNG

**Best practices**:
- Use high-quality images
- Include text overlay if needed (keep it readable)
- Test how it looks on different platforms
- Avoid images with small text (hard to read when resized)

---

### NoIndex Flag

**What it is**: Tells search engines NOT to show this page in search results
**When to use**:
- Thank you pages
- Internal testing pages
- Draft content
- Pages behind login
- Duplicate content

**Default**: OFF (pages are indexed by default)

---

### SEO Checklist for Every Page

Before publishing, check:
- [ ] Title is descriptive and under 60 characters
- [ ] Slug is readable and includes main keyword
- [ ] Meta description is compelling (150-160 characters)
- [ ] Featured image is high-quality and relevant
- [ ] OG image is 1200x630px
- [ ] NoIndex is OFF (unless intentionally hidden)
- [ ] Internal links to related content
- [ ] All images have alt text
- [ ] Content is at least 300 words (for articles)

---

## Workflow Best Practices

### General Content Creation Workflow

1. **Plan first**
   - Outline your content structure
   - Gather images, data, sources
   - Identify related content to link

2. **Create in English first**
   - Complete all fields
   - Add all media
   - Fill in SEO fields
   - Preview and test

3. **Review and edit**
   - Check spelling and grammar
   - Verify links work
   - Test on mobile preview
   - Ensure images load properly

4. **Publish**
   - Click Publish button
   - Verify live page looks correct
   - Share on social media if appropriate

5. **Translate**
   - Create language versions
   - Translate all fields
   - Adapt content for cultural context
   - Publish each translation

6. **Maintain**
   - Update content when outdated
   - Fix broken links
   - Refresh images if needed
   - Monitor page performance

---

### Case Study Workflow (With Review)

Case studies have a special review process:

**Step 1: Submission (Author)**
- Create new Case Study document
- Fill in all required fields (title, authors, study period, locations, body)
- Add organizations, projects, communities
- Set status to **Pending** (default)
- Click Save (not Publish yet)

**Step 2: Review (Reviewer)**
- Reviewer opens the case study
- Reviews content for accuracy, quality, completeness
- Options:
  - **Approve**: Case study is ready for publication
  - **Request Revision**: Needs changes (add review notes with feedback)
  - **Reject**: Not suitable for publication (add reason)

**Step 3: Revision (Author, if needed)**
- Author receives notification of review status
- Reads review notes
- Makes requested changes
- Sets status back to **Pending** for re-review

**Step 4: Publication**
- Once **Approved**, case study can be published
- Only approved case studies appear on the public website
- Author clicks Publish

**Visual workflow**:
```
Create Draft → Pending Review → Revision Requested → Revised → Approved → Published
                    ↓                                          ↓
                Rejected ✗                              (Visible on site)
```

**Tips for authors**:
- Be thorough in initial submission (reduces revision rounds)
- Include all necessary data (locations, dates, authors with roles)
- Write clear, accessible language
- Respond promptly to revision requests

**Tips for reviewers**:
- Provide specific, actionable feedback
- Be constructive and supportive
- Check for completeness (all required fields filled)
- Verify accuracy of locations, dates, author roles
- Consider content quality and relevance

---

### Using Dynamic vs Manual Content

In **Regional Community Pages (template mode)** and **Dynamic Content Inserts**, you can choose:

#### Manual Mode
**What it is**: You hand-pick each item to display
**Best for**:
- Curated collections
- Specific featured content
- When you want exact control
- Highlighting specific items

**How to use**:
1. Select "Manual" mode
2. Click "Add" for each item
3. Search for and select specific posts/case studies/news
4. Arrange in preferred order
5. Set how many to display

**Pros**:
- Complete control
- Consistent quality
- Strategic highlighting

**Cons**:
- Requires manual updates
- Can become outdated
- More time-consuming

---

#### Dynamic Mode
**What it is**: System automatically shows content based on rules
**Best for**:
- Keeping content fresh
- "Latest News" sections
- Community-specific filtering
- Automated updates

**Options**:
- **Dynamic - Recent**: Shows most recently published items
- **Dynamic - Featured**: Shows items marked as "Featured"

**How to use**:
1. Select "Dynamic" mode
2. Choose "Recent" or "Featured"
3. System automatically filters by related community (if applicable)
4. Set how many items to show
5. Content updates automatically when new items are published

**Pros**:
- Always current
- Saves time
- Automatically filtered by community

**Cons**:
- Less control over exact items
- Quality depends on what's published
- May show unintended content

---

**When to use each**:

| Section | Recommended Mode | Why |
|---------|------------------|-----|
| Welcome Hero | Manual | Need specific, curated introduction |
| Team Grid | Dynamic (if many members) / Manual (if small team) | Keep team current or control presentation |
| Agendas Grid | Dynamic - Featured | Highlight important research areas |
| News Grid | Dynamic - Recent | Show latest updates automatically |
| Case Studies | Dynamic - Featured | Showcase approved research |
| Lived Experiences | Manual | Curate specific stories with impact |
| Testimonials | Manual | Control messaging and representation |

---

### Tips for Efficient Editing

1. **Use the preview function**
   - Always preview before publishing
   - Check on mobile view
   - Test all links and videos

2. **Save frequently**
   - CMS auto-saves, but manual saves are safer
   - Save before switching tabs
   - Save before long edits

3. **Use duplicate feature**
   - Create templates by duplicating similar pages
   - Saves time on repeated structures
   - Maintain consistency

4. **Organize with categories and tags**
   - Set up categories before creating posts
   - Use consistent tagging (don't create duplicates)
   - Limit tags to 5-10 per post (avoid tag spam)

5. **Schedule content**
   - Prepare content in advance
   - Use scheduled publishing (if available)
   - Create drafts for future events

6. **Batch similar tasks**
   - Update multiple posts at once
   - Create all translations together
   - Upload multiple images at once

7. **Use references wisely**
   - Create authors, organizations, projects first
   - Reference them consistently
   - Update references in one place (applies everywhere)

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Slug is not unique"

**Problem**: You're trying to use a URL slug that already exists
**Solution**:
1. Check existing pages for slug conflicts
2. Modify your slug slightly (add a word or number)
3. For translations, ensure each language has unique slug
4. Search for the slug in CMS to find the conflict

**Example**:
- Existing: `about-us`
- New: `about-us-2` or `about-our-team`

---

#### Issue: "Required field missing"

**Problem**: You can't publish because a required field is empty
**Solution**:
1. Look for red highlights or asterisks (*) marking required fields
2. Scroll through entire form (sometimes fields are below the fold)
3. Common required fields:
   - Title
   - Slug
   - Language (usually auto-filled)
   - Featured image (some content types)
   - Body/content

---

#### Issue: Image won't upload

**Problem**: Image upload fails or spins forever
**Common causes**:
- File too large (over 5-10MB)
- Wrong file format
- Network issues
- Browser issues

**Solutions**:
1. Compress image before uploading (use tinypng.com or similar)
2. Ensure format is JPG, PNG, or WebP
3. Check file name (avoid special characters, use hyphens)
4. Try different browser (Chrome, Firefox, Safari)
5. Check internet connection
6. Refresh page and try again

---

#### Issue: Video embed not working

**Problem**: YouTube video doesn't show in preview
**Solutions**:
1. For block-content: Use video ID only (not full URL)
   - URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - Video ID: `dQw4w9WgXcQ` ← use this
2. Check video is public (not private or unlisted)
3. Verify YouTube link is correct
4. Try copying link from YouTube's "Share" button

---

#### Issue: "Can't find my saved content"

**Problem**: Content seems to disappear
**Solutions**:
1. Check if you're in the right language (document-level i18n)
2. Use the search function in CMS
3. Check draft vs published filter
4. Look in correct content type (Posts vs News Posts vs Case Studies)
5. Check if another editor moved or deleted it
6. Look in archive/trash (if available)

---

#### Issue: Translation not linking correctly

**Problem**: Language versions aren't connected
**Solutions**:
1. For **document-level i18n**:
   - Use the "Create translation" button (don't manually create)
   - Ensure language field is set correctly
   - Check translation references in document metadata
2. For **field-level i18n**:
   - This doesn't apply (single document)
   - Ensure all language tabs are filled

---

#### Issue: Page looks different than expected

**Problem**: Published page doesn't match preview
**Solutions**:
1. Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)
2. Check if changes were actually published (click Publish button)
3. Wait a moment (sometimes takes 10-30 seconds to deploy)
4. Verify correct content is in correct blocks
5. Check block settings (padding, background, etc.)

---

#### Issue: Can't publish (button grayed out)

**Problem**: Publish button is disabled
**Common causes**:
- Missing required fields
- Validation errors
- Duplicate slug
- No changes made
- Insufficient permissions

**Solutions**:
1. Scroll through form looking for error messages (usually red text)
2. Check all required fields are filled
3. Verify slug is unique
4. Make sure you've made changes to save
5. Contact admin if permissions issue

---

#### Issue: Rich text editor not responding

**Problem**: Can't type or format text in body editor
**Solutions**:
1. Click directly in the text area
2. Refresh the page (save first!)
3. Try different browser
4. Clear browser cache
5. Check for JavaScript errors (open browser console)

---

#### Issue: Case study won't show on website

**Problem**: Published case study isn't visible
**Likely cause**: Not yet approved
**Solution**:
1. Check **workflow status** - must be "Approved"
2. If "Pending", wait for review
3. If "Revision Requested", make changes and resubmit
4. Only approved case studies are publicly visible
5. Contact reviewer for status update

---

#### Issue: Search isn't finding my page

**Problem**: Published page doesn't appear in Google search
**Solutions**:
1. Check **NoIndex** flag - should be OFF for searchable pages
2. Be patient - can take days/weeks for Google to index
3. Verify page is actually published (not draft)
4. Check meta title and description are filled
5. Ensure content is substantial (at least 300 words)
6. Submit sitemap to Google Search Console

---

### Getting Help

If you encounter issues not covered here:

1. **Check with your team**
   - Ask other editors
   - Consult documentation
   - Review example content

2. **Contact administrators**
   - Provide specific error messages
   - Include screenshots
   - Describe steps to reproduce
   - Mention browser and operating system

3. **Sanity support resources**
   - Sanity documentation: docs.sanity.io
   - Community forum: sanity.io/help
   - Video tutorials available online

---

## Quick Reference: Content Type Comparison

| Feature | Page | Homepage | Regional Community Page | Post | News Post | Case Study | Lived Experience |
|---------|------|----------|-------------------------|------|-----------|------------|------------------|
| **Structure** | Flexible blocks | Fixed template | Template OR Custom | Rich text body | Rich styled text | Rich styled text | Video-focused |
| **i18n System** | Document-level | Document-level | Document-level | Document-level | **Field-level** | **Field-level** | **Field-level** |
| **Best for** | General pages | Site homepage | Community hubs | Blog articles | News/updates | Research | Video stories |
| **Customization** | Full | Limited (fill sections) | Depends on mode | Rich text + metadata | Rich text + location + sources | Rich text + authors + locations + workflow | Video + metadata |
| **Review Process** | No | No | No | No | No | **Yes (approval workflow)** | No |
| **Dynamic Content** | Via blocks | Via sections | **Yes (template mode)** | No | No | No | No |

---

## Block Components Quick Reference

| Block Type | Best Use Case | Customization Level | Dynamic Content? |
|------------|---------------|---------------------|------------------|
| **Hero** | Page headers, announcements | High | No |
| **Split Row** | Side-by-side layouts | High | No |
| **Grid Row** | Card collections | Medium | Via card types |
| **Carousel** | Image galleries, stories | Medium | Via card types |
| **CTA** | Calls-to-action | Medium | No |
| **Section Header** | Section titles | Low | No |
| **Timeline** | Chronological content | Medium | No |
| **FAQs** | Q&A sections | Low | Via FAQ references |
| **Logo Cloud** | Partner logos | Low | Via logo references |
| **Newsletter Form** | Email signups | Low | No |
| **All Posts** | Blog index | Low | Yes (auto) |

---

## Final Tips for Success

1. **Start simple**
   - Master basic page creation first
   - Gradually explore advanced features
   - Don't overwhelm yourself with all options at once

2. **Learn from examples**
   - Look at existing published pages
   - Duplicate and modify successful layouts
   - See how other editors structured content

3. **Maintain consistency**
   - Use similar layouts for similar content
   - Follow established patterns
   - Keep branding consistent

4. **Think mobile-first**
   - Most visitors use phones
   - Preview mobile view regularly
   - Keep text concise for small screens

5. **Optimize for performance**
   - Compress images before uploading
   - Limit video embeds per page
   - Don't overuse carousels

6. **Write for humans, optimize for search**
   - Natural, engaging writing
   - Include keywords naturally
   - Structure content with headings

7. **Keep accessibility in mind**
   - Always add alt text to images
   - Use proper heading hierarchy
   - Write descriptive link text
   - Ensure good color contrast

8. **Stay organized**
   - Use consistent naming conventions
   - Tag and categorize diligently
   - Archive outdated content
   - Maintain clean media library

---

## Glossary

- **Slug**: The URL-friendly version of a page title (e.g., "about-us")
- **Block**: A content component that can be added to pages (like LEGO pieces)
- **Dynamic content**: Content that automatically updates based on rules
- **Manual content**: Content you hand-pick and curate
- **i18n**: Internationalization (supporting multiple languages)
- **Document-level i18n**: Separate documents for each language
- **Field-level i18n**: One document with language versions in each field
- **Rich text**: Formatted text with styles, links, images, etc.
- **Meta description**: Search result summary text
- **OG image**: Social media share image
- **Featured**: Content marked for special highlighting
- **Reference**: Link to another piece of content (like selecting an author)
- **Publish**: Make content live on the public website
- **Draft**: Saved but not yet published content
- **Workflow**: The process content goes through (especially case study reviews)
- **Validation**: Checking that all required fields are filled correctly

---

**You're now ready to create amazing content!** Remember: start with English, preview often, and don't hesitate to ask for help. Happy editing!
