# Homepage Import Summary

## ✅ Completed Successfully

All content from `/public/default copy.pdf` has been successfully mapped and imported into the Sanity datastore for the Connecting Climate Minds Hub homepage.

---

## 📋 Content Created

### News Posts (3)
1. **COP28: Centring Mental Health in the Health Response to Climate Change**
   - Published: Jan 15, 2024
   - Featured: Yes
   - ID: `news-cop28`

2. **Climate Change and Mental Health: Insights from Connecting Climate Minds' First Regional Dialogues**
   - Published: Mar 20, 2024
   - Featured: Yes
   - ID: `news-regional-dialogues`

3. **Study shows climate distress related to anxiety and action in young people**
   - Published: May 10, 2024
   - Featured: No
   - ID: `news-climate-distress-study`

### Testimonials (3)
1. **Maria Santos** - Community Health Worker
2. **James Okonkwo** - Environmental Researcher
3. **Li Wei** - Youth Climate Activist

---

## 🏗️ Homepage Structure (11 Sections)

### 1. Hero Welcome Section ✅
- **Component**: `hero-1`
- **Title**: "Welcome to the Connecting Climate Minds Hub..."
- **CTA**: "View our Research"
- **Image Position**: Right

### 2. Global Agenda Section ✅
- **Component**: `split-row`
- **Title**: "Prioritizing Global Research and Action for Climate Change and Mental Health"
- **Content**: Description of 960+ experts in 90 countries
- **CTA**: "Read the Global Agenda"

### 3. How to Use Hub Section ✅
- **Component**: `split-row`
- **Title**: "Your collaborative space for ideas, dialogue, and connection"
- **Content**: Description of hub features
- **CTA**: "Create an Account"

### 4. Research Agendas Module ✅
- **Component**: `grid-row` (3 columns)
- **Title**: "Catalysing interdisciplinary research to inform action in policy and practice"
- **Cards**: 6 items
  1. Agendas for populations (grid-card)
  2. Regional Agendas (grid-card)
  3. **Global Agenda** (grid-agenda - **REFERENCES EXISTING AGENDA**)
  4. Impact Reports (grid-card)
  5. Toolkits (grid-card)
  6. Case Studies (grid-card)

### 5. Lived Experiences Stories ✅
- **Component**: `carousel-2`
- **Title**: "Stories of grief, resilience and hope"
- **Testimonials**: 3 references to created testimonials

### 6. Regional Communities ✅
- **Component**: `grid-row` (3 columns)
- **Title**: "Regional communities driving global research"
- **Cards**: 7 regional community cards
  1. Sub-Saharan Africa
  2. Northern Africa and Western Asia
  3. Central and Southern Asia
  4. Eastern and South-Eastern Asia
  5. Latin America and the Caribbean
  6. Oceania
  7. Europe and Northern America

### 7. Collaboration Section ✅
- **Component**: `split-row`
- **Title**: "Facilitating meaningful connection and collaboration"
- **CTA**: "View Collaborate Area"

### 8. Latest News ✅
- **Component**: `grid-row` (3 columns)
- **Title**: "Latest news in the field"
- **News Posts**: 3 grid-news items referencing created news posts

### 9. Project Info ✅
- **Component**: `split-row`
- **Title**: "Funded by Wellcome, hosted by Climate Cares Centre"
- **CTA**: "About Project"

### 10. Mental Health Definition ✅
- **Component**: `cta-1`
- **Title**: "What do we mean by mental health?"
- **Content**: Full definition with bullet points about climate impacts

### 11. Partner Logos ✅
- **Component**: `logo-cloud-1`
- **Title**: "Funded by Wellcome, hosted by Climate Cares Centre"
- **Note**: Images array is empty (add logos manually via Sanity Studio)

---

## 📚 Existing References Used

### Agendas (from existing 24 agendas):
- ✅ Global Research and Action Agenda (2024)
- ✅ Youth Research and Action Agenda (2024)
- ✅ Indigenous Communities Research and Action Agenda (2024)
- ✅ Small Farmers and Fisher Peoples Research and Action Agenda (2024)

### Regional Communities (all 7 existing):
- ✅ Sub-Saharan Africa Regional Community
- ✅ Northern Africa and Western Asia Regional Community
- ✅ Central and Southern Asia Regional Community
- ✅ Eastern and South Eastern Asia Regional Community
- ✅ Latin America and the Caribbean Regional Community
- ✅ Oceania Regional Community
- ✅ Europe and Northern America Regional Community

---

## 🎯 Next Steps

### 1. Add Images via Sanity Studio
The hub at `hub.connectingclimateminds.org/default` was unavailable during import. You can manually add images:

1. Navigate to Sanity Studio at `/studio`
2. Open the **Homepage** document
3. Add images to:
   - Hero Welcome section
   - Global Agenda section (publication cover)
   - How to Use section (illustration)
   - Partner Logos section (Wellcome + Climate Cares logos)

### 2. Review Content
- Visit the Sanity Studio to review all created content
- Edit any text that needs refinement
- Add any missing metadata (tags, categories, etc.)

### 3. Preview Homepage
- Use the presentation tool in Sanity Studio to preview the homepage
- Verify all sections render correctly

---

## 📁 Scripts Created

Three utility scripts have been created in `/scripts/`:

1. **`create-homepage.mjs`** - Query existing Sanity documents
2. **`populate-homepage.mjs`** - Create news posts, testimonials, and homepage
3. **`verify-homepage.mjs`** - Verify homepage structure

Run any of these scripts with:
```bash
node scripts/<script-name>.mjs
```

---

## ✨ Result

**11/11 sections successfully populated** with content mapped from the PDF!

All sections are using the correct component types and referencing existing agenda and community documents where applicable.
