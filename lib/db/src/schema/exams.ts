import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const examResultsTable = pgTable("exam_results", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  subject: text("subject").notNull(),
  subjectCode: text("subject_code").notNull(),
  semester: text("semester").notNull(),
  academicYear: text("academic_year").notNull(),
  internalMarks: real("internal_marks").notNull(),
  externalMarks: real("external_marks").notNull(),
  totalMarks: real("total_marks").notNull(),
  maxMarks: real("max_marks").notNull(),
  grade: text("grade").notNull(),
  result: text("result").notNull(),
  facultyId: integer("faculty_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertExamResultSchema = createInsertSchema(examResultsTable).omit({ id: true, createdAt: true });
export type InsertExamResult = z.infer<typeof insertExamResultSchema>;
export type ExamResult = typeof examResultsTable.$inferSelect;
