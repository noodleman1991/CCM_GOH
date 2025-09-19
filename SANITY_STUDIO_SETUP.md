# Sanity Studio Configuration & Prisma-Sanity Synchronization

## 📋 Overview

This document provides complete setup instructions for the Sanity Studio configuration and Prisma-Sanity synchronization system that was implemented.

## ✅ What Was Implemented

### 1. **Sanity Studio Configuration**
- ✅ Registered all 3 schemas in Sanity Studio (`onboardingContent`, `workType`, `expertiseArea`)
- ✅ Added User Management section with organized content structure
- ✅ Language-based filtering for onboarding content (English, Spanish, French, Arabic)
- ✅ Proper ordering and preview components

### 2. **Custom Input Components**
- ✅ Created `AdminOnlyKeyInput` component for restricted key field editing
- ✅ Key fields are now admin-only to prevent database constraint violations
- ✅ Visual warnings and access restrictions for non-admin users
- ✅ Integrated components into `workType` and `expertiseArea` schemas

### 3. **Prisma-Sanity Synchronization**
- ✅ Created comprehensive sync utilities (`lib/utils/sanity-prisma-sync.ts`)
- ✅ Built CLI tool for checking and fixing synchronization (`scripts/sync-prisma-sanity.js`)
- ✅ Added package.json scripts: `pnpm sanity:sync check` and `pnpm sanity:populate`

### 4. **TypeScript Integration**
- ✅ Created complete type definitions (`lib/types/sanity-prisma.ts`)
- ✅ Type-safe integration between Sanity content and Prisma enums
- ✅ Comprehensive interfaces for all onboarding data structures

### 5. **Real-time Updates**
- ✅ Webhook endpoint for Sanity Studio updates (`/api/webhooks/sanity`)
- ✅ Manual cache invalidation API (`/api/cache/revalidate`)
- ✅ Cache tag-based invalidation system

### 6. **Migration Scripts**
- ✅ Onboarding content migration script (`scripts/migrate-onboarding-to-sanity.mjs`)
- ✅ Comprehensive content for all 4 languages with proper structure

## 🔧 Setup Instructions

### Step 1: Environment Variables
Ensure these environment variables are set:

```bash
# Required for Sanity CMS
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=development  # or production
SANITY_API_TOKEN=your_api_token_with_write_permissions

# Optional for webhook security
SANITY_WEBHOOK_SECRET=your_webhook_secret

# Optional for admin cache invalidation
ADMIN_API_KEY=your_admin_api_key
```

### Step 2: Configure Sanity API Token Permissions
Your Sanity API token needs these permissions:
- ✅ **Read** - To fetch existing content
- ✅ **Write** - To create/update documents
- ✅ **Create** - To generate missing content

