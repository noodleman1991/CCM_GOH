# Homepage Implementation - Document-Level Internationalization

## How It Works

This homepage implementation uses **document-level internationalization** with the `@sanity/document-internationalization` plugin (v4.0.0).

### Key Features

1. **Document-Level Translation**: Each language gets its own homepage document
2. **Root Route**: Served at "/" for each locale
3. **Translation Connection**: Documents connected via `translation.metadata`
4. **Sanity Studio Integration**: Uses document-internationalization UI for managing translations

### Configuration

The homepage is configured in `sanity.config.ts`:

```typescript
documentInternationalization({
  supportedLanguages: routing.locales.map(locale => ({...})),
  schemaTypes: ['page', 'regionalCommunityPage', 'post', 'caseStudy', 'homepage'], // <- homepage added
  languageField: 'language',
  weakReferences: true,
})
```

### Schema Structure

Follows the exact same pattern as `regionalCommunityPage`:

- `language: string, readOnly: true, hidden: true`
- `isUniqueOtherThanLanguage` for slug validation
- Individual blocks for each section (welcomeHero, etc.)
- Additional `blocks[]` array for flexibility

### Creating Homepages

1. Go to Sanity Studio → Homepage
2. Create document with slug "index"
3. Fill out content using block editor
4. Use "Translations" button to create other language versions
5. Each language creates a separate document

### Querying Pattern

```groq
*[_type == "homepage" && slug.current == $slug && language == $language][0]
```

Same pattern as all your other document-level internationalized content.

### Route Handling

- `/` → English homepage
- `/es` → Spanish homepage
- `/fr` → French homepage
- `/ar` → Arabic homepage

Fallback: if no homepage exists, falls back to regular page with slug "index".
