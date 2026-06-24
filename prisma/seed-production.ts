import { PrismaClient } from '../generated/prisma/index.js'

// Support runtime DATABASE_URL override for production seeding
const DATABASE_URL = process.env.DATABASE_URL_OVERRIDE || process.env.DATABASE_URL

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } }
})

async function main() {
  console.log('🌱 Seeding production database...')
  console.log('📊 Database:', DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown')

  const communities = [
    { name: 'Sub-Saharan Africa', type: 'REGIONAL' as const, regionalName: 'ssa' as const },
    { name: 'Northern Africa & Western Asia', type: 'REGIONAL' as const, regionalName: 'nawa' as const },
    { name: 'Central & Southern Asia', type: 'REGIONAL' as const, regionalName: 'csa' as const },
    { name: 'Eastern & South-Eastern Asia', type: 'REGIONAL' as const, regionalName: 'esea' as const },
    { name: 'Latin America & the Caribbean', type: 'REGIONAL' as const, regionalName: 'lac' as const },
    { name: 'Oceania', type: 'REGIONAL' as const, regionalName: 'oce' as const },
    { name: 'Europe & North America', type: 'REGIONAL' as const, regionalName: 'enam' as const }
  ]

  for (const community of communities) {
    const existing = await prisma.community.findFirst({
      where: { regionalName: community.regionalName, type: 'REGIONAL' }
    })

    if (existing) {
      console.log(`  ✓ ${community.name} already exists`)
    } else {
      await prisma.community.create({ data: community })
      console.log(`  ✅ Created ${community.name}`)
    }
  }

  console.log('✅ Production seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
