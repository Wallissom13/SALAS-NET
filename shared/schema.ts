import { pgTable, serial, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Definição das tabelas
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
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
  description: text("description").notNull(),
  date: timestamp("date").defaultNow(),
  studentId: integer("student_id").notNull(),
  reporterName: text("reporter_name").notNull(),
  reporterType: text("reporter_type").notNull(), // "teacher", "coordinator", "psychologist", "director"
});

// Esquemas Zod para validação de inserção
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
  description: true,
  date: true,
  studentId: true,
  reporterName: true,
  reporterType: true,
});

// Tipos TypeScript para os modelos
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type User = typeof users.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Report = typeof reports.$inferSelect;

// Tipos para dados combinados
export type StudentWithReports = Student & { 
  reports: Report[],
  reportCount: number 
};

export type ClassWithStudents = Class & { 
  students: StudentWithReports[] 
};