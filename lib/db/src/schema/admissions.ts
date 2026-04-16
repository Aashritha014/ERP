import { pgTable, text, serial, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const admissionsTable = pgTable("admissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  address: text("address").notNull(),
  course: text("course").notNull(),
  department: text("department").notNull(),
  previousSchool: text("previous_school").notNull(),
  previousMarks: real("previous_marks").notNull(),
  status: text("status").notNull().default("pending"),
  remarks: text("remarks"),
  studentUid: text("student_uid"),
  rollNumber: text("roll_number"),
  studentPassword: text("student_password"),
  officialEmail: text("official_email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAdmissionSchema = createInsertSchema(admissionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAdmission = z.infer<typeof insertAdmissionSchema>;
export type Admission = typeof admissionsTable.$inferSelect;
