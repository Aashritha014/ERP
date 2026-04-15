import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, admissionsTable, studentsTable, feesTable, hostelRoomsTable, hostelAllocationsTable, examResultsTable, facultyTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/admin", async (req, res): Promise<void> => {
  const students = await db.select().from(studentsTable);
  const admissions = await db.select().from(admissionsTable).orderBy(admissionsTable.createdAt);
  const fees = await db.select().from(feesTable);
  const rooms = await db.select().from(hostelRoomsTable);
  const allocations = await db.select().from(hostelAllocationsTable).where(eq(hostelAllocationsTable.active, true));
  const results = await db.select().from(examResultsTable);

  const pending = admissions.filter((a) => a.status === "pending");
  const recentAdmissions = admissions.slice(-5).reverse().map(formatAdmission);

  const totalRevenue = fees.filter((f) => f.status === "paid").reduce((sum, f) => sum + f.amount, 0);
  const pendingFees = fees.filter((f) => f.status !== "paid").reduce((sum, f) => sum + f.amount, 0);

  const hostelCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const hostelOccupancy = allocations.length;

  const passRate =
    results.length > 0
      ? Math.round((results.filter((r) => r.result === "pass").length / results.length) * 100)
      : 0;

  const paidCount = fees.filter((f) => f.status === "paid").length;
  const pendingCount = fees.filter((f) => f.status === "pending").length;
  const overdueCount = fees.filter((f) => f.status === "overdue").length;

  const deptMap = new Map<string, number>();
  students.forEach((s) => {
    deptMap.set(s.department, (deptMap.get(s.department) ?? 0) + 1);
  });
  const departmentStudentCounts = Array.from(deptMap.entries()).map(([department, count]) => ({
    department,
    count,
  }));

  res.json({
    totalStudents: students.length,
    pendingAdmissions: pending.length,
    totalRevenue,
    pendingFees,
    hostelOccupancy,
    hostelCapacity,
    passRate,
    recentAdmissions,
    feeStatusBreakdown: { paid: paidCount, pending: pendingCount, overdue: overdueCount },
    departmentStudentCounts,
  });
});

router.get("/dashboard/student/:studentId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;
  const studentId = parseInt(rawId, 10);

  if (isNaN(studentId)) {
    res.status(400).json({ error: "Invalid student ID" });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const fees = await db.select().from(feesTable).where(eq(feesTable.studentId, studentId));
  const results = await db.select().from(examResultsTable).where(eq(examResultsTable.studentId, studentId));

  let admission = null;
  if (student.admissionId) {
    const [adm] = await db.select().from(admissionsTable).where(eq(admissionsTable.id, student.admissionId));
    if (adm) admission = formatAdmission(adm);
  }

  const allocations = await db
    .select()
    .from(hostelAllocationsTable)
    .where(eq(hostelAllocationsTable.studentId, studentId));

  const activeAllocation = allocations.find((a) => a.active);
  let hostelAllocation = null;
  if (activeAllocation) {
    const [room] = await db
      .select()
      .from(hostelRoomsTable)
      .where(eq(hostelRoomsTable.id, activeAllocation.roomId));
    if (room) {
      hostelAllocation = {
        id: activeAllocation.id,
        studentId: activeAllocation.studentId,
        studentName: student.name,
        studentUid: student.studentUid,
        roomId: activeAllocation.roomId,
        roomNumber: room.roomNumber,
        block: room.block,
        floor: room.floor,
        allocatedDate: activeAllocation.allocatedDate,
        vacatedDate: activeAllocation.vacatedDate ?? null,
        active: activeAllocation.active,
      };
    }
  }

  const cgpa =
    results.length > 0
      ? Math.round((results.reduce((sum, r) => sum + (r.totalMarks / r.maxMarks) * 10, 0) / results.length) * 10) / 10
      : null;

  res.json({
    student: formatStudent(student),
    admission,
    fees: fees.map((f) => ({
      id: f.id,
      studentId: f.studentId,
      studentName: student.name,
      studentUid: student.studentUid,
      feeType: f.feeType,
      amount: f.amount,
      dueDate: f.dueDate,
      paidDate: f.paidDate ?? null,
      status: f.status,
      receiptNumber: f.receiptNumber ?? null,
      semester: f.semester,
      academicYear: f.academicYear,
      createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : f.createdAt,
    })),
    hostelAllocation,
    examResults: results.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      studentName: student.name,
      studentUid: student.studentUid,
      subject: r.subject,
      subjectCode: r.subjectCode,
      semester: r.semester,
      academicYear: r.academicYear,
      internalMarks: r.internalMarks,
      externalMarks: r.externalMarks,
      totalMarks: r.totalMarks,
      maxMarks: r.maxMarks,
      grade: r.grade,
      result: r.result,
      facultyId: r.facultyId ?? null,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    })),
    cgpa,
  });
});

