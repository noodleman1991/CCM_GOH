# Search Functionality Setup Guide

This guide walks you through setting up the complete search functionality with privacy controls in your application.

## 🚀 Quick Start

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Algolia Configuration (Required)
ALGOLIA_APP_ID=your_algolia_app_id
ALGOLIA_API_KEY=your_algolia_admin_api_key
NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=your_algolia_search_only_key

# Base URL for webhooks
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Update for production
```

**How to get Algolia keys:**
1. Go to [Algolia Dashboard](https://www.algolia.com/apps)
2. Select your application
3. Go to Settings → API Keys
4. Copy the **Application ID**, **Admin API Key**, and **Search-Only API Key**

### 2. Database Migration

Run the database migration to add privacy controls:

```bash
pnpm prisma db push
```

### 3. Initialize Search Indices

```bash
node scripts/init-search.js
```

### 4. Sync Users to Search

Make a POST request to sync existing users:

```bash
curl -X POST http://localhost:3000/api/search/users/sync \
  -H "Content-Type: application/json" \
  -d '{"type": "full"}'
```

## 🔍 Features Implemented

### ✅ Privacy Controls
- **User Opt-in/Opt-out**: Users can control if they appear in search
- **Granular Privacy**: Control what information is visible
- **Visibility Levels**: PUBLIC, MEMBERS, PRIVATE
- **Profile Settings**: Hide/show email, work details, social links, location

### ✅ Search Functionality
- **Real-time Search**: Instant results as you type
- **Faceted Filtering**: Filter by work type, expertise, location, communities
- **Highlighting**: Search terms highlighted in results
- **Pagination**: Efficient result pagination
- **Multi-language Support**: Full i18n integration

### ✅ Technical Features
- **Next.js 15 App Router**: Latest routing with server components
- **Algolia v7**: Latest search infrastructure
- **Error Handling**: Graceful fallbacks and error boundaries
- **Performance**: Optimized loading states and caching
- **Security**: Privacy-respecting indexing and access controls

## 🛠 Architecture Overview

### Components Structure
```
components/search/
├── search-interface.tsx      # Main search component with tabs
├── search-results.tsx        # Search results display
├── search-filters.tsx        # Faceted filtering sidebar
├── search-stats.tsx          # Search statistics display
└── search-error-boundary.tsx # Error handling
```

### API Routes
```
app/api/search/
├── users/sync/route.ts       # Full/partial user sync
└── users/webhook/route.ts    # Real-time profile updates
```

### Configuration
```
lib/algolia.ts                # Algolia client configuration
scripts/init-search.js        # Index initialization script
```

## 🔐 Privacy Implementation

### User Privacy Controls
Located in profile edit form (`/dashboard/profile/edit`):

1. **Search Visibility Toggle**: Enable/disable appearing in search
2. **Profile Visibility**: Choose PUBLIC/MEMBERS/PRIVATE
3. **Information Controls**: Granular control over what's shown

### Technical Privacy
- Only users with `isSearchable: true` are indexed
- Profile visibility filters applied at search time
- Automatic index updates when privacy settings change

## 🚀 Usage

### For Users
1. **Search**: Visit `/search` to find community members
2. **Privacy**: Edit privacy settings at `/dashboard/profile/edit`
3. **Navigation**: Search accessible from main navigation

### For Developers
1. **Sync Users**: Call `/api/search/users/sync` for full sync
2. **Monitor**: Check sync status with GET `/api/search/users/sync`
3. **Real-time**: Profile updates automatically sync via webhooks

## 📊 Search Index Structure

### User Records
```typescript
{
  objectID: string           // User ID
  username: string          
  firstName: string         
  lastName: string          
  fullName: string          // Searchable combined name
  bio?: string              // User bio
  location?: string         // "City, Country"
  organization?: string     
  position?: string         
  workTypes: string[]       // Faceted filter
  expertiseAreas: string[]  // Faceted filter
  communities: string[]     // User's communities
  // Privacy controls
  isSearchable: boolean     
  profileVisibility: string
  showWorkDetails: boolean  
  showLocation: boolean     
  // Metadata for ranking
  joinedAt: number          
  lastActiveAt?: number     
  communityCount: number    
}
```

## 🔧 Customization

### Adding New Search Types
1. Add new index to `ALGOLIA_INDICES` in `lib/algolia.ts`
2. Create transformation function similar to `transformUserForIndex`
3. Add new tab to `search-interface.tsx`
4. Create sync API route for the content type

### Modifying Search UI
- **Filters**: Edit `search-filters.tsx` to add/remove filter options
- **Results**: Customize result cards in `search-results.tsx`
- **Styling**: All components use Tailwind CSS classes

### Translations
All search text is fully internationalized:
- Main translations: `messages/en.json` → `search` section
- Privacy settings: `messages/en.json` → `profile.edit.privacy`

## 🐛 Troubleshooting

### Search Not Working
1. Check Algolia environment variables are set
2. Verify indices exist: run `node scripts/init-search.js`
3. Check browser console for errors

### No Results
1. Ensure users are synced: POST to `/api/search/users/sync`
2. Check users have `isSearchable: true`
3. Verify search filters aren't too restrictive

### Performance Issues
1. Check Algolia dashboard for query limits
2. Monitor search response times in browser dev tools
3. Consider increasing `hitsPerPage` in configuration

## 📝 Next Steps

### Immediate
1. Set up your Algolia account and get API keys
2. Add environment variables
3. Run the setup scripts
4. Test the search functionality

### Future Enhancements
1. **Content Search**: Index Sanity reports, posts, case studies
2. **Advanced Filters**: Location radius, date ranges
3. **Search Analytics**: Track popular searches and user behavior
4. **Personalization**: Recommended results based on user profile

## 🔗 Related Documentation

- [Algolia React InstantSearch](https://www.algolia.com/doc/guides/building-search-ui/getting-started/react/)
- [Next.js 15 App Router](https://nextjs.org/docs/app)
- [Sanity 4 Integration](https://www.sanity.io/docs)
- [Clerk Authentication](https://clerk.com/docs)

---

**Implementation Complete! 🎉**

You now have a fully functional, privacy-respecting search system integrated with your Next.js 15 application.