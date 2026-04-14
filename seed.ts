import * as bcryptjs from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with modern medical record format (8 Sections)...");

  // 1. Create Core Users
  const users = [
    {
      "email": "admin@healthcamp.org",
      "passwordHash": "$2b$10$FHwsYr.rhOj9Jamcvc2izuxfoX1Hd/.RHXJMrTK4P4QiGju5oAvyC", // admin123
      "fullName": "System Admin",
      "role": "ADMIN",
      "isActive": true
    },
    {
      "email": "prerna@gmail.com",
      "passwordHash": "$2b$10$g6twnc3.aRQTvlxK0S3njuY5j2IO76enmoimlZy1pjONsCpPSYfWa", // 123456
      "fullName": "Prerna Gupta",
      "role": "MEDICAL_STAFF",
      "isActive": true
    },
    {
      "email": "sarah@healthcamp.org",
      "passwordHash": "$2b$10$CIctCidB3Ek9I2NgSSrlb.8Thl1n3wy0RNXj0BT/VtXg7Ky9jCfsa", // sarah123
      "fullName": "Dr. Sarah",
      "role": "MEDICAL_STAFF",
      "isActive": true
    }
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user as any,
    });
  }

  // 2. Create Sample HealthCampRequests
  const requests = [
    {
      "schoolName": "Govt Boys Senior Secondary School",
      "pocName": "Jitender Kumar",
      "pocEmail": "2023csb1148@iitrpr.ac.in",
      "pocPhone": "555-0100",
      "tentativeDate": new Date("2026-10-24"),
      "tentativeStudents": 400,
      "status": "ACCEPTED",
    },
    {
      "schoolName": "Sophia Girls School",
      "pocName": "Pihu Gupta",
      "pocEmail": "2023csb1138@iitrpr.ac.in",
      "pocPhone": "+918619252566",
      "tentativeDate": new Date("2026-03-28"),
      "tentativeStudents": 150,
      "status": "PENDING",
    }
  ];

  for (const request of requests) {
    await prisma.healthCampRequest.create({
      data: request as any,
    });
  }

  // 3. Create Sample Events with all 8 Sections
  const admin = await prisma.user.findUnique({ where: { email: "admin@healthcamp.org" } });

  const events = [
    {
      "schoolDetails": "Govt Boys Senior Secondary School",
      "eventDate": new Date("2026-10-24"),
      "pocName": "Jitender Kumar",
      "pocPhone": "555-0100",
      "pocEmail": "2023csb1148@iitrpr.ac.in",
      "status": "ACTIVE",
      "formConfig": {
        "general_examination_merged": ["firstName", "lastName", "height", "weight", "bmi", "bloodGroup"],
        "vaccination_details": ["hepB1", "hepB2", "hepB3", "typhoid"],
        "symptoms": ["headache", "vomiting", "faintingEpisodes"],
        "ent_examination": ["earIssues", "noseIssues", "throatIssues"],
        "dental_examination": ["cavities", "rottenTeeth", "gumCondition"],
        "optical_examination": ["visionRight", "visionLeft", "spectacles"],
        "skin_examination": ["skinCondition", "whitePatches"],
        "system_wise_examination": ["breathlessness", "cardioIssues", "cnsIssues"]
      },
      "createdBy": admin?.id
    }
  ];

  for (const event of events) {
    await prisma.event.create({
      data: event as any,
    });
  }

  // 3.5 Create School POC Users from events
  const allEvents = await prisma.event.findMany();
  for (const event of allEvents) {
    if ((event as any).pocEmail) {
      const password = (event as any).pocEmail.split('@')[0];
      const passwordHash = await bcryptjs.hash(password, 10);
      await prisma.user.upsert({
        where: { email: (event as any).pocEmail },
        update: {},
        create: {
          email: (event as any).pocEmail,
          passwordHash: passwordHash,
          fullName: event.pocName,
          role: "SCHOOL_POC" as any,
        },
      });
    }
  }

  // 4. Create EventStaff Assignments
  const prerna = await prisma.user.findUnique({ where: { email: "prerna@gmail.com" } });
  const sarah = await prisma.user.findUnique({ where: { email: "sarah@healthcamp.org" } });
  const Govt = await prisma.event.findFirst({ where: { schoolDetails: "Govt Boys Senior Secondary School" } });

  if (Govt && prerna && sarah) {
    await prisma.eventStaff.create({
      data: { eventId: Govt.id, userId: prerna.id }
    });
    await prisma.eventStaff.create({
      data: { eventId: Govt.id, userId: sarah.id }
    });
  }

  // 5. Create Students
  if (Govt) {
    const students = [
      { firstName: "Rahul", lastName: "Garg", classSec: "10-A", age: 15, gender: "MALE", eventId: Govt.id },
      { firstName: "Priya", lastName: "Sharma", classSec: "10-B", age: 14, gender: "FEMALE", eventId: Govt.id },
      { firstName: "Amit", lastName: "Verma", classSec: "9-C", age: 14, gender: "MALE", eventId: Govt.id }
    ];
    for (const student of students) {
      await prisma.student.create({ data: student as any });
    }
  }

  // 6. Create Sample Medical Records with the 8 Sections format
  const rahul = await prisma.student.findFirst({ where: { firstName: "Rahul" } });
  const priya = await prisma.student.findFirst({ where: { firstName: "Priya" } });

  if (rahul && Govt) {
    await prisma.medicalRecord.create({
      data: {
        studentId: rahul.id,
        eventId: Govt.id,
        status: "COMPLETED",
        data: {
          general_examination_merged: { height: "170", weight: "65", bmi: "22.5", bloodGroup: "B+", status_nor: "N" },
          ent_examination: { earIssues: "YES", earIssues_details: "Minor wax buildup", status_nor: "R", doctorRemarks: "Refer to ENT specialist." },
          dental_examination: { cavities: "NO", status_nor: "N" },
          vaccination_details: { hepB1: "YES", status_nor: "N" },
          symptoms: { headache: "YES", status_nor: "O", doctorRemarks: "Occasional stress-related headache." },
          optical_examination: { visionRight: "6/6", visionLeft: "6/6", status_nor: "N" },
          skin_examination: { skinCondition: "NO", status_nor: "N" },
          system_wise_examination: { breathlessness: "NO", status_nor: "N" }
        }
      }
    });
  }

  console.log("Seeding finished successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
