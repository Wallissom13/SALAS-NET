import { users, type User, type InsertUser, classes, type Class, type InsertClass, students, type Student, type InsertStudent, reports, type Report, type InsertReport, type StudentWithReports, type ClassWithStudents } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  
  // Report operations
  getReports(): Promise<Report[]>;
  getReportsByStudent(studentId: number): Promise<Report[]>;
  getReportsByClass(classId: number): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  
  // Combined data operations
  getClassesWithStudents(): Promise<ClassWithStudents[]>;
  getClassWithStudents(classId: number): Promise<ClassWithStudents | undefined>;
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private usersMap: Map<number, User>;
  private classesMap: Map<number, Class>;
  private studentsMap: Map<number, Student>;
  private reportsMap: Map<number, Report>;
  public sessionStore: session.SessionStore;
  private userIdCounter: number;
  private classIdCounter: number;
  private studentIdCounter: number;
  private reportIdCounter: number;

  constructor() {
    this.usersMap = new Map();
    this.classesMap = new Map();
    this.studentsMap = new Map();
    this.reportsMap = new Map();
    this.userIdCounter = 1;
    this.classIdCounter = 1;
    this.studentIdCounter = 1;
    this.reportIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
    });
    
    // Initialize with admin user
    this.createUser({
      username: "Wallisson10",
      password: "CEPI10",
      isAdmin: true
    });
    
    // Initialize with classes
    const classes = ["6A", "6B", "6C", "7A", "7B", "7C", "8A", "8B", "9B"];
    classes.forEach(className => {
      this.createClass({ name: className });
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersMap.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.usersMap.set(id, user);
    return user;
  }

  // Class operations
  async getClasses(): Promise<Class[]> {
    return Array.from(this.classesMap.values());
  }

  async getClass(id: number): Promise<Class | undefined> {
    return this.classesMap.get(id);
  }
  
  async getClassByName(name: string): Promise<Class | undefined> {
    return Array.from(this.classesMap.values()).find(
      (cls) => cls.name === name,
    );
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const id = this.classIdCounter++;
    const newClass: Class = { ...classData, id };
    this.classesMap.set(id, newClass);
    return newClass;
  }

  // Student operations
  async getStudents(): Promise<Student[]> {
    return Array.from(this.studentsMap.values());
  }

  async getStudentsByClass(classId: number): Promise<Student[]> {
    return Array.from(this.studentsMap.values()).filter(
      (student) => student.classId === classId,
    );
  }

  async getStudent(id: number): Promise<Student | undefined> {
    return this.studentsMap.get(id);
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const id = this.studentIdCounter++;
    const newStudent: Student = { ...student, id };
    this.studentsMap.set(id, newStudent);
    return newStudent;
  }
  
  async createManyStudents(studentsData: InsertStudent[]): Promise<Student[]> {
    const createdStudents: Student[] = [];
    
    for (const studentData of studentsData) {
      const newStudent = await this.createStudent(studentData);
      createdStudents.push(newStudent);
    }
    
    return createdStudents;
  }

  // Report operations
  async getReports(): Promise<Report[]> {
    return Array.from(this.reportsMap.values());
  }

  async getReportsByStudent(studentId: number): Promise<Report[]> {
    return Array.from(this.reportsMap.values()).filter(
      (report) => report.studentId === studentId,
    );
  }
  
  async getReportsByClass(classId: number): Promise<Report[]> {
    const students = await this.getStudentsByClass(classId);
    const studentIds = students.map(student => student.id);
    
    return Array.from(this.reportsMap.values()).filter(
      (report) => studentIds.includes(report.studentId),
    );
  }

  async createReport(report: InsertReport): Promise<Report> {
    const id = this.reportIdCounter++;
    const newReport: Report = { ...report, id };
    this.reportsMap.set(id, newReport);
    return newReport;
  }

  // Combined data operations
  async getClassesWithStudents(): Promise<ClassWithStudents[]> {
    const classes = await this.getClasses();
    const result: ClassWithStudents[] = [];
    
    for (const cls of classes) {
      const classWithStudents = await this.getClassWithStudents(cls.id);
      if (classWithStudents) {
        result.push(classWithStudents);
      }
    }
    
    return result;
  }

  async getClassWithStudents(classId: number): Promise<ClassWithStudents | undefined> {
    const cls = await this.getClass(classId);
    if (!cls) return undefined;
    
    const studentsInClass = await this.getStudentsByClass(classId);
    const studentsWithReports: StudentWithReports[] = [];
    
    for (const student of studentsInClass) {
      const studentReports = await this.getReportsByStudent(student.id);
      studentsWithReports.push({
        ...student,
        reports: studentReports,
        reportCount: studentReports.length
      });
    }
    
    return {
      ...cls,
      students: studentsWithReports
    };
  }
}

export const storage = new MemStorage();
