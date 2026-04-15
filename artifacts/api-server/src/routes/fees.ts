import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, feesTable, studentsTable } from "@workspace/db";
import {
  ListFeesQueryParams,
  CreateFeeRecordBody,
  GetFeeRecordParams,
  UpdateFeeRecordParams,
  UpdateFeeRecordBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/fees", async (req, res): Promise<void> => {
  const query = ListFeesQueryParams.safeParse(req.query);
  let fees = await db.select().from(feesTable).orderBy(feesTable.createdAt);

  if (query.success) {
    if (query.data.studentId) {
      fees = fees.filter((f) => f.studentId === query.data.studentId);
    }
    if (query.data.status) {
      fees = fees.filter((f) => f.status === query.data.status);
    }
  }

  const students = await db.select().from(studentsTable);
  const studentMap = new Map(students.map((s) => [s.id, s]));

  res.json(fees.map((f) => formatFee(f, studentMap.get(f.studentId))));
});

router.post("/fees", async (req, res): Promise<void> => {
  const parsed = CreateFeeRecordBody.safeParse(req.body);
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

  const [fee] = await db
    .insert(feesTable)
    .values({ ...parsed.data, status: "pending" })
    .returning();

  res.status(201).json(formatFee(fee, student));
});

router.get("/fees/:id", async (req, res): Promise<void> => {
  const params = GetFeeRecordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [fee] = await db.select().from(feesTable).where(eq(feesTable.id, params.data.id));
  if (!fee) {
    res.status(404).json({ error: "Fee record not found" });
    return;
  }

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.id, fee.studentId));

  res.json(formatFee(fee, student));
});

router.patch("/fees/:id", async (req, res): Promise<void> => {
  const params = UpdateFeeRecordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateFeeRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: any = { ...parsed.data };
  if (parsed.data.status === "paid" && !parsed.data.paidDate) {
    updateData.paidDate = new Date().toISOString().split("T")[0];
    updateData.receiptNumber = `RCP${Date.now()}`;
  }

  const [fee] = await db
    .update(feesTable)
    .set(updateData)
    .where(eq(feesTable.id, params.data.id))
    .returning();

  if (!fee) {
    res.status(404).json({ error: "Fee record not found" });
    return;
  }

  const [student] = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.id, fee.studentId));

  res.json(formatFee(fee, student));
});

function formatFee(f: any, student?: any) {
  return {
    id: f.id,
    studentId: f.studentId,
    studentName: student?.name ?? "Unknown",
    studentUid: student?.studentUid ?? "",
    feeType: f.feeType,
    amount: f.amount,
    dueDate: f.dueDate,
    paidDate: f.paidDate ?? null,
    status: f.status,
    receiptNumber: f.receiptNumber ?? null,
    semester: f.semester,
    academicYear: f.academicYear,
    createdAt: f.createdAt instanceof Date ? f.createdAt.toISOString() : f.createdAt,
  };
}

export default router;
