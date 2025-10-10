# Content Extraction Report - Advanced Parser

**Generated:** 2025-10-08T23:17:31.841Z

## Overall Results

- **Homepage Confidence:** NaN%
- **Sections Extracted:** 11/11
- **Regional Pages:** 7
- **Total Missing Sections:** 8

---

## Homepage Sections Breakdown

### ✅ heroWelcome
- **Confidence:** 100%
- **Quality:** high
- **Reason:** All required fields extracted with high confidence
- **Status:** Extracted

### ⚠️ howToUse
- **Confidence:** 80%
- **Quality:** medium
- **Reason:** 1/1 required fields extracted
- **Status:** Extracted

### ❌ globalAgenda
- **Confidence:** 0%
- **Quality:** missing
- **Reason:** Extraction failed - 0/1 required fields missing
- **Status:** **PLACEHOLDER ADDED**

### ❌ agendasModule
- **Confidence:** 0%
- **Quality:** missing
- **Reason:** Extraction failed - 0/1 required fields missing
- **Status:** **PLACEHOLDER ADDED**

### ✅ collaboration
- **Confidence:** 100%
- **Quality:** high
- **Reason:** All required fields extracted with high confidence
- **Status:** Extracted

### ❌ livedExperiences
- **Confidence:** NaN%
- **Quality:** missing
- **Reason:** Extraction failed - 0/0 required fields missing
- **Status:** **PLACEHOLDER ADDED**

### ❌ regionalCommunities
- **Confidence:** NaN%
- **Quality:** missing
- **Reason:** Extraction failed - 0/0 required fields missing
- **Status:** **PLACEHOLDER ADDED**

### ❌ news
- **Confidence:** NaN%
- **Quality:** missing
- **Reason:** Extraction failed - 0/0 required fields missing
- **Status:** **PLACEHOLDER ADDED**

### ❌ projectInfo
- **Confidence:** NaN%
- **Quality:** missing
- **Reason:** Extraction failed - 0/0 required fields missing
- **Status:** **PLACEHOLDER ADDED**

### ❌ mentalHealthDefinition
- **Confidence:** NaN%
- **Quality:** missing
- **Reason:** Extraction failed - 0/0 required fields missing
- **Status:** **PLACEHOLDER ADDED**

### ❌ partnerLogos
- **Confidence:** NaN%
- **Quality:** missing
- **Reason:** Extraction failed - 0/0 required fields missing
- **Status:** **PLACEHOLDER ADDED**


---

## Regional Community Pages

### Central and Southern Asia Regional Community
- Welcome Hero: 90% (high)
- Why Join CTA: 80% (medium)

### Eastern and South Eastern Asia Regional Community
- Welcome Hero: 90% (high)
- Why Join CTA: 80% (medium)

### Europe and Northern America Regional Community
- Welcome Hero: 90% (high)
- Why Join CTA: 80% (medium)

### Latin America and the Caribbean Regional Community
- Welcome Hero: 90% (high)
- Why Join CTA: 80% (medium)

### Northern Africa and Western Asia Regional Community
- Welcome Hero: 90% (high)
- Why Join CTA: 80% (medium)

### Oceania Regional Community
- Welcome Hero: 90% (high)
- Why Join CTA: 80% (medium)

### Sub-Saharan Africa Regional Community
- Welcome Hero: 90% (high)
- Why Join CTA: 80% (medium)


---

## Missing Sections Summary

- Homepage: globalAgenda
- Homepage: agendasModule
- Homepage: livedExperiences
- Homepage: regionalCommunities
- Homepage: news
- Homepage: projectInfo
- Homepage: mentalHealthDefinition
- Homepage: partnerLogos

---

## Next Steps

1. **Review placeholders** in `advanced-parsed-content.json`
2. **Manual entry required** for sections with "missing" status
3. **Verify confidence scores** - review sections with <70% confidence
4. Continue to PDF grouping and NDJSON generation

---

## Sanity v4 Translation Strategy

Following best practices (October 2024):
- Use **@sanity/document-internationalization** plugin
- Each language = separate document
- Documents linked via reference with "language" field
- Configure in sanity.config.ts with supportedLanguages

**Recommended structure:**
```typescript
{
  _id: 'homepage-en',
  _type: 'homepage',
  language: 'en',
  // ... content
}
{
  _id: 'homepage-es',
  _type: 'homepage',
  language: 'es',
  // ... translated content
  _translations: [{ _ref: 'homepage-en' }]
}
```
