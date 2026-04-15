import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, hostelRoomsTable, hostelAllocationsTable, studentsTable } from "@workspace/db";
import {
  ListHostelRoomsQueryParams,
  ListHostelAllocationsQueryParams,
  CreateHostelAllocationBody,
  DeleteHostelAllocationParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/hostel/rooms", async (req, res): Promise<void> => {
  const query = ListHostelRoomsQueryParams.safeParse(req.query);
  let rooms = await db.select().from(hostelRoomsTable).orderBy(hostelRoomsTable.block, hostelRoomsTable.roomNumber);

  if (query.success) {
    if (query.data.available !== undefined) {
      rooms = rooms.filter((r) => (r.occupied < r.capacity) === query.data.available);
    }
    if (query.data.block) {
      rooms = rooms.filter((r) => r.block === query.data.block);
    }
  }

  res.json(
    rooms.map((r) => ({
      ...r,
      available: r.occupied < r.capacity,
    }))
  );
});

router.get("/hostel/allocations", async (req, res): Promise<void> => {
  const query = ListHostelAllocationsQueryParams.safeParse(req.query);
  let allocations = await db
    .select()
    .from(hostelAllocationsTable)
    .where(eq(hostelAllocationsTable.active, true));

  if (query.success && query.data.studentId) {
    allocations = allocations.filter((a) => a.studentId === query.data.studentId);
  }

  const students = await db.select().from(studentsTable);
  const studentMap = new Map(students.map((s) => [s.id, s]));

  const rooms = await db.select().from(hostelRoomsTable);
  const roomMap = new Map(rooms.map((r) => [r.id, r]));

  res.json(
    allocations.map((a) => {
      const student = studentMap.get(a.studentId);
      const room = roomMap.get(a.roomId);
      return {
        id: a.id,
        studentId: a.studentId,
        studentName: student?.name ?? "Unknown",
        studentUid: student?.studentUid ?? "",
        roomId: a.roomId,
        roomNumber: room?.roomNumber ?? "",
        block: room?.block ?? "",
        floor: room?.floor ?? 0,
        allocatedDate: a.allocatedDate,
        vacatedDate: a.vacatedDate ?? null,
        active: a.active,
      };
    })
  );
});

router.post("/hostel/allocations", async (req, res): Promise<void> => {
  const parsed = CreateHostelAllocationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [room] = await db
    .select()
    .from(hostelRoomsTable)
    .where(eq(hostelRoomsTable.id, parsed.data.roomId));

  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  if (room.occupied >= room.capacity) {
    res.status(400).json({ error: "Room is full" });
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

  const [allocation] = await db
    .insert(hostelAllocationsTable)
    .values({ ...parsed.data, active: true })
    .returning();

  await db
    .update(hostelRoomsTable)
    .set({ occupied: room.occupied + 1 })
    .where(eq(hostelRoomsTable.id, room.id));

  res.status(201).json({
    id: allocation.id,
    studentId: allocation.studentId,
    studentName: student.name,
    studentUid: student.studentUid,
    roomId: allocation.roomId,
    roomNumber: room.roomNumber,
    block: room.block,
    floor: room.floor,
    allocatedDate: allocation.allocatedDate,
    vacatedDate: allocation.vacatedDate ?? null,
    active: allocation.active,
  });
});

router.delete("/hostel/allocations/:id", async (req, res): Promise<void> => {
  const params = DeleteHostelAllocationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [allocation] = await db
    .select()
    .from(hostelAllocationsTable)
    .where(eq(hostelAllocationsTable.id, params.data.id));

  if (!allocation) {
    res.status(404).json({ error: "Allocation not found" });
    return;
  }

  await db
    .update(hostelAllocationsTable)
    .set({ active: false, vacatedDate: new Date().toISOString().split("T")[0] })
    .where(eq(hostelAllocationsTable.id, params.data.id));

  const [room] = await db
    .select()
    .from(hostelRoomsTable)
    .where(eq(hostelRoomsTable.id, allocation.roomId));

  if (room) {
    await db
      .update(hostelRoomsTable)
      .set({ occupied: Math.max(0, room.occupied - 1) })
      .where(eq(hostelRoomsTable.id, room.id));
  }

  res.json({ message: "Allocation removed successfully" });
});

export default router;
