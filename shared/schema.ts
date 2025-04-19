import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  classId: integer("class_id").notNull(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  content: text("content").notNull(),
  date: timestamp("date").notNull(),
  reporterType: text("reporter_type").notNull(), // "Líder", "Vice", or "Professor"
  createdBy: integer("created_by").notNull(), // User ID
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
});

export const insertClassSchema = createInsertSchema(classes).pick({
  name: true,
});

export const insertStudentSchema = createInsertSchema(students).pick({
  name: true,
  classId: true,
});

export const insertReportSchema = createInsertSchema(reports).pick({
  studentId: true,
  content: true,
  date: true,
  reporterType: true,
  createdBy: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type User = typeof users.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Report = typeof reports.$inferSelect;

// Extended schemas with additional info
export type StudentWithReports = Student & { 
  reports: Report[],
  reportCount: number 
};

export type ClassWithStudents = Class & { 
  students: StudentWithReports[] 
};
