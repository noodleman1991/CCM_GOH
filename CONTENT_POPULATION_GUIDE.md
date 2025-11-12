# Content Population System - User Guide

This guide explains how to use the comprehensive content population system for migrating and uploading content to Sanity CMS.

## Overview

The system provides tools for:
- **Image Management**: Download images from migration data and upload to Sanity CDN
- **Page-by-Page Processing**: Process individual pages with their images
- **HTML Conversion**: Convert HTML content to Portable Text (Sanity block content)
- **Asset Registry**: Track all uploaded images with metadata

## Files Created

### Core Libraries
- `scripts/lib/image-utils.mjs` - Image download/upload utilities
- `lib/html-to-portable-text.mjs` - HTML to Portable Text converter

### Scripts
- `scripts/download-and-upload-images.mjs` - Bulk image upload
- `scripts/populate-page.mjs` - Page-by-page content processor
- `scripts/list-pages.mjs` - List available migration pages

### Data Files
- `image-asset-mapping.json` - Registry of uploaded images
- `downloads/images/` - Local copies of downloaded images

---

## Quick Start

### 1. List Available Pages

See all migration pages and their image counts:

```bash
node scripts/list-pages.mjs
```

**Output:**
```
📄 page_default.json
   Size: 225.9 KB
   Total images: 83
   HTTP images: 42
   To process images:
   $ node scripts/populate-page.mjs page_default.json --images-only
```

### 2. Process a Single Page

Upload all images from a specific page:

```bash
node scripts/populate-page.mjs page_default.json --images-only
```

**Features:**
- Downloads images to `downloads/images/`
- Uploads to Sanity CDN
- Updates `image-asset-mapping.json` registry
- Skips already uploaded images (smart caching)
- Deduplicates identical images using MD5 hashing

### 3. Process All Images

Upload all images from all pages:

```bash
# Upload first 20 images (test run)
node scripts/download-and-upload-images.mjs --limit 20

# Upload all images (267 total)
node scripts/download-and-upload-images.mjs
```

---

## Detailed Usage

### Page-by-Page Processing

**Process specific pages:**

```bash
# Homepage (42 images)
node scripts/populate-page.mjs page_default.json --images-only

# About page (24 images)
node scripts/populate-page.mjs page_about.json --images-only

# Regional community pages
node scripts/populate-page.mjs page_rc_sub-saharan-africa_.json --images-only
node scripts/populate-page.mjs page_rc_latin-america-and-the-caribbean_.json --images-only

# Research pages
node scripts/populate-page.mjs page_research-and-action_case-studies_.json --images-only
```

**Dry run (preview without uploading):**

```bash
node scripts/populate-page.mjs page_about.json --dry-run
```

### Bulk Image Processing

**Upload images with limits:**

```bash
# Test with 5 images
node scripts/download-and-upload-images.mjs --limit 5

# Upload 50 images
node scripts/download-and-upload-images.mjs --limit 50

# Upload all remaining images
node scripts/download-and-upload-images.mjs
```

