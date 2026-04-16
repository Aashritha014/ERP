import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, admissionsTable, studentsTable, usersTable } from "@workspace/db";
import {
  CreateAdmissionBody,
  UpdateAdmissionStatusBody,
  ListAdmissionsQueryParams,
  GetAdmissionParams,
  UpdateAdmissionStatusParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/admissions", async (req, res): Promise<void> => {
  const query = ListAdmissionsQueryParams.safeParse(req.query);
  let admissions = await db.select().from(admissionsTable).orderBy(admissionsTable.createdAt);

  if (query.success && query.data.status) {
    admissions = admissions.filter((a) => a.status === query.data.status);
  }

  res.json(admissions.map(formatAdmission));
});

router.post("/admissions", async (req, res): Promise<void> => {
  const parsed = CreateAdmissionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [admission] = await db
    .insert(admissionsTable)
    .values({
      ...parsed.data,
      status: "pending",
    })
    .returning();

  const temporaryPassword = `APP${admission.id}${Math.floor(1000 + Math.random() * 9000)}`;

  await db
    .insert(usersTable)
    .values({
      name: admission.name,
      email: admission.email,
      password: temporaryPassword,
      role: "applicant",
      admissionId: admission.id,
    })
    .onConflictDoNothing();

  res.status(201).json({
    admission: formatAdmission(admission),
    credentials: {
      email: admission.email,
      temporaryPassword,
      note: "Use these credentials to log in and track your application status. Save them securely — they will not be shown again.",
    },
  });
});

router.get("/admissions/:id", async (req, res): Promise<void> => {
  const params = GetAdmissionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [admission] = await db
    .select()
    .from(admissionsTable)
    .where(eq(admissionsTable.id, params.data.id));

  if (!admission) {
    res.status(404).json({ error: "Admission not found" });
    return;
  }

  res.json(formatAdmission(admission));
});

router.patch("/admissions/:id", async (req, res): Promise<void> => {
  const params = UpdateAdmissionStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAdmissionStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(admissionsTable)
    .where(eq(admissionsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Admission not found" });
    return;
  }

  const [admission] = await db
    .update(admissionsTable)
    .set({
      status: parsed.data.status,
      remarks: parsed.data.remarks ?? null,
      updatedAt: new Date(),
    })
    .where(eq(admissionsTable.id, params.data.id))
    .returning();

  if (parsed.data.status === "approved") {
    const year = new Date().getFullYear();
    const uid = `STU${year}${String(admission.id).padStart(4, "0")}`;
    const rollNo = `${admission.department.substring(0, 3).toUpperCase()}${year}${String(admission.id).padStart(3, "0")}`;

    // Generate official @erp.edu email from applicant name
    const nameParts = admission.name.toLowerCase().trim().split(/\s+/);
    const first = nameParts[0].replace(/[^a-z]/g, "");
    const last = (nameParts.length > 1 ? nameParts[nameParts.length - 1] : "").replace(/[^a-z]/g, "");
    const officialEmail = last
      ? `${first}.${last}${admission.id}@erp.edu`
      : `${first}${admission.id}@erp.edu`;

    const [student] = await db
      .insert(studentsTable)
      .values({
        studentUid: uid,
        name: admission.name,
        email: officialEmail,
        phone: admission.phone,
        dateOfBirth: admission.dateOfBirth,
        gender: admission.gender,
        address: admission.address,
        course: admission.course,
        department: admission.department,
        semester: "1",
        rollNumber: rollNo,
        enrollmentYear: year,
        admissionId: admission.id,
      })
      .onConflictDoUpdate({
        target: studentsTable.admissionId,
        set: { studentUid: uid, rollNumber: rollNo, email: officialEmail },
      })
      .returning();

    if (student) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
      const studentPassword = Array.from({ length: 10 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ).join("");

      // Create a fresh student user account with the official @erp.edu email.
      // The applicant account (personal email) is left untouched so the
      // student can still log in and view their credentials on the status page.
      await db
        .insert(usersTable)
        .values({
          name: admission.name,
          email: officialEmail,
          password: studentPassword,
          role: "student",
          studentId: student.id,
        })
        .onConflictDoUpdate({
          target: usersTable.email,
          set: { role: "student", studentId: student.id, password: studentPassword },
        });

      // Persist credentials into the admission record so the applicant portal can show them
      const [updatedAdmission] = await db
        .update(admissionsTable)
        .set({ studentUid: uid, rollNumber: rollNo, studentPassword, officialEmail })
        .where(eq(admissionsTable.id, admission.id))
        .returning();

      return res.json({
        admission: formatAdmission(updatedAdmission),
        studentCredentials: {
          officialEmail,
          password: studentPassword,
          studentUid: uid,
          rollNumber: rollNo,
        },
      });
    }
  }

  res.json({ admission: formatAdmission(admission), studentCredentials: null });
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
    studentUid: a.studentUid ?? null,
    rollNumber: a.rollNumber ?? null,
    studentPassword: a.studentPassword ?? null,
    officialEmail: a.officialEmail ?? null,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    updatedAt: a.updatedAt instanceof Date ? a.updatedAt.toISOString() : a.updatedAt,
  };
}

export default router;
