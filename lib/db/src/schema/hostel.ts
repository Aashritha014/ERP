import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hostelRoomsTable = pgTable("hostel_rooms", {
  id: serial("id").primaryKey(),
  roomNumber: text("room_number").notNull().unique(),
  block: text("block").notNull(),
  floor: integer("floor").notNull(),
  capacity: integer("capacity").notNull(),
  occupied: integer("occupied").notNull().default(0),
  type: text("type").notNull(),
  amenities: text("amenities").array().notNull().default([]),
});

export const hostelAllocationsTable = pgTable("hostel_allocations", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  roomId: integer("room_id").notNull(),
  allocatedDate: text("allocated_date").notNull(),
  vacatedDate: text("vacated_date"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHostelRoomSchema = createInsertSchema(hostelRoomsTable).omit({ id: true });
export const insertHostelAllocationSchema = createInsertSchema(hostelAllocationsTable).omit({ id: true, createdAt: true });
export type InsertHostelRoom = z.infer<typeof insertHostelRoomSchema>;
export type InsertHostelAllocation = z.infer<typeof insertHostelAllocationSchema>;
export type HostelRoom = typeof hostelRoomsTable.$inferSelect;
export type HostelAllocation = typeof hostelAllocationsTable.$inferSelect;
