# Sanity Studio Setup Instructions

## Fix "Missing index document" error:

1. **Access your Studio**: Go to http://localhost:3000/studio
2. **Create Homepage Document**:
   - Click "Create new document"
   - Select "Page" (or your homepage document type)
   - Set title: "Homepage"
   - Set slug: "index"
   - Add your content
   - Publish the document

## If you see "Access Denied":
1. Make sure you're logged in to your Sanity account
2. Verify your project ID and dataset in .env.local:
   ```
   NEXT_PUBLIC_SANITY_PROJECT_ID="your-project-id"
   NEXT_PUBLIC_SANITY_DATASET="production"
   ```

## Next Steps:
- Import your existing schemas into sanity.config.ts
- Update the schema types array with your content types
- Configure your document structure in the studio

## Development URLs:
- Main app: http://localhost:3000
- Studio: http://localhost:3000/studio
- Studio (standalone): npx sanity start (port 3333)
