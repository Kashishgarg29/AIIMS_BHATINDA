import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcryptjs from "bcryptjs";

export async function GET() {
  try {
    // 1. Create a default Admin
    const adminHash = await bcryptjs.hash("admin123", 10);
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@healthcamp.org" },
      update: {},
      create: {
        email: "admin@healthcamp.org",
        passwordHash: adminHash,
        fullName: "System Admin",
        role: "ADMIN",
      },
    });

    // 2. Create a Medical Staff Member
    const staffHash = await bcryptjs.hash("staff123", 10);
    const staffUser = await prisma.user.upsert({
      where: { email: "dr.sarah@healthcamp.org" },
      update: {},
      create: {
        email: "dr.sarah@healthcamp.org",
        passwordHash: staffHash,
        fullName: "Dr. Sarah",
        role: "MEDICAL_STAFF",
      },
    });

    // 3. Create an Event
    const event = await prisma.event.create({
      data: {
        schoolDetails: "Greenwood High School",
        eventDate: new Date("2026-10-24T00:00:00.000Z"),
        pocName: "Jane Doe",
        pocEmail: "jane@example.com",
        pocPhone: "555-0100",
        status: "ACTIVE",
        createdBy: adminUser.id,
      },
    });

    // 4. Assign Staff to Event
    await prisma.eventStaff.create({
      data: {
        eventId: event.id,
        userId: staffUser.id,
      },
    });

    // 5. Create some dummy students
    const students = await Promise.all([
      prisma.student.create({
        data: {
          eventId: event.id,
          firstName: "Alice",
          lastName: "Johnson",
          classSec: "10-A",
          age: 10,
          gender: "FEMALE",
        },
      }),
      prisma.student.create({
        data: {
          eventId: event.id,
          firstName: "Bob",
          lastName: "Smith",
          classSec: "10-B",
          age: 10,
          gender: "MALE",
        },
      }),
    ]);

    // 6. Give Alice an empty medical record
    await prisma.medicalRecord.create({
      data: {
        studentId: students[0].id,
        eventId: event.id,
        data: {}
      }
    })

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully!",
      eventId: event.id,
      staffId: staffUser.id,
      aliceId: students[0].id
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