**Dry run (download only, don't upload):**

```bash
node scripts/download-and-upload-images.mjs --dry-run --limit 10
```

---

## Image Asset Registry

### Structure

The `image-asset-mapping.json` file tracks all uploaded images:

```json
{
  "http://hub.connectingclimateminds.org/ccmLogoNavy.webp": {
    "assetId": "image-fd489531b84a6e682d1d63da69bb1c5b6cbe5aa4-2103x870-webp",
    "url": "https://cdn.sanity.io/images/gm67v7rk/production_2/fd489531...",
    "alt": "ccm Logo Navy",
    "filename": "ccmLogoNavy.webp",
    "localPath": "/Users/.../downloads/images/ccmLogoNavy.webp",
    "originalUrl": "http://hub.connectingclimateminds.org/ccmLogoNavy.webp",
    "contentType": "image/webp",
    "hash": "da632f2955a1f0c1ff532b979dfa5b5d",
    "uploadedAt": "2025-11-08T05:44:49.233Z"
  }
}
```

### Using the Registry

**In your populate scripts:**

```javascript
import { loadRegistry } from './lib/image-utils.mjs';
import { createImageReference } from './lib/image-utils.mjs';

// Load registry
const registry = await loadRegistry('./image-asset-mapping.json');

// Get image reference for Sanity
const imageUrl = 'http://hub.connectingclimateminds.org/logo.png';
const entry = registry[imageUrl];

if (entry) {
  const imageRef = createImageReference(entry.assetId, entry.alt);
  // Use in your Sanity document
  document.coverImage = imageRef;
}
```

---

## HTML to Portable Text

### Convert HTML Content

```javascript
import { htmlToPortableText } from '../lib/html-to-portable-text.mjs';

const html = '<h1>Title</h1><p>Content with <strong>bold</strong> text.</p>';
const blocks = htmlToPortableText(html);

// Use in Sanity document
document.body = blocks;
```

### Create Simple Block Content

```javascript
import { createBlockContent, createParagraph } from '../lib/html-to-portable-text.mjs';

// From plain text
const blocks = createBlockContent('This is paragraph 1.\n\nThis is paragraph 2.');

// Single paragraph
const para = createParagraph('This is a heading', 'h2');
```

---

## Migration Workflow

### Recommended Approach

**Phase 1: Test with Small Pages**
```bash
# Start with simple pages
node scripts/populate-page.mjs page_collaborate.json --images-only
node scripts/populate-page.mjs page_sign-up.json --images-only
```

**Phase 2: Process Main Pages**
```bash
# Homepage
node scripts/populate-page.mjs page_default.json --images-only

# About
node scripts/populate-page.mjs page_about.json --images-only

# Research sections
node scripts/populate-page.mjs page_research-and-action_.json --images-only
node scripts/populate-page.mjs page_research-and-action_case-studies_.json --images-only
```

**Phase 3: Regional Communities**
```bash
# All 7 regional communities
for region in sub-saharan-africa northern-africa-and-western-asia central-and-southern-asia eastern-and-south-eastern-asia latin-america-and-the-caribbean oceania europe-and-northern-america; do
  node scripts/populate-page.mjs "page_rc_${region}_.json" --images-only
done
```

**Phase 4: Verify and Upload Remaining**
```bash
# Check what's left
node scripts/list-pages.mjs

# Upload any remaining images
node scripts/download-and-upload-images.mjs
```

---

## Current Status

### ✅ Completed
- Image download and upload infrastructure
- Page-by-page processing
- HTML to Portable Text conversion
- Asset registry system
- Deduplication and caching

### 📊 Statistics

**Migration Data:**
- 31 JSON files
- 267 valid HTTP image URLs (filtered from 292 total)
- ~225 KB homepage data
- ~1.5 MB site inventory

**Images Uploaded:**
- 52+ images successfully uploaded to Sanity CDN
- 0 errors in recent tests
- All images tracked in registry

### 🔄 Automated Features

1. **Smart Caching**: Already uploaded images are skipped
2. **Deduplication**: Identical images (by hash) reference same asset
3. **Retry Logic**: Failed downloads retry up to 3 times
4. **Filtering**: Data URIs and Next.js endpoints automatically excluded
5. **Progress Tracking**: Real-time stats during uploads

---

## Troubleshooting

### Images Not Uploading

**Check:**
1. Sanity credentials in `.env.local`:
   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID=...
   NEXT_PUBLIC_SANITY_DATASET=...
   SANITY_API_EDITOR_TOKEN=...
   ```

2. Token has write permissions

3. Run with dry-run to test:
   ```bash
   node scripts/populate-page.mjs page_about.json --dry-run
   ```

### Registry Issues

**Reset registry:**
```bash
rm image-asset-mapping.json
# Start fresh
node scripts/populate-page.mjs page_default.json --images-only
```

### Large Files

**Process in batches:**
```bash
node scripts/download-and-upload-images.mjs --limit 20
# Wait, then:
node scripts/download-and-upload-images.mjs --limit 40
# Etc.
```

---

## Advanced Usage

### Custom Content Mapping

Edit `scripts/populate-page.mjs` to add custom document creation:

```javascript
// In parseHomepageData function
function parseHomepageData(pageData, registry) {
  const homepage = {
    _type: 'homepage',
    _id: 'homepage-en',
    // ... add your mappings

    heroWelcome: {
      _type: 'hero-1',
      title: pageData.sections?.hero?.title,
      image: getImageRef(pageData.sections?.hero?.imageUrl),
    },
  };

  return homepage;
}
```

### Batch Processing Script

Create a custom script for multiple pages:

```bash
#!/bin/bash
# process-all-pages.sh

PAGES=(
  "page_default.json"
  "page_about.json"
  "page_collaborate.json"
  "page_research-and-action_.json"
)

for page in "${PAGES[@]}"; do
  echo "Processing $page..."
  node scripts/populate-page.mjs "$page" --images-only
  sleep 2  # Rate limiting
done

echo "All pages processed!"
```

---

## Next Steps

1. **Upload remaining pages** using page-by-page approach
2. **Map content to Sanity schemas** (customize `parseHomepageData`)
3. **Create documents** (uncomment creation code in `populate-page.mjs`)
4. **Verify in Sanity Studio** (check /studio route)
5. **Update populate-homepage.mjs** to use image registry

---

## Support

**Generated Files:**
- `downloads/images/` - Downloaded images (can be deleted after upload)
- `image-asset-mapping.json` - **Keep this!** It's your registry

**Backup:**
Before bulk operations, export your Sanity dataset:
```bash
pnpm sanity dataset export production backup.tar.gz
```

---

## Summary

You now have a complete system for:
- ✅ Downloading and uploading images page-by-page
- ✅ Converting HTML to Portable Text
- ✅ Tracking all assets in a registry
- ✅ Smart caching and deduplication
- ✅ Flexible processing (dry-run, limits, filters)

**Start processing pages whenever you're ready:**
```bash
node scripts/list-pages.mjs
node scripts/populate-page.mjs <page-file> --images-only
```
