import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, examResultsTable, studentsTable } from "@workspace/db";
import {
  ListExamResultsQueryParams,
  CreateExamResultBody,
  UpdateExamResultParams,
  UpdateExamResultBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function computeGrade(total: number, max: number): string {
  const pct = (total / max) * 100;
  if (pct >= 90) return "O";
  if (pct >= 80) return "A+";
  if (pct >= 70) return "A";
  if (pct >= 60) return "B+";
  if (pct >= 50) return "B";
  if (pct >= 40) return "C";
  return "F";
}

router.get("/exams/results", async (req, res): Promise<void> => {
  const query = ListExamResultsQueryParams.safeParse(req.query);
  let results = await db.select().from(examResultsTable).orderBy(examResultsTable.createdAt);

  if (query.success) {
    if (query.data.studentId) {
      results = results.filter((r) => r.studentId === query.data.studentId);
    }
    if (query.data.semester) {
      results = results.filter((r) => r.semester === query.data.semester);
    }
    if (query.data.subject) {
      results = results.filter((r) => r.subject.toLowerCase().includes((query.data.subject as string).toLowerCase()));
    }
  }

  const students = await db.select().from(studentsTable);
  const studentMap = new Map(students.map((s) => [s.id, s]));

  res.json(results.map((r) => formatResult(r, studentMap.get(r.studentId))));
});

router.post("/exams/results", async (req, res): Promise<void> => {
  const parsed = CreateExamResultBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.id, parsed.data.studentId));

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const total = parsed.data.internalMarks + parsed.data.externalMarks;
  const grade = computeGrade(total, parsed.data.maxMarks);
  const result = total >= parsed.data.maxMarks * 0.4 ? "pass" : "fail";

  const [examResult] = await db
    .insert(examResultsTable)
    .values({
      ...parsed.data,
      totalMarks: total,
      grade,
      result,
    })
    .returning();

  res.status(201).json(formatResult(examResult, student));
});

router.patch("/exams/results/:id", async (req, res): Promise<void> => {
  const params = UpdateExamResultParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateExamResultBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(examResultsTable)
    .where(eq(examResultsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Result not found" });
    return;
  }

  const updateData: any = { ...parsed.data };
  if (parsed.data.internalMarks !== undefined || parsed.data.externalMarks !== undefined) {
    const internal = parsed.data.internalMarks ?? existing.internalMarks;
    const external = parsed.data.externalMarks ?? existing.externalMarks;
    const total = internal + external;
    updateData.totalMarks = total;
    updateData.grade = computeGrade(total, existing.maxMarks);
    if (!parsed.data.result) {
      updateData.result = total >= existing.maxMarks * 0.4 ? "pass" : "fail";
    }
  }

  const [updated] = await db
    .update(examResultsTable)
    .set(updateData)
    .where(eq(examResultsTable.id, params.data.id))
    .returning();

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.id, updated.studentId));

  res.json(formatResult(updated, student));
});

function formatResult(r: any, student?: any) {
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
}

export default router;
