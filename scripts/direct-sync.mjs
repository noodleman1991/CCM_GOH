#!/usr/bin/env node
/**
 * Direct sync script that bypasses API routes
 * This script directly calls the sync logic to populate Algolia indices
 */

import dotenv from 'dotenv'
import pkg from '@prisma/client'
const { PrismaClient } = pkg
import { algoliasearch } from 'algoliasearch'
import { createClient } from 'next-sanity'

// Load environment variables
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

// Initialize Algolia
const algoliaClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  process.env.ALGOLIA_ADMIN_API_KEY
)

// Initialize Sanity
const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN
})

const INDICES = {
  USERS: process.env.NEXT_PUBLIC_ALGOLIA_USERS_INDEX || 'users',
  AGENDAS: process.env.NEXT_PUBLIC_ALGOLIA_AGENDAS_INDEX || 'agendas',
  NEWS: process.env.NEXT_PUBLIC_ALGOLIA_NEWS_INDEX || 'news',
  CASE_STUDIES: process.env.NEXT_PUBLIC_ALGOLIA_CASE_STUDIES_INDEX || 'case_studies'
}

console.log('🔄 Starting direct sync to Algolia...\n')

// Sync Users
async function syncUsers() {
  console.log('📊 Syncing Users...')

  try {
    const users = await prisma.user.findMany({
      where: {
        isSearchable: true,
        username: { not: null },
        OR: [
          { firstName: { not: null } },
          { lastName: { not: null } }
        ]
      },
      include: {
        communityMemberships: {
          include: {
            community: {
              select: {
                name: true,
                type: true
              }
            }
          }
        }
      }
    })

    const records = users.map(user => ({
      objectID: user.id,
      userId: user.id,
      username: user.username,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      bio: user.bio || '',
      country: user.country || '',
      city: user.city || '',
      role: user.role || 'user',
      workTypes: user.workTypes || [],
      expertiseAreas: user.expertiseAreas || [],
      communities: (user.communityMemberships || []).map(m => m.community.name),
      isSearchable: user.isSearchable,
      profileVisibility: user.profileVisibility || 'public',
      createdAt: user.createdAt ? new Date(user.createdAt).getTime() : Date.now()
    }))

    if (records.length > 0) {
      await algoliaClient.clearObjects({ indexName: INDICES.USERS })
      const response = await algoliaClient.saveObjects({
        indexName: INDICES.USERS,
        objects: records
      })

      if (Array.isArray(response) && response[0]?.taskID) {
        await algoliaClient.waitForTask({ indexName: INDICES.USERS, taskID: response[0].taskID })
      }

      console.log(`✅ Users: ${records.length} records indexed\n`)
      return { success: true, count: records.length }
    } else {
      console.log(`⚠️  Users: No records to index\n`)
      return { success: true, count: 0 }
    }
  } catch (error) {
    console.error(`❌ Users: ${error.message}\n`)
    return { success: false, error: error.message }
  }
}

// Sync Case Studies
async function syncCaseStudies() {
  console.log('📊 Syncing Case Studies...')

  try {
    const caseStudies = await sanityClient.fetch(`
      *[_type == "caseStudy" && status == "approved"] {
        _id,
        title,
        slug,
        excerpt,
        status,
        featured,
        publishedAt,
        _updatedAt,
        authors[] {
          name,
          role,
          affiliation->{name}
        },
        tags[]->{name},
        studyLocation,
        studyPeriod,
        organizations[]->{name}
      }
    `)

    const records = caseStudies.map(cs => ({
      objectID: cs._id,
      contentId: cs._id,
      title: cs.title || { en: 'Untitled Case Study' },
      excerpt: cs.excerpt || {},
      slug: cs.slug?.current || '',
      status: cs.status || 'pending',
      featured: cs.featured || false,
      publishedAt: cs.publishedAt ? new Date(cs.publishedAt).getTime() : Date.now(),
      updatedAt: cs._updatedAt ? new Date(cs._updatedAt).getTime() : Date.now(),
      authors: (cs.authors || []).map(a => ({
        name: a.name || 'Unknown Author',
        role: a.role || 'author',
        affiliation: a.affiliation?.name
      })),
      tags: (cs.tags || []).map(t => t.name).filter(Boolean),
      studyLocation: cs.studyLocation ? {
        lat: cs.studyLocation.lat,
        lng: cs.studyLocation.lng,
        name: `${cs.studyLocation.lat}, ${cs.studyLocation.lng}`
      } : undefined,
      studyPeriod: cs.studyPeriod ? {
        startDate: cs.studyPeriod.startDate,
        endDate: cs.studyPeriod.endDate
      } : undefined,
      organizations: (cs.organizations || []).map(o => o.name).filter(Boolean),
      language: 'en',
      accessLevel: 'public'
    }))

    if (records.length > 0) {
      await algoliaClient.clearObjects({ indexName: INDICES.CASE_STUDIES })
      const response = await algoliaClient.saveObjects({
        indexName: INDICES.CASE_STUDIES,
        objects: records
      })

      if (Array.isArray(response) && response[0]?.taskID) {
        await algoliaClient.waitForTask({ indexName: INDICES.CASE_STUDIES, taskID: response[0].taskID })
      }

      console.log(`✅ Case Studies: ${records.length} records indexed\n`)
      return { success: true, count: records.length }
    } else {
      console.log(`⚠️  Case Studies: No records to index\n`)
      return { success: true, count: 0 }
    }
  } catch (error) {
    console.error(`❌ Case Studies: ${error.message}\n`)
    return { success: false, error: error.message }
  }
}

