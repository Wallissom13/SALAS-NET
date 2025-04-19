import { InsertUser, InsertClass, InsertStudent, InsertReport, 
         User, Class, Student, Report, ClassWithStudents, StudentWithReports,
         users, classes, students, reports } from "@shared/schema";
import { db } from "./db";
import { eq } from 'drizzle-orm';
import express from 'express';
import session from 'express-session';
import pg from 'pg';
import memorystore from 'memorystore';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Class operations
  getClasses(): Promise<Class[]>;
  getClass(id: number): Promise<Class | undefined>;
  getClassByName(name: string): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  
  // Student operations
  getStudents(): Promise<Student[]>;
  getStudentsByClass(classId: number): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  createManyStudents(students: InsertStudent[]): Promise<Student[]>;
  updateStudent(id: number, student: InsertStudent): Promise<Student>;
  deleteStudent(id: number): Promise<void>;
  
  // Report operations
  getReports(): Promise<Report[]>;
  getReportsByStudent(studentId: number): Promise<Report[]>;
  getReportsByClass(classId: number): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  
  // Combined data operations
  getClassesWithStudents(): Promise<ClassWithStudents[]>;
  getClassWithStudents(classId: number): Promise<ClassWithStudents | undefined>;
  
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: any;

  constructor() {
    // Usando apenas MemoryStore para simplificar
    const MemoryStoreFactory = memorystore(session);
    this.sessionStore = new MemoryStoreFactory({
      checkPeriod: 86400000 // Limpar sessões expiradas uma vez por dia
    });
    
    // Verificar se já existe um usuário admin, se não, criar um
    this.getUserByUsername("Wallisson10").then(user => {
      if (!user) {
        this.createUser({
          username: "Wallisson10",
          password: "CEPI10",
          isAdmin: true
        });
      }
    });
    
    // Verificar se já existem turmas, se não, criar as turmas necessárias
    this.getClasses().then(async classes => {
      // Remover turmas 9A e 9C se existirem
      const class9A = classes.find(c => c.name === "9A");
      const class9C = classes.find(c => c.name === "9C");
      
      if (class9A) {
        try {
          const students = await this.getStudentsByClass(class9A.id);
          for (const student of students) {
            await this.deleteStudent(student.id);
          }
          // Removendo a turma 9A
          await db.delete(classes).where(eq(classes.id, class9A.id));
        } catch (e) {
          console.error("Erro ao remover turma 9A:", e);
        }
      }
      
      if (class9C) {
        try {
          const students = await this.getStudentsByClass(class9C.id);
          for (const student of students) {
            await this.deleteStudent(student.id);
          }
          // Removendo a turma 9C
          await db.delete(classes).where(eq(classes.id, class9C.id));
        } catch (e) {
          console.error("Erro ao remover turma 9C:", e);
        }
      }
      
      // Criar turmas se não existirem
      if (classes.length === 0) {
        await Promise.all([
          this.createClass({ name: "6A" }),
          this.createClass({ name: "6B" }),
          this.createClass({ name: "6C" }),
          this.createClass({ name: "7A" }),
          this.createClass({ name: "7B" }),
          this.createClass({ name: "7C" }),
          this.createClass({ name: "8A" }),
          this.createClass({ name: "8B" }),
          this.createClass({ name: "9B" })
        ]);
        
        // Não inicializar alunos automaticamente para permitir adição manual
        console.log("Turmas criadas. Os alunos serão adicionados manualmente pelo administrador.");
      } else {
        // Verificar turmas específicas e criar se não existirem
        const requiredClasses = ["6A", "6B", "6C", "7A", "7B", "7C", "8A", "8B", "9B"];
        let createdNewClass = false;
        
        for (const className of requiredClasses) {
          if (!classes.some(c => c.name === className)) {
            await this.createClass({ name: className });
            createdNewClass = true;
          }
        }
        
        // Não inicializar alunos automaticamente
        if (createdNewClass) {
          console.log("Novas turmas criadas. Os alunos serão adicionados manualmente pelo administrador.");
        }
      }
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Garante que isAdmin seja booleano
    const userToInsert = { 
      ...insertUser, 
      isAdmin: insertUser.isAdmin === true 
    };
    
    const result = await db.insert(users).values(userToInsert).returning();
    return result[0];
  }

  async getClasses(): Promise<Class[]> {
    const result = await db.select().from(classes);
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getClass(id: number): Promise<Class | undefined> {
    const result = await db.select().from(classes).where(eq(classes.id, id));
    return result[0];
  }

  async getClassByName(name: string): Promise<Class | undefined> {
    const result = await db.select().from(classes).where(eq(classes.name, name));
    return result[0];
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const result = await db.insert(classes).values(classData).returning();
    return result[0];
  }

  async getStudents(): Promise<Student[]> {
    return await db.select().from(students);
  }

  async getStudentsByClass(classId: number): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.classId, classId));
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const result = await db.select().from(students).where(eq(students.id, id));
    return result[0];
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const result = await db.insert(students).values(student).returning();
    return result[0];
  }

  async createManyStudents(studentsData: InsertStudent[]): Promise<Student[]> {
    if (studentsData.length === 0) {
      return [];
    }
    
    const result = await db.insert(students).values(studentsData).returning();
    return result;
  }

  async updateStudent(id: number, studentData: InsertStudent): Promise<Student> {
    const result = await db
      .update(students)
      .set(studentData)
      .where(eq(students.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error("Aluno não encontrado");
    }
    
    return result[0];
  }

  async deleteStudent(id: number): Promise<void> {
    // Delete all reports for this student first
    await db.delete(reports).where(eq(reports.studentId, id));
    
    // Then delete the student
    const result = await db.delete(students).where(eq(students.id, id)).returning();
    
    if (result.length === 0) {
      throw new Error("Aluno não encontrado");
    }
  }

  async getReports(): Promise<Report[]> {
    return await db.select().from(reports);
  }

  async getReportsByStudent(studentId: number): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.studentId, studentId));
  }

  async getReportsByClass(classId: number): Promise<Report[]> {
    const classStudents = await this.getStudentsByClass(classId);
    if (classStudents.length === 0) {
      return [];
    }
    
    const studentIds = classStudents.map(student => student.id);
    
    if (studentIds.length === 0) {
      return [];
    }
    
    // Se houver vários estudantes, temos que verificar um por um
    let allReports: Report[] = [];
    
    for (const studentId of studentIds) {
      const studentReports = await db.select().from(reports).where(eq(reports.studentId, studentId));
      allReports = [...allReports, ...studentReports];
    }
    
    return allReports;
  }

  async createReport(report: InsertReport): Promise<Report> {
    const result = await db.insert(reports).values(report).returning();
    return result[0];
  }

  async getClassesWithStudents(): Promise<ClassWithStudents[]> {
    const classes = await this.getClasses();
    const result: ClassWithStudents[] = [];
    
    for (const cls of classes) {
      const students = await this.getStudentsByClass(cls.id);
      const studentsWithReports: StudentWithReports[] = [];
      
      for (const student of students) {
        const reports = await this.getReportsByStudent(student.id);
        studentsWithReports.push({
          ...student,
          reports,
          reportCount: reports.length
        });
      }
      
      result.push({
        ...cls,
        students: studentsWithReports
      });
    }
    
    return result;
  }

  async getClassWithStudents(classId: number): Promise<ClassWithStudents | undefined> {
    const cls = await this.getClass(classId);
    if (!cls) return undefined;
    
    const students = await this.getStudentsByClass(classId);
    const studentsWithReports: StudentWithReports[] = [];
    
    for (const student of students) {
      const reports = await this.getReportsByStudent(student.id);
      studentsWithReports.push({
        ...student,
        reports,
        reportCount: reports.length
      });
    }
    
    return {
      ...cls,
      students: studentsWithReports
    };
  }
}

export const storage = new DatabaseStorage();