import { Router, type IRouter } from "express";
import { eq, like, and } from "drizzle-orm";
import { db, studentsTable } from "@workspace/db";
import {
  ListStudentsQueryParams,
  GetStudentParams,
  UpdateStudentParams,
  UpdateStudentBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/students", async (req, res): Promise<void> => {
  const query = ListStudentsQueryParams.safeParse(req.query);
  let rows = await db.select().from(studentsTable).orderBy(studentsTable.createdAt);

  if (query.success) {
    if (query.data.search) {
      const search = query.data.search.toLowerCase();
      rows = rows.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.email.toLowerCase().includes(search) ||
          s.studentUid.toLowerCase().includes(search) ||
          s.rollNumber.toLowerCase().includes(search)
      );
    }
    if (query.data.department) {
      rows = rows.filter((s) => s.department === query.data.department);
    }
  }

  res.json(rows.map(formatStudent));
});

router.get("/students/:id", async (req, res): Promise<void> => {
  const params = GetStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.id, params.data.id));

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json(formatStudent(student));
});

router.patch("/students/:id", async (req, res): Promise<void> => {
  const params = UpdateStudentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [student] = await db
    .update(studentsTable)
    .set(parsed.data)
    .where(eq(studentsTable.id, params.data.id))
    .returning();

  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  res.json(formatStudent(student));
});

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