To set up the token:
1. Go to [Sanity Manage Console](https://www.sanity.io/manage)
2. Select your project
3. Go to **API** section
4. Create a new token with **Editor** permissions

### Step 3: Generate Prisma Client
```bash
pnpm install  # This runs `prisma generate` as postinstall
```

### Step 4: Populate Initial Content
```bash
# Run the migration to populate Sanity with onboarding content
pnpm sanity:populate

# Check Prisma-Sanity synchronization
pnpm sanity:sync check

# Generate missing content if needed
pnpm sanity:sync generate
```

### Step 5: Configure Webhooks (Optional)
To enable real-time cache updates:

1. In Sanity Studio, go to **API** → **Webhooks**
2. Create a new webhook:
   - **URL**: `https://your-domain.com/api/webhooks/sanity`
   - **Dataset**: Your dataset name
   - **Trigger on**: Document changes for `onboardingContent`, `workType`, `expertiseArea`
   - **Secret**: Your `SANITY_WEBHOOK_SECRET` value

## 🎯 How It Works

### Content Management Workflow

1. **Content Editors** can:
   - ✅ Edit onboarding text content in all 4 languages
   - ✅ Modify work type and expertise area labels/descriptions
   - ✅ Reorder items and activate/deactivate options
   - ❌ **Cannot** change key fields (admin-only protection)

2. **Administrators** can:
   - ✅ All content editor capabilities
   - ✅ Modify key fields (with warnings about database implications)
   - ✅ Add new work types/expertise areas
   - ✅ Manage content structure

3. **Developers** can:
   - ✅ Add new Prisma enum values and run sync to generate Sanity content
   - ✅ Monitor sync status with built-in CLI tools
   - ✅ Invalidate cache manually when needed

### Key Safety Features

1. **Admin-Only Key Fields**: Key fields that must match Prisma enums are restricted to administrators
2. **Sync Validation**: CLI tools check for mismatches between Prisma and Sanity
3. **Cache Invalidation**: Real-time updates ensure content changes are immediately reflected
4. **Type Safety**: Complete TypeScript integration prevents runtime errors

## 📱 Using the System

### For Content Editors
1. Access Sanity Studio at `/studio`
2. Navigate to **User Management** section
3. Edit content in the appropriate language
4. Changes are automatically cached and updated

### For Developers
```bash
# Check if Prisma enums match Sanity content
pnpm sanity:sync check

# Add missing Sanity content for new Prisma enums
pnpm sanity:sync generate

# Manually invalidate cache during development
curl -X POST http://localhost:3000/api/cache/revalidate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_admin_api_key" \
  -d '{"all": true}'
```

## 🚨 Important Notes

### Adding New Work Types or Expertise Areas

1. **First**: Update Prisma schema enum
2. **Second**: Run database migration
3. **Third**: Run `pnpm sanity:sync generate` to create Sanity content
4. **Fourth**: Review and translate the generated content in Sanity Studio

### Key Field Changes

⚠️ **WARNING**: Changing key fields in Sanity requires careful coordination:

1. Check if the key is referenced in the database
2. Update Prisma enum if needed
3. Run database migration
4. Update Sanity key field
5. Test thoroughly

### Cache Management

- **Automatic**: Webhooks invalidate cache on content changes
- **Manual**: Use `/api/cache/revalidate` endpoint for manual invalidation
- **Development**: Set `NODE_ENV=development` to skip webhook signature verification

## 🔍 Troubleshooting

### Permission Errors
- Ensure Sanity API token has **Editor** permissions
- Check that token is properly set in environment variables

### Sync Issues
- Run `pnpm sanity:sync check` to identify problems
- Use `pnpm sanity:sync generate` to fix missing content
- Manually review and translate generated content

### Cache Not Updating
- Check webhook configuration in Sanity Studio
- Verify webhook endpoint is accessible
- Use manual cache invalidation as fallback

### TypeScript Errors
- Ensure Prisma client is generated: `pnpm install`
- Check that all Sanity content has proper TypeScript types
- Verify imports are using the correct type definitions

## 📚 File Structure

```
├── app/api/
│   ├── webhooks/sanity/route.ts         # Webhook handler
│   └── cache/revalidate/route.ts        # Manual cache invalidation
├── lib/
│   ├── actions/sanity.ts                # Sanity fetch functions with caching
│   ├── types/sanity-prisma.ts           # TypeScript definitions
│   └── utils/sanity-prisma-sync.ts      # Sync utilities
├── sanity/
│   ├── lib/components/AdminOnlyKeyInput.tsx  # Custom input component
│   ├── schemas/documents/               # Schema definitions
│   │   ├── onboarding-content.ts
│   │   ├── work-type.ts
│   │   └── expertise-area.ts
│   ├── queries/                         # GROQ queries
│   ├── schema.ts                        # Schema registration
│   └── structure.ts                     # Studio structure
└── scripts/
    ├── migrate-onboarding-to-sanity.mjs # Content migration
    └── sync-prisma-sanity.js            # Sync CLI tool
```

This system provides a robust, type-safe, and user-friendly content management solution that maintains data integrity between Sanity CMS and Prisma database constraints.