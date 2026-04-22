"use server";

import { prisma } from "@/lib/db/prisma";

export async function getAdminAnalyticsData() {
  try {
    // 1. Fetch All Relevant Data for Aggregation
    const [events, students, medicalRecords, staff, auditLogs] = await Promise.all([
      prisma.event.findMany({
        where: { status: { not: "CANCELLED" as any } },
        include: { _count: { select: { medicalRecords: true } } },
        orderBy: { eventDate: "asc" },
      }),
      prisma.student.findMany({
        include: {
          medicalRecords: {
            select: { status: true, data: true, eventId: true }
          }
        }
      }),
      prisma.medicalRecord.findMany(),
      prisma.user.findMany({
        where: { role: "MEDICAL_STAFF", isActive: true },
        include: {
          assignedEvents: true,
          auditLogs: {
            select: { medicalRecordId: true }
          }
        }
      }),
      prisma.categoryAuditLog.findMany({
        select: { userId: true, medicalRecordId: true }
      })
    ]);

    // 2. Calculate Summary Metrics
    const totalCamps = events.length;
    const totalStudents = students.length;
    const completedCheckups = medicalRecords.filter(r => r.status === "COMPLETED").length;
    const pendingCheckups = medicalRecords.filter(r => r.status === "PENDING" || r.status === "IN_PROGRESS").length;

    let referredCount = 0;
    let observationCount = 0;
    let normalCount = 0;

    students.forEach(student => {
      const records = student.medicalRecords || [];
      records.forEach(record => {
        const data = record.data as Record<string, any> | null;
        if (!data) return;

        const results = Object.values(data);
        const isReferred = results.some((cat: any) => cat?.status_nor === "R");
        const isObservation = results.some((cat: any) => cat?.status_nor === "O");

        if (isReferred) {
          referredCount++;
        } else if (isObservation) {
          observationCount++;
        } else if (record.status === "COMPLETED") {
          normalCount++;
        }
      });
    });

    // 3. Monthly Trends (Last 6 Months)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const last6Months = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        month: months[d.getMonth()],
        year: d.getFullYear(),
        monthIdx: d.getMonth(),
        camps: 0,
        students: 0,
        completed: 0,
        pending: 0
      };
    });

    events.forEach(event => {
      const d = new Date(event.eventDate);
      const trend = last6Months.find(m => m.monthIdx === d.getMonth() && m.year === d.getFullYear());
      if (trend) {
        trend.camps++;
      }
    });

    // Group students and checkups by month of their event
    const eventMap = new Map(events.map(e => [e.id, e]));
    students.forEach(student => {
      const records = student.medicalRecords || [];
      records.forEach(record => {
        const event = eventMap.get(record.eventId);
        if (!event) return;
        const d = new Date(event.eventDate);
        const trend = last6Months.find(m => m.monthIdx === d.getMonth() && m.year === d.getFullYear());
        if (trend) {
          trend.students++;
          if (record.status === "COMPLETED") {
            trend.completed++;
          } else {
            trend.pending++;
          }
        }
      });
    });

    // 4. Event Performance
    const eventPerformance = events.map(event => {
      const eventRecords = medicalRecords.filter(r => r.eventId === event.id);
      const completed = eventRecords.filter(r => r.status === "COMPLETED").length;
      return {
        name: event.schoolDetails,
        school: event.schoolDetails,
        date: event.eventDate,
        totalStudents: eventRecords.length,
        completionPercentage: eventRecords.length > 0 ? Math.round((completed / eventRecords.length) * 100) : 0
      };
    }).sort((a, b) => b.totalStudents - a.totalStudents).slice(0, 10);

    // 5. Doctor Performance
    const doctorPerformance = staff.map(user => {
      const uniqueStudentsHandled = new Set(
        auditLogs
          .filter(log => log.userId === user.id)
          .map(log => log.medicalRecordId)
      ).size;

      // Calculate total potential students across assigned events
      const assignedEventIds = user.assignedEvents.map(e => e.eventId);
      const totalPotentialStudents = events
        .filter(e => assignedEventIds.includes(e.id))
        .reduce((acc, e) => acc + (e as any)._count.medicalRecords, 0);

      return {
        name: user.fullName,
        assignedEvents: user.assignedEvents.length,
        studentsHandled: uniqueStudentsHandled,
        completionRate: totalPotentialStudents > 0 ? Math.round((uniqueStudentsHandled / totalPotentialStudents) * 100) : 0
      };
    }).sort((a, b) => b.studentsHandled - a.studentsHandled);

    // 6. Student Status Breakdown
    const statusBreakdown = [
      { category: "Normal", count: normalCount, percentage: totalStudents > 0 ? Math.round((normalCount / totalStudents) * 100) : 0 },
      { category: "Referred", count: referredCount, percentage: totalStudents > 0 ? Math.round((referredCount / totalStudents) * 100) : 0 },
      { category: "Observation", count: observationCount, percentage: totalStudents > 0 ? Math.round((observationCount / totalStudents) * 100) : 0 },
      { category: "Pending/In Progress", count: pendingCheckups, percentage: totalStudents > 0 ? Math.round((pendingCheckups / totalStudents) * 100) : 0 }
    ];

    return {
      success: true,
      data: {
        summary: {
          totalCamps,
          totalStudents,
          completedCheckups,
          pendingCheckups,
          referredStudents: referredCount,
          normalStudents: normalCount
        },
        trends: last6Months.map(({ month, camps, students, completed, pending }) => ({
          name: month,
          camps,
          students,
          completed,
          pending
        })),
        distribution: [
          { name: "Normal", value: normalCount },
          { name: "Referred", value: referredCount },
          { name: "In Progress", value: pendingCheckups }
        ],
        eventPerformance,
        doctorPerformance,
        statusBreakdown
      }
    };

  } catch (error) {
    console.error("Failed to fetch analytics data:", error);
    return { success: false, error: "Database error" };
  }
}