router.get("/dashboard/faculty/:facultyId", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.facultyId) ? req.params.facultyId[0] : req.params.facultyId;
  const facultyId = parseInt(rawId, 10);

  if (isNaN(facultyId)) {
    res.status(400).json({ error: "Invalid faculty ID" });
    return;
  }

  const [faculty] = await db.select().from(facultyTable).where(eq(facultyTable.id, facultyId));
  if (!faculty) {
    res.status(404).json({ error: "Faculty not found" });
    return;
  }

  const results = await db.select().from(examResultsTable).where(eq(examResultsTable.facultyId, facultyId));
  const students = await db.select().from(studentsTable);
  const studentMap = new Map(students.map((s) => [s.id, s]));

  const uniqueStudentIds = new Set(results.map((r) => r.studentId));

  const subjectMap = new Map<string, { pass: number; total: number }>();
  results.forEach((r) => {
    const curr = subjectMap.get(r.subject) ?? { pass: 0, total: 0 };
    curr.total += 1;
    if (r.result === "pass") curr.pass += 1;
    subjectMap.set(r.subject, curr);
  });

  const subjectPassRates = Array.from(subjectMap.entries()).map(([subject, { pass, total }]) => ({
    subject,
    passRate: Math.round((pass / total) * 100),
    totalStudents: total,
  }));

  res.json({
    faculty: {
      id: faculty.id,
      name: faculty.name,
      email: faculty.email,
      phone: faculty.phone,
      department: faculty.department,
      designation: faculty.designation,
      subjects: faculty.subjects,
      joinedAt: faculty.joinedAt instanceof Date ? faculty.joinedAt.toISOString() : faculty.joinedAt,
    },
    totalStudentsManaged: uniqueStudentIds.size,
    recentResults: results.slice(-10).reverse().map((r) => {
      const student = studentMap.get(r.studentId);
      return {
        id: r.id,
        studentId: r.studentId,
        studentName: student?.name ?? "Unknown",
        studentUid: student?.studentUid ?? "",
        subject: r.subject,
        subjectCode: r.subjectCode,
        semester: r.semester,
        academicYear: r.academicYear,
        internalMarks: r.internalMarks,
        externalMarks: r.externalMarks,
        totalMarks: r.totalMarks,
        maxMarks: r.maxMarks,
        grade: r.grade,
        result: r.result,
        facultyId: r.facultyId ?? null,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      };
    }),
    subjectPassRates,
  });
});

function formatAdmission(a: any) {
  return {
    id: a.id,
    name: a.name,
    email: a.email,
    phone: a.phone,
    dateOfBirth: a.dateOfBirth,
    gender: a.gender,
    address: a.address,
    course: a.course,
    department: a.department,
    previousSchool: a.previousSchool,
    previousMarks: a.previousMarks,
    status: a.status,
    remarks: a.remarks ?? null,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    updatedAt: a.updatedAt instanceof Date ? a.updatedAt.toISOString() : a.updatedAt,
  };
}

function formatStudent(s: any) {
  return {
    id: s.id,
    studentUid: s.studentUid,
    name: s.name,
    email: s.email,
    phone: s.phone,
    dateOfBirth: s.dateOfBirth,
    gender: s.gender,
    address: s.address,
    course: s.course,
    department: s.department,
    semester: s.semester,
    rollNumber: s.rollNumber,
    enrollmentYear: s.enrollmentYear,
    admissionId: s.admissionId ?? null,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
  };
}

export default router;
