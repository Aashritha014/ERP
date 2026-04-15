import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const facultyTable = pgTable("faculty", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  department: text("department").notNull(),
  designation: text("designation").notNull(),
  subjects: text("subjects").array().notNull().default([]),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFacultySchema = createInsertSchema(facultyTable).omit({ id: true });
export type InsertFaculty = z.infer<typeof insertFacultySchema>;
export type Faculty = typeof facultyTable.$inferSelect;
