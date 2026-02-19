// scripts/verify-migration.js
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function verifyMigration() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        createdAt: true,
        role: true,
      },
    });

    console.log('\n📊 Recently Migrated Users:\n');
    console.log('Total users found:', users.length);
    console.log('\n');

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
      console.log(`   Username: ${user.username || 'N/A'}`);
      console.log(`   Clerk ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });

    const totalCount = await prisma.user.count();
    console.log(`\n✅ Total users in database: ${totalCount}\n`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration();
