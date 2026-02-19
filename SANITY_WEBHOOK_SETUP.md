# Sanity Webhook Configuration for Algolia Search

## Overview
This document explains how to configure Sanity webhooks to keep Algolia search indices synchronized with content changes in real-time.

## Webhook Endpoints

Your application has the following webhook endpoints for search indexing:

### Production URL
Replace `https://your-domain.com` with your actual production domain.

### Available Endpoints

1. **Case Studies**: `https://your-domain.com/api/search/case-studies/webhook`
2. **News Posts**: `https://your-domain.com/api/search/news/webhook`
3. **Agendas**: `https://your-domain.com/api/search/agendas/webhook`

## Sanity Studio Configuration

### Step 1: Access Sanity Manage
1. Go to https://www.sanity.io/manage
2. Select your project: `gm67v7rk`
3. Navigate to **API** → **Webhooks**

### Step 2: Create Webhooks

You need to create **3 separate webhooks** (one for each content type):

#### Webhook 1: Case Studies
- **Name**: `Algolia - Case Studies`
- **URL**: `https://your-domain.com/api/search/case-studies/webhook`
- **Dataset**: `production_2`
- **Trigger on**: `Create`, `Update`, `Delete`
- **Filter**:
  ```groq
  _type == "caseStudy"
  ```
- **HTTP method**: `POST`
- **API version**: `2024-04-24`
- **Include drafts**: `No` (only sync published content)

**Payload**:
```json
{
  "_id": _id,
  "_type": _type,
  "action": select(
    _type == "sanity.delete" => "delete",
    "update"
  )
}
```

#### Webhook 2: News Posts
- **Name**: `Algolia - News`
- **URL**: `https://your-domain.com/api/search/news/webhook`
- **Dataset**: `production_2`
- **Trigger on**: `Create`, `Update`, `Delete`
- **Filter**:
  ```groq
  _type == "newsPost"
  ```
- **HTTP method**: `POST`
- **API version**: `2024-04-24`
- **Include drafts**: `No`

**Payload**:
```json
{
  "_id": _id,
  "_type": _type,
  "action": select(
    _type == "sanity.delete" => "delete",
    "update"
  )
}
```

#### Webhook 3: Agendas
- **Name**: `Algolia - Agendas`
- **URL**: `https://your-domain.com/api/search/agendas/webhook`
- **Dataset**: `production_2`
- **Trigger on**: `Create`, `Update`, `Delete`
- **Filter**:
  ```groq
  _type == "agenda"
  ```
- **HTTP method**: `POST`
- **API version**: `2024-04-24`
- **Include drafts**: `No`

**Payload**:
```json
{
  "_id": _id,
  "_type": _type,
  "action": select(
    _type == "sanity.delete" => "delete",
    "update"
  )
}
```

## Webhook Behavior

### On Create/Update
When a document is created or updated:
1. Webhook fetches the latest document data from Sanity
2. Transforms the data into Algolia-compatible format
3. Only indexes documents that meet criteria:
   - **Case Studies**: `status === "approved"`
   - **News**: `publishedAt <= now()`
   - **Agendas**: All published agendas
4. Updates or creates the record in Algolia

### On Delete
When a document is deleted:
1. Webhook receives the document `_id`
2. Immediately removes the record from Algolia index
3. No data fetching needed (just the ID)

### Unpublishing Behavior
When content is unpublished (e.g., case study status changes from "approved" to "draft"):
- The webhook detects the status change
- Automatically **removes** the record from Algolia
- Ensures only approved/published content is searchable

## Testing Webhooks

### 1. Test Webhook Delivery
After creating webhooks in Sanity:
1. Go to API → Webhooks in Sanity Manage
2. Click on each webhook
3. Use the "Test" button to send a test payload
4. Check the delivery log for successful 200 responses

### 2. Test Real Updates
1. **Create** a new case study in Sanity Studio
2. Set status to "approved"
3. Publish the document
4. Wait 2-5 seconds
5. Search for it on your site's search page
6. Verify it appears in results

### 3. Test Deletions
1. **Delete** a case study from Sanity
2. Wait 2-5 seconds
3. Search for it on your site
4. Verify it no longer appears in results

## Monitoring

### Check Webhook Logs
In Sanity Manage → API → Webhooks:
- View delivery history for each webhook
- Check response codes (200 = success)
- Review payload data
- Debug failed deliveries

### Check Application Logs
Your webhook endpoints log all operations:
- ✅ Successful indexing
- 🗑️ Deletions
- 🔒 Unpublished removals
- ❌ Errors

View logs in your hosting platform (Vercel, etc.)

## Important Notes

### Authentication
- Webhooks bypass Clerk authentication (handled in `proxy.ts`)
- Each endpoint validates the document type
- Only processes documents matching expected `_type`

### User Search (Not Webhook-Based)
User profiles are synced via Clerk webhooks, not Sanity:
- Clerk → `/api/webhooks/clerk`
- Automatically updates `/api/search/users/webhook`
- No Sanity configuration needed for users

### Initial Sync
Webhooks only handle **changes after setup**. For initial population:
```bash
node scripts/sync-all-search.js
```

This indexes all existing content at once.

## Troubleshooting

### Webhook not firing
- Check Filter syntax in Sanity
- Verify dataset is `production_2`
- Ensure triggers include Create, Update, Delete

### Content not appearing in search
- Check document status (approved/published)
- Review webhook delivery logs in Sanity
- Check application logs for errors
- Run manual sync: `node scripts/sync-all-search.js`

### Old content still showing
- Ensure Delete trigger is enabled
- Check webhook payload includes "action" field
- Manually remove from Algolia if needed

## Questions?
Check webhook logs in both:
1. Sanity Manage → API → Webhooks
2. Your application server logs
