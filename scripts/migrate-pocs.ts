import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migratePocs() {
  try {
    // 1. Get all unique pocEmails from Events
    const events = await (prisma.event as any).findMany({
      select: { pocEmail: true }
    });

    const pocEmails = Array.from(new Set(events.map((e: any) => e.pocEmail.toLowerCase())));

    if (pocEmails.length === 0) {
      console.log('No POC emails found in events.');
      return;
    }

    // 2. Update users who match these emails to SCHOOL_POC role (if they aren't ADMIN)
    const result = await (prisma.user as any).updateMany({
      where: {
        email: { in: pocEmails, mode: 'insensitive' },
        role: { not: 'ADMIN' }
      },
      data: {
        role: 'SCHOOL_POC' as any
      }
    });

    console.log(`Successfully migrated ${result.count} users to SCHOOL_POC role.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migratePocs();
