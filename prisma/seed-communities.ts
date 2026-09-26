import { PrismaClient, CommunityType, RegionalCommunityName } from '../generated/prisma'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const prisma = new PrismaClient()

const REGIONAL_COMMUNITIES = [
  {
    name: 'Sub-Saharan Africa',
    description: 'Community for climate and mental health professionals in Sub-Saharan Africa',
    type: CommunityType.REGIONAL,
    regionalName: RegionalCommunityName.ssa
  },
  {
    name: 'Northern Africa and Western Asia',
    description: 'Community for climate and mental health professionals in Northern Africa and Western Asia',
    type: CommunityType.REGIONAL,
    regionalName: RegionalCommunityName.nawa
  },
  {
    name: 'Central and Southern Asia',
    description: 'Community for climate and mental health professionals in Central and Southern Asia',
    type: CommunityType.REGIONAL,
    regionalName: RegionalCommunityName.csa
  },
  {
    name: 'Eastern and South-Eastern Asia',
    description: 'Community for climate and mental health professionals in Eastern and South-Eastern Asia',
    type: CommunityType.REGIONAL,
    regionalName: RegionalCommunityName.esea
  },
  {
    name: 'Latin America and the Caribbean',
    description: 'Community for climate and mental health professionals in Latin America and the Caribbean',
    type: CommunityType.REGIONAL,
    regionalName: RegionalCommunityName.lac
  },
  {
    name: 'Oceania',
    description: 'Community for climate and mental health professionals in Oceania',
    type: CommunityType.REGIONAL,
    regionalName: RegionalCommunityName.oce
  },
  {
    name: 'Europe and Northern America',
    description: 'Community for climate and mental health professionals in Europe and Northern America',
    type: CommunityType.REGIONAL,
    regionalName: RegionalCommunityName.enam
  }
]

async function main() {
  console.log('🌍 Seeding regional communities...')

  for (const community of REGIONAL_COMMUNITIES) {
    const existing = await prisma.community.findFirst({
      where: { regionalName: community.regionalName }
    })

    if (existing) {
      console.log(`✓ Community already exists: ${community.name}`)
      continue
    }

    await prisma.community.create({
      data: community
    })
    console.log(`✅ Created community: ${community.name}`)
  }

  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
