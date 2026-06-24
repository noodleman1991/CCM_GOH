import { PrismaClient } from '../generated/prisma/index.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Seed Regional Communities
  console.log('📍 Seeding regional communities...')

  const communities = [
    {
      name: 'Sub-Saharan Africa',
      type: 'REGIONAL' as const,
      regionalName: 'ssa' as const
    },
    {
      name: 'Northern Africa & Western Asia',
      type: 'REGIONAL' as const,
      regionalName: 'nawa' as const
    },
    {
      name: 'Central & Southern Asia',
      type: 'REGIONAL' as const,
      regionalName: 'csa' as const
    },
    {
      name: 'Eastern & South-Eastern Asia',
      type: 'REGIONAL' as const,
      regionalName: 'esea' as const
    },
    {
      name: 'Latin America & the Caribbean',
      type: 'REGIONAL' as const,
      regionalName: 'lac' as const
    },
    {
      name: 'Oceania',
      type: 'REGIONAL' as const,
      regionalName: 'oce' as const
    },
    {
      name: 'Europe & North America',
      type: 'REGIONAL' as const,
      regionalName: 'enam' as const
    }
  ]

  for (const community of communities) {
    const existing = await prisma.community.findFirst({
      where: {
        regionalName: community.regionalName,
        type: 'REGIONAL'
      }
    })

    if (existing) {
      console.log(`  ✓ ${community.name} already exists`)
    } else {
      await prisma.community.create({
        data: community
      })
      console.log(`  ✓ Created ${community.name}`)
    }
  }

  console.log('✅ Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
