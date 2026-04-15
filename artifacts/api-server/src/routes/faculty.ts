import { Router, type IRouter } from "express";
import { db, facultyTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/faculty", async (req, res): Promise<void> => {
  const faculty = await db.select().from(facultyTable).orderBy(facultyTable.name);

  res.json(
    faculty.map((f) => ({
      id: f.id,
      name: f.name,
      email: f.email,
      phone: f.phone,
      department: f.department,
      designation: f.designation,
      subjects: f.subjects,
      joinedAt: f.joinedAt instanceof Date ? f.joinedAt.toISOString() : f.joinedAt,
    }))
  );
});

export default router;