// Sync Agendas
async function syncAgendas() {
  console.log('📊 Syncing Agendas...')

  try {
    const agendas = await sanityClient.fetch(`
      *[_type == "agenda"] {
        _id,
        title,
        subtitle,
        description,
        slug,
        agendaType,
        year,
        publishDate,
        totalDownloadCount,
        featured,
        accessLevel,
        organizations[]->{name},
        regionalCommunities[]->{name},
        tags[]->{name},
        _updatedAt
      }
    `)

    const records = agendas.map(a => ({
      objectID: a._id,
      contentId: a._id,
      title: a.title || { en: 'Untitled Agenda' },
      subtitle: a.subtitle || {},
      description: a.description || {},
      slug: a.slug?.current || '',
      agendaType: a.agendaType || 'other',
      year: a.year || new Date().getFullYear(),
      publishDate: a.publishDate ? new Date(a.publishDate).getTime() : Date.now(),
      totalDownloadCount: a.totalDownloadCount || 0,
      featured: a.featured || false,
      organizations: (a.organizations || []).map(o => o.name).filter(Boolean),
      regionalCommunities: (a.regionalCommunities || []).map(rc => rc.name).filter(Boolean),
      tags: (a.tags || []).map(t => t.name).filter(Boolean),
      accessLevel: a.accessLevel || 'public',
      language: 'en'
    }))

    if (records.length > 0) {
      await algoliaClient.clearObjects({ indexName: INDICES.AGENDAS })
      const response = await algoliaClient.saveObjects({
        indexName: INDICES.AGENDAS,
        objects: records
      })

      if (Array.isArray(response) && response[0]?.taskID) {
        await algoliaClient.waitForTask({ indexName: INDICES.AGENDAS, taskID: response[0].taskID })
      }

      console.log(`✅ Agendas: ${records.length} records indexed\n`)
      return { success: true, count: records.length }
    } else {
      console.log(`⚠️  Agendas: No records to index\n`)
      return { success: true, count: 0 }
    }
  } catch (error) {
    console.error(`❌ Agendas: ${error.message}\n`)
    return { success: false, error: error.message }
  }
}

// Sync News
async function syncNews() {
  console.log('📊 Syncing News...')

  try {
    const newsPosts = await sanityClient.fetch(`
      *[_type == "newsPost" && publishedAt <= now()] | order(publishedAt desc) {
        _id,
        title,
        subtitle,
        excerpt,
        slug,
        publishedAt,
        _updatedAt,
        featured,
        author->{_id, name},
        tags[]->{label},
        organizations[]->{name},
        projects[]->{name},
        location,
        locationDetails {
          city,
          country
        },
        language
      }
    `)

    const records = newsPosts.map(np => ({
      objectID: np._id,
      contentId: np._id,
      title: np.title || { en: 'Untitled News Post' },
      subtitle: np.subtitle || {},
      excerpt: np.excerpt || {},
      slug: np.slug?.current || '',
      publishedAt: np.publishedAt ? new Date(np.publishedAt).getTime() : Date.now(),
      updatedAt: np._updatedAt ? new Date(np._updatedAt).getTime() : Date.now(),
      author: {
        name: np.author?.name || 'Unknown Author',
        id: np.author?._id || ''
      },
      featured: np.featured || false,
      tags: (np.tags || []).map(t => t.label?.en || t.name).filter(Boolean),
      organizations: (np.organizations || []).map(o => o.name).filter(Boolean),
      projects: (np.projects || []).map(p => p.name).filter(Boolean),
      location: {
        city: np.locationDetails?.city,
        country: np.locationDetails?.country,
        lat: np.location?.lat,
        lng: np.location?.lng
      },
      accessLevel: 'public',
      language: np.language || 'en'
    }))

    if (records.length > 0) {
      await algoliaClient.clearObjects({ indexName: INDICES.NEWS })
      const response = await algoliaClient.saveObjects({
        indexName: INDICES.NEWS,
        objects: records
      })

      if (Array.isArray(response) && response[0]?.taskID) {
        await algoliaClient.waitForTask({ indexName: INDICES.NEWS, taskID: response[0].taskID })
      }

      console.log(`✅ News: ${records.length} records indexed\n`)
      return { success: true, count: records.length }
    } else {
      console.log(`⚠️  News: No records to index\n`)
      return { success: true, count: 0 }
    }
  } catch (error) {
    console.error(`❌ News: ${error.message}\n`)
    return { success: false, error: error.message }
  }
}

// Run all syncs
async function main() {
  const results = []

  results.push(await syncUsers())
  results.push(await syncCaseStudies())
  results.push(await syncAgendas())
  results.push(await syncNews())

  // Summary
  console.log('━'.repeat(50))
  console.log('📈 Sync Summary:')
  console.log('━'.repeat(50))

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  console.log(`✅ Successful: ${successful.length}/${results.length}`)

  if (successful.length > 0) {
    successful.forEach((r, i) => {
      const name = ['Users', 'Case Studies', 'Agendas', 'News'][i]
      console.log(`   - ${name}: ${r.count} records`)
    })
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${results.length}`)
    failed.forEach((r, i) => {
      const name = ['Users', 'Case Studies', 'Agendas', 'News'][i]
      console.log(`   - ${name}: ${r.error}`)
    })
  }

  console.log('━'.repeat(50))

  await prisma.$disconnect()
  process.exit(failed.length > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
