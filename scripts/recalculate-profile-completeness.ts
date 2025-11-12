/**
 * Script to recalculate profile completeness for all users
 * Run with: npx tsx scripts/recalculate-profile-completeness.ts
 */

import { prisma } from '../lib/prisma'
import { calculateProfileCompleteness } from '../lib/profile-completeness'

async function main() {
  console.log('Starting profile completeness recalculation...')

  // Fetch all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      image: true,
      bio: true,
      ageGroup: true,
      country: true,
      city: true,
      organization: true,
      position: true,
      workBio: true,
      workTypes: true,
      expertiseAreas: true,
      personalWebsite: true,
      linkedinProfile: true,
      phoneNumber: true,
      profileCompleteness: true
    }
  })

  console.log(`Found ${users.length} users`)

  let updated = 0
  let unchanged = 0

  for (const user of users) {
    const completeness = calculateProfileCompleteness({
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      image: user.image,
      bio: user.bio,
      ageGroup: user.ageGroup,
      country: user.country,
      city: user.city,
      organization: user.organization,
      position: user.position,
      workBio: user.workBio,
      workTypes: user.workTypes,
      expertiseAreas: user.expertiseAreas,
      personalWebsite: user.personalWebsite,
      linkedinProfile: user.linkedinProfile,
      phoneNumber: user.phoneNumber
    })

    if (completeness !== user.profileCompleteness) {
      await prisma.user.update({
        where: { id: user.id },
        data: { profileCompleteness: completeness }
      })
      console.log(`Updated ${user.username}: ${user.profileCompleteness || 0}% → ${completeness}%`)
      updated++
    } else {
      unchanged++
    }
  }

  console.log('\nRecalculation complete!')
  console.log(`Updated: ${updated}`)
  console.log(`Unchanged: ${unchanged}`)
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
