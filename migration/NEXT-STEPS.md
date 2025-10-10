# Migration Next Steps - Quick Reference

## ✅ Phase 1 Complete: Content Parsing & NDJSON Generation

All scripts created and executed successfully. 73 documents ready for import.

---

## 🎯 Phase 2: Asset Management & Import

### Step 1: Download Assets
```bash
cd migration
pnpm exec tsx scripts/2-download-assets.ts
```

**Expected Output:**
- 763 images downloaded to `migration/downloads/images/`
- 59 PDFs downloaded to `migration/downloads/pdfs/`

---

### Step 2: Upload Assets to Sanity

**First, create Script 13:**

```typescript
// migration/scripts/13-upload-assets-to-sanity.ts
// This script will:
// 1. Upload all images to Sanity (get asset IDs)
// 2. Upload all PDFs to Sanity (get file IDs)
// 3. Create asset mapping file for reference updates
```

**Then run:**
```bash
pnpm exec tsx scripts/13-upload-assets-to-sanity.ts
```

---

### Step 3: Update Agenda NDJSON with PDF References

**Create a script to update agendas.ndjson:**
- Replace `_pdfUrls` field with proper `files` array
- Use asset IDs from upload mapping

---

### Step 4: Import NDJSON to Sanity

**Create Script 14:**

```typescript
// migration/scripts/14-import-to-sanity.ts
// Import order (to resolve references):
// 1. organizations.ndjson
// 2. regional-communities.ndjson
// 3. authors.ndjson
// 4. agendas.ndjson (updated with PDF refs)
// 5. homepage.ndjson
// 6. regional-community-pages.ndjson
```

**Run:**
```bash
pnpm exec tsx scripts/14-import-to-sanity.ts
```

---

### Step 5: Validate in Sanity Studio

**Start Sanity Studio:**
```bash
pnpm sanity dev
```

**Check:**
- [ ] 22 organizations imported
- [ ] 7 regional communities imported
- [ ] 12 authors imported
- [ ] 24 agendas imported with PDF files
- [ ] 1 homepage imported
- [ ] 7 regional community pages imported
- [ ] All references resolve correctly

---

## 📝 Manual Content Entry (After Import)

### Homepage - 8 Placeholder Sections

Navigate to Homepage document in Sanity Studio and complete:

1. **Global Agenda** (split-row)
   - Add title, description, image
   - Add link to global agenda

2. **Research Agendas Module** (grid-row)
   - Configure grid to show featured agendas

3. **Lived Experiences** (carousel-2)
   - Add lived experience stories

4. **Regional Communities** (grid-row)
   - Configure to show all 7 communities

5. **News & Updates** (grid-row)
   - Add news posts or configure dynamic feed

6. **About the Project** (split-row)
   - Add project information

7. **What is Mental Health?** (cta-1)
   - Add definition and call-to-action

8. **Our Partners** (logo-cloud-1)
   - Add partner organization logos

---

## 🌍 Regional Communities - Enhancements

For each regional community:

1. **Add Cover Image**
   - Upload regional hero image
   - Add alt text

2. **Link Authors**
   - Go to author documents
   - Verify community memberships

3. **Add Contact Info**
   - Regional contact name
   - Email
   - Phone

4. **Review Grid Configurations**
   - Adjust columns/max items if needed
   - Test dynamic content filtering

---

## 👥 Authors - Enhancements

For each author:

1. Upload profile image
2. Link to organization (via organizationalAffiliation reference)
3. Add bio/description
4. Verify community memberships and roles

---

## 🏢 Organizations - Enhancements

For each organization:

1. Upload logo
2. Add description
3. Add website URL
4. Add contact email
5. Link to regional community (if applicable)

---

## 📄 Agendas - Enhancements

For each agenda:

1. Verify PDF files attached correctly
2. Add cover image
3. Add tags
4. Verify regional community links
5. Add descriptions (currently empty)

---

## 🌐 Translations

After all content is complete:

### Using Document Internationalization

1. Install plugin (if not already):
```bash
pnpm add @sanity/document-internationalization
```

2. Configure in `sanity.config.ts`:
```typescript
import {documentInternationalization} from '@sanity/document-internationalization'

plugins: [
  documentInternationalization({
    supportedLanguages: [
      {id: 'en', title: 'English'},
      {id: 'es', title: 'Español'},
      {id: 'fr', title: 'Français'},
      {id: 'ar', title: 'العربية'},
    ],
    schemaTypes: ['homepage', 'regionalCommunityPage', 'agenda'],
  })
]
```

3. Create translations for:
   - Homepage (ES, FR, AR)
   - Regional Community Pages (ES, FR, AR)
   - Agendas (where translations exist)

---

## 🎉 Migration Complete Checklist

- [ ] Phase 1: Content parsing & NDJSON generation ✅
- [ ] Phase 2: Asset download
- [ ] Phase 3: Asset upload to Sanity
- [ ] Phase 4: NDJSON import
- [ ] Phase 5: Validation in Sanity Studio
- [ ] Phase 6: Manual content completion
- [ ] Phase 7: Enhancements (images, bios, descriptions)
- [ ] Phase 8: Translations
- [ ] Phase 9: Final testing
- [ ] Phase 10: Production deployment

---

## 📊 Quick Stats

**Documents Generated:** 73
- Organizations: 22
- Authors: 12
- Agendas: 24 (13 summaries + 11 full)
- Regional Communities: 7
- Regional Community Pages: 7
- Homepage: 1

**Assets to Process:**
- Images: 763
- PDFs: 59

**Estimated Completion Time:** 4-8 hours (excluding manual content entry)

---

## 🆘 Need Help?

Review these files:
- `migration/output/MIGRATION-SUMMARY.md` - Complete technical overview
- `migration/output/FINAL-AGENDA-GROUPS-REPORT.md` - PDF grouping details
- `migration/output/CONTENT-EXTRACTION-REPORT.md` - Extraction confidence scores

**All JSON review files available in:** `migration/output/*.json`
