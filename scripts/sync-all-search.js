#!/usr/bin/env node

/**
 * Sync all Algolia search indices
 *
 * This script triggers synchronization for all search indices:
 * - Users
 * - Agendas
 * - News
 * - Case Studies
 *
 * Usage:
 *   node scripts/sync-all-search.js
 *   or
 *   npm run sync:search
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function syncAll() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const syncEndpoints = [
    { path: '/api/search/users/sync', name: 'Users' },
    { path: '/api/search/agendas/sync', name: 'Agendas' },
    { path: '/api/search/news/sync', name: 'News' },
    { path: '/api/search/case-studies/sync', name: 'Case Studies' }
  ]

  console.log('🔄 Starting sync for all search indices...\n')

  const results = []

  for (const endpoint of syncEndpoints) {
    console.log(`📊 Syncing ${endpoint.name}...`)

    try {
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INTERNAL_SYNC_SECRET}`
        },
        body: JSON.stringify({ mode: 'full' })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      console.log(`✅ ${endpoint.name}: ${result.count || 0} records indexed`)
      results.push({ name: endpoint.name, success: true, count: result.count || 0 })
    } catch (error) {
      console.error(`❌ ${endpoint.name}: ${error.message}`)
      results.push({ name: endpoint.name, success: false, error: error.message })
    }

    console.log('')
  }

  // Summary
  console.log('━'.repeat(50))
  console.log('📈 Sync Summary:')
  console.log('━'.repeat(50))

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  console.log(`✅ Successful: ${successful.length}/${results.length}`)

  if (successful.length > 0) {
    successful.forEach(r => {
      console.log(`   - ${r.name}: ${r.count} records`)
    })
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${results.length}`)
    failed.forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`)
    })
  }

  console.log('━'.repeat(50))

  process.exit(failed.length > 0 ? 1 : 0)
}

syncAll().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
