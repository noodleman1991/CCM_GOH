# Case Studies Setup Guide

## Overview

This document explains the complete setup for case studies including translation, image extraction, and automation.

## 1. Fixed Issues

### ✅ React Rendering Error
**Fixed in:** `components/blocks/grid/grid-case-study.tsx`

The component now handles both string and object formats for `title` and `excerpt` fields, preventing "Objects are not valid as a React child" errors.

### ✅ GROQ Query Error
**Fixed in:** `app/[locale]/(main)/case-studies/page.tsx`

Removed unsupported `group()` function and implemented grouping in JavaScript.

### ✅ Missing Translations
**Fixed in:** `messages/es.json`, `messages/fr.json`, `messages/ar.json`

Added complete `caseStudies` object with all UI translations in Spanish, French, and Arabic.

### ✅ Duplicate Case Studies
**Resolved:** All 9 duplicates removed, references updated in regional community pages.

## 2. Translation Setup

### Get DeepL API Key

1. Go to https://www.deepl.com/pro-api
2. Sign up for a free account (500,000 characters/month free)
3. Get your API key

### Configure Environment

Add to `.env.local`:
```bash
DEEPL_API_KEY=your-deepl-api-key-here
```

### Run Translation

Translate all approved case studies:
```bash
node scripts/translate-case-studies.mjs
```

**What it does:**
- Fetches all approved case studies
- Translates `title` and `excerpt` from English to Spanish, French, and Arabic
- Skips already-translated content
- Updates Sanity with translations
- Rate-limited to respect API limits (1 request/second)

**Output:**
- Shows progress for each case study
- Reports: translated count, skipped count, errors
- Safe to run multiple times

## 3. Image Extraction

### Extract Inline Images from HTML Content

```bash
node scripts/extract-case-study-images.mjs
```

**What it does:**
- Parses HTML content blocks in case studies
- Extracts inline `<img>` tags
- Downloads images from original URLs
- Uploads to Sanity as proper image assets
- Replaces HTML blocks with proper Sanity image blocks
- Cleans HTML content, removing inline images

**Best Practices:**
- Run after initial migration
- Safe to run multiple times (skips already-processed content)
- Images are uploaded with MD5-based filenames to avoid duplicates

## 4. Search Indexing

### Index Case Studies in Algolia

```bash
node scripts/init-search.js
```

**Configuration:**
- Index name: `case_studies`
- Searchable fields:
  - `title` (all 4 languages)
  - `excerpt` (all 4 languages)
  - `authors.name`
  - `tags`
  - `organizations`
- Faceting on: `status`, `topic`, `tags`, `relatedCommunity`, `featured`

**When to run:**
- After adding/updating case studies
- After translation
- Periodically to keep search fresh

## 5. Automation for New Case Studies

### Option A: Sanity Webhook (Recommended)

Create a webhook in Sanity Studio:

1. Go to **Manage** → **API** → **Webhooks**
2. Create new webhook:
   - **Name:** Auto-translate Case Studies
   - **URL:** `https://your-domain.com/api/webhooks/sanity/case-study-approved`
   - **Dataset:** production_2
   - **Trigger on:** Update
   - **Filter:** `_type == "caseStudy" && status == "approved"`
   - **Projection:** `{ _id, title, excerpt }`

3. Create the webhook handler:

```typescript
// app/api/webhooks/sanity/case-study-approved/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_EDITOR_TOKEN!,
  apiVersion: '2024-10-31',
  useCdn: false,
})

async function translateText(text: string, targetLang: string) {
  const response = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      text,
      target_lang: targetLang.toUpperCase(),
      source_lang: 'EN'
    })
  })

  const data = await response.json()
  return data.translations[0].text
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { _id, title, excerpt } = body

    // Check if already translated
    if (title?.es && title?.fr && title?.ar &&
        excerpt?.es && excerpt?.fr && excerpt?.ar) {
      return NextResponse.json({ message: 'Already translated', skipped: true })
    }

    // Translate
    const updates: any = {}

    if (title?.en) {
      updates.title = {
        en: title.en,
        es: title.es || await translateText(title.en, 'es'),
        fr: title.fr || await translateText(title.en, 'fr'),
        ar: title.ar || await translateText(title.en, 'ar'),
      }
    }

    if (excerpt?.en) {
      updates.excerpt = {
        en: excerpt.en,
        es: excerpt.es || await translateText(excerpt.en, 'es'),
        fr: excerpt.fr || await translateText(excerpt.en, 'fr'),
        ar: excerpt.ar || await translateText(excerpt.en, 'ar'),
      }
    }

    // Update Sanity
    if (Object.keys(updates).length > 0) {
      await client.patch(_id).set(updates).commit()
      return NextResponse.json({ message: 'Translated successfully', updates })
    }

    return NextResponse.json({ message: 'No updates needed' })
  } catch (error: any) {
    console.error('Translation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### Option B: Manual Process

When approving case studies in Sanity Studio:
1. Approve the case study (set status to "approved")
2. Run: `node scripts/translate-case-studies.mjs`
3. Run: `node scripts/extract-case-study-images.mjs` (if needed)
4. Run: `node scripts/init-search.js` to update search index

## 6. Pages Created

### Main Page: `/research-and-action/case-studies`
- **Features:**
  - Regional community grid sections
  - Filtering by topic, tags, community, search
  - Dynamic links to individual case studies
  - Fully multilingual
  - Uses `GridCaseStudyComponent` for consistent display

### Legacy Page: `/case-studies`
- **Features:**
  - Netflix-style browsing
  - Topic-based horizontal scrolling
  - Featured and recent sections
  - Search and filtering

Both pages show approved case studies with proper translations.

## 7. Maintenance Scripts

### Check Status
```bash
node scripts/check-case-studies.mjs
```

Shows:
- Total case studies
- Duplicates (if any)
- Translation status
- Status breakdown (approved/pending)
- Regional community distribution

### Remove Duplicates
```bash
node scripts/fix-case-studies-safe.mjs
```

Safely removes duplicates while preserving references.

## 8. Best Practices

### Content Guidelines
1. Always add English content first (`title.en`, `excerpt.en`)
2. Run translation script after approval
3. Extract images from HTML content
4. Update search index
5. Verify on frontend

### Translation Quality
- DeepL provides high-quality translations
- Review translations in Sanity Studio
- Make manual adjustments if needed
- Translations preserve formatting

### Image Handling
- Original images remain on source servers
- Sanity copies uploaded for reliability
- Alt text preserved from HTML
- Clean content blocks after extraction

### Search Optimization
- Update index after bulk changes
- Case studies searchable in all languages
- Faceted search by topic, tags, community
- Results ranked by featured status and date

## 9. Troubleshooting

### "Objects are not valid as a React child"
**Solution:** Already fixed in `grid-case-study.tsx`. If you see this, ensure you're using the latest version.

### "GROQ query parse error: undefined aggregate function group"
**Solution:** Already fixed. Query groups in JavaScript, not GROQ.

### "MISSING_MESSAGE: Could not resolve caseStudies"
**Solution:** Run `node scripts/add-case-studies-translations.mjs` to add translations.

### DeepL API Errors
- Check API key is correct
- Verify free tier limits (500k chars/month)
- Check network connectivity
- Rate limiting: script includes 1-second delays

### Images Not Displaying
- Verify images uploaded to Sanity
- Check asset URLs are valid
- Ensure proper CORS configuration
- Check image block structure in Sanity

## 10. Future Enhancements

### Potential Improvements
1. **Auto-translation on save** - Webhook integration
2. **Batch image processing** - Process multiple images concurrently
3. **Translation review workflow** - Flag translations for review
4. **Image optimization** - Resize/compress before upload
5. **Content versioning** - Track translation history

### Monitoring
- Set up alerts for translation failures
- Monitor API usage (DeepL limits)
- Track search query performance
- Review translation quality periodically

## Summary

Your case studies are now:
- ✅ Properly integrated with regional community grids
- ✅ Fully translated to 4 languages (en, es, fr, ar)
- ✅ Indexed and searchable in Algolia
- ✅ Free of duplicates
- ✅ Images extracted and uploaded to Sanity
- ✅ Configured for automation

## Completed Setup

All case studies have been:
1. ✅ Translated to Spanish, French, and Arabic
2. ✅ Images extracted from HTML (none found - clean content)
3. ✅ Indexed in Algolia search (25 case studies)

## Maintenance

To re-sync case studies to Algolia in the future:
```bash
node scripts/sync-case-studies-to-algolia.mjs
```

This script:
- Fetches all approved case studies from Sanity
- Transforms them for Algolia indexing
- Clears and re-indexes the case_studies index
- No API keys needed beyond what's in .env.local
