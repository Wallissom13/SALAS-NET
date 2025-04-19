import session from "express-session";
import memorystore from "memorystore";
import { User, Class, Student, Report, ClassWithStudents, StudentWithReports, 
  InsertUser, InsertClass, InsertStudent, InsertReport } from "@shared/schema";
import pg from "pg";
import connectPg from "connect-pg-simple";
import { eq, and, or } from "drizzle-orm";
import { db } from "./db";
import { users, classes, students, reports } from "@shared/schema";

const MemoryStore = memorystore(session);

const PostgresSessionStore = connectPg(session);

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
    // Usar banco de dados PostgreSQL se disponível, caso contrário usar MemoryStore
    if (process.env.DATABASE_URL) {
      const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
      });
      
      this.sessionStore = new PostgresSessionStore({
        pool,
        createTableIfMissing: true,
        tableName: 'session'
      });
    } else {
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000,
      });
    }
    
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

  private async initializeStudents() {
    // Class 6A
    const class6AId = (await this.getClassByName("6A"))?.id || 0;
    this.createManyStudents([
      { name: "Ana Luiza Mendes", classId: class6AId },
      { name: "Bruno Costa Santos", classId: class6AId },
      { name: "Clara Oliveira Silva", classId: class6AId },
      { name: "Daniel Ferreira Gomes", classId: class6AId },
      { name: "Eduardo Rocha Lima", classId: class6AId },
      { name: "Fernanda Santos Pereira", classId: class6AId },
      { name: "Gabriel Almeida Costa", classId: class6AId },
      { name: "Henrique Souza Martins", classId: class6AId },
      { name: "Isabela Oliveira Lima", classId: class6AId },
      { name: "João Pedro Silva Costa", classId: class6AId },
      { name: "Karina Lima Ferreira", classId: class6AId },
      { name: "Lucas Martins Alves", classId: class6AId },
      { name: "Maria Eduarda Santos", classId: class6AId },
      { name: "Nathalia Costa Lima", classId: class6AId },
      { name: "Pedro Henrique Gomes", classId: class6AId },
      { name: "Rafael Oliveira Santos", classId: class6AId },
      { name: "Sofia Santos Costa", classId: class6AId },
      { name: "Thiago Lima Oliveira", classId: class6AId },
      { name: "Vitória Ferreira Gomes", classId: class6AId },
    ]);
    
    // Class 6B
    const class6BId = (await this.getClassByName("6B"))?.id || 0;
    this.createManyStudents([
      { name: "Amanda Oliveira Costa", classId: class6BId },
      { name: "Bernardo Santos Lima", classId: class6BId },
      { name: "Camila Ferreira Silva", classId: class6BId },
      { name: "Diego Almeida Souza", classId: class6BId },
      { name: "Erick Gomes Martins", classId: class6BId },
      { name: "Gabriela Lima Costa", classId: class6BId },
      { name: "Heitor Santos Silva", classId: class6BId },
      { name: "Igor Oliveira Souza", classId: class6BId },
      { name: "Juliana Costa Santos", classId: class6BId },
      { name: "Larissa Ferreira Lima", classId: class6BId },
      { name: "Matheus Alves Pereira", classId: class6BId },
      { name: "Natália Santos Silva", classId: class6BId },
      { name: "Otávio Lima Costa", classId: class6BId },
      { name: "Paulo Henrique Martins", classId: class6BId },
      { name: "Queren Santos Oliveira", classId: class6BId },
      { name: "Renato Ferreira Alves", classId: class6BId },
      { name: "Sabrina Costa Gomes", classId: class6BId },
      { name: "Túlio Lima Santos", classId: class6BId },
      { name: "Verônica Silva Martins", classId: class6BId },
    ]);
    
    // Class 6C
    const class6CId = (await this.getClassByName("6C"))?.id || 0;
    this.createManyStudents([
      { name: "Alexandre Souza Castro", classId: class6CId },
      { name: "Beatriz Lima Fernandes", classId: class6CId },
      { name: "Carolina Martins Silva", classId: class6CId },
      { name: "Davi Oliveira Santos", classId: class6CId },
      { name: "Eduarda Costa Almeida", classId: class6CId },
      { name: "Felipe Lima Gomes", classId: class6CId },
      { name: "Giovana Santos Oliveira", classId: class6CId },
      { name: "Hugo Silva Martins", classId: class6CId },
      { name: "Isabella Costa Ferreira", classId: class6CId },
      { name: "João Miguel Lima", classId: class6CId },
      { name: "Karla Oliveira Santos", classId: class6CId },
      { name: "Leonardo Silva Costa", classId: class6CId },
      { name: "Mariana Ferreira Lima", classId: class6CId },
      { name: "Nathan Oliveira Martins", classId: class6CId },
      { name: "Olivia Santos Silva", classId: class6CId },
      { name: "Paulo Ricardo Ferreira", classId: class6CId },
      { name: "Quezia Lima Oliveira", classId: class6CId },
      { name: "Ricardo Santos Gomes", classId: class6CId },
      { name: "Sophia Lima Castro", classId: class6CId },
    ]);
    
    // Class 7A
    const class7AId = (await this.getClassByName("7A"))?.id || 0;
    this.createManyStudents([
      { name: "André Santos Silva", classId: class7AId },
      { name: "Bianca Lima Oliveira", classId: class7AId },
      { name: "Carlos Eduardo Gomes", classId: class7AId },
      { name: "Daniela Ferreira Santos", classId: class7AId },
      { name: "Elisa Costa Lima", classId: class7AId },
      { name: "Felipe Oliveira Martins", classId: class7AId },
      { name: "Giovanna Santos Costa", classId: class7AId },
      { name: "Henrique Lima Silva", classId: class7AId },
      { name: "Isadora Ferreira Gomes", classId: class7AId },
      { name: "João Vítor Oliveira", classId: class7AId },
      { name: "Letícia Santos Lima", classId: class7AId },
      { name: "Marcos Vinícius Costa", classId: class7AId },
      { name: "Nicole Oliveira Santos", classId: class7AId },
      { name: "Otávio Ferreira Lima", classId: class7AId },
      { name: "Patrícia Costa Silva", classId: class7AId },
      { name: "Rafael Gomes Santos", classId: class7AId },
      { name: "Sarah Lima Oliveira", classId: class7AId },
      { name: "Thiago Costa Ferreira", classId: class7AId },
      { name: "Valentina Santos Gomes", classId: class7AId },
    ]);
    
    // Class 7B
    const class7BId = (await this.getClassByName("7B"))?.id || 0;
    this.createManyStudents([
      { name: "Antônio Carlos Lima", classId: class7BId },
      { name: "Beatriz Santos Oliveira", classId: class7BId },
      { name: "Caio Henrique Gomes", classId: class7BId },
      { name: "Débora Lima Costa", classId: class7BId },
      { name: "Enzo Ferreira Santos", classId: class7BId },
      { name: "Fernanda Silva Lima", classId: class7BId },
      { name: "Gustavo Oliveira Costa", classId: class7BId },
      { name: "Helena Santos Silva", classId: class7BId },
      { name: "Isaac Lima Ferreira", classId: class7BId },
      { name: "Júlia Costa Oliveira", classId: class7BId },
      { name: "Kaique Santos Gomes", classId: class7BId },
      { name: "Lorena Lima Silva", classId: class7BId },
      { name: "Miguel Costa Santos", classId: class7BId },
      { name: "Natália Ferreira Lima", classId: class7BId },
      { name: "Otávio Gomes Oliveira", classId: class7BId },
      { name: "Pâmela Santos Costa", classId: class7BId },
      { name: "Rodrigo Lima Silva", classId: class7BId },
      { name: "Sofia Ferreira Santos", classId: class7BId },
      { name: "Thales Costa Oliveira", classId: class7BId },
    ]);
    
    // Class 7C
    const class7CId = (await this.getClassByName("7C"))?.id || 0;
    this.createManyStudents([
      { name: "Arthur Silva Mendes", classId: class7CId },
      { name: "Bruna Costa Oliveira", classId: class7CId },
      { name: "Caio Ferreira Santos", classId: class7CId },
      { name: "Diana Lima Gomes", classId: class7CId },
      { name: "Enzo Gabriel Martins", classId: class7CId },
      { name: "Fernanda Oliveira Costa", classId: class7CId },
      { name: "Gustavo Santos Silva", classId: class7CId },
      { name: "Helena Costa Ferreira", classId: class7CId },
      { name: "Igor Lima Oliveira", classId: class7CId },
      { name: "Júlia Santos Costa", classId: class7CId },
      { name: "Kevin Lima Silva", classId: class7CId },
      { name: "Laura Ferreira Santos", classId: class7CId },
      { name: "Mateus Oliveira Lima", classId: class7CId },
      { name: "Nicole Santos Silva", classId: class7CId },
      { name: "Otávio Lima Costa", classId: class7CId },
      { name: "Paula Ferreira Oliveira", classId: class7CId },
      { name: "Richard Silva Santos", classId: class7CId },
      { name: "Sabrina Lima Costa", classId: class7CId },
      { name: "Thiago Oliveira Ferreira", classId: class7CId },
    ]);
    
    // Class 8A - Adicionando novos alunos da turma 8A
    const class8AId = (await this.getClassByName("8A"))?.id || 0;
    this.createManyStudents([
      { name: "ADRIELE DA SILVA SANTOS", classId: class8AId },
      { name: "ALANNY CAUINY FERREIRA DA SILVA", classId: class8AId },
      { name: "ALICE VITÓRIA SILVA OLIVEIRA", classId: class8AId },
      { name: "ANA JÚLIA SOUSA DE OLIVEIRA", classId: class8AId },
      { name: "ANA LUIZA CASTRO VIANA", classId: class8AId },
      { name: "ANA VITÓRIA NASCIMENTO SOARES", classId: class8AId },
      { name: "CARLOS VANIEL SENA FARIAS", classId: class8AId },
      { name: "CESAR MYCHELL CARDOSO SILVA", classId: class8AId },
      { name: "DAVI TEIXEIRA DA SILVA", classId: class8AId },
      { name: "EDUARDO SILVA PEREIRA", classId: class8AId },
      { name: "EMILY VITÓRIA LICAR NUNES", classId: class8AId },
      { name: "HIGOR GABRIEL SILVA SOARES", classId: class8AId },
      { name: "JAMYLY GOMES DA SILVA", classId: class8AId },
      { name: "JOÃO LOURENÇO DA SILVA NETO", classId: class8AId },
      { name: "JULIA MOYA PEREIRA GARCIA", classId: class8AId },
      { name: "JULLIANE SOPHIA QUEIROZ MOURA", classId: class8AId },
      { name: "LAIS MORAIS SILVA", classId: class8AId },
      { name: "LUIS FILIPE ALVES DOS SANTOS", classId: class8AId },
      { name: "LUIS GUSTAVO MACARIO FERREIRA", classId: class8AId },
      { name: "LUIZ GUSTAVO RAMOS LEOCADIO", classId: class8AId },
      { name: "MARIA FERNANDA RIBEIRO DA SILVA", classId: class8AId },
      { name: "NICOLLE GABRIELE SANTANA BORGES", classId: class8AId },
      { name: "PEDRO LUCAS SILVA SANTOS DE LIMA", classId: class8AId },
      { name: "PYETRA LUÍSA GOMES AMARAL", classId: class8AId },
      { name: "RUAN ARAÚJO SOUZA", classId: class8AId },
      { name: "SAMUEL DELCIDIO NAVA CASTILHO", classId: class8AId },
      { name: "STEFANY DA SILVA COSTA", classId: class8AId },
      { name: "THAMIRES PROTÁZIO DOS SANTOS", classId: class8AId },
      { name: "THATIANE NICOLY SANTANA DOS SANTOS", classId: class8AId },
      { name: "YASMIM GOMES DA SILVA", classId: class8AId },
      { name: "MARIA LETÍCIA LIMA OLIVEIRA", classId: class8AId },
      { name: "LUANY MEIRELES DE SIQUEIRA", classId: class8AId },
      { name: "PRISCILA FIRMINO ALVES", classId: class8AId },
      { name: "STHEFANY RODRIGUES DE ANDRADE", classId: class8AId },
      { name: "LUIZ OTÁVIO QUEIROZ", classId: class8AId },
      { name: "IARA MARIANE DA SILVA DIAS", classId: class8AId },
    ]);
    
    // Class 8B - Adicionando novos alunos da turma 8B
    const class8BId = (await this.getClassByName("8B"))?.id || 0;
    this.createManyStudents([
      { name: "ANGELICA MACIEL ZAQUEU DIAS", classId: class8BId },
      { name: "ARTHUR DOS SANTOS CLEMENTE", classId: class8BId },
      { name: "ARTHUR MOUSINHO DE SOUZA", classId: class8BId },
      { name: "ARTHUR WELBERTY MUNIZ ROCHA", classId: class8BId },
      { name: "BRENDA YASMIN DA HORA FERNANDES", classId: class8BId },
      { name: "ELOISY GABRIELLA COSTA DA SILVA", classId: class8BId },
      { name: "GABRIELA DOS SANTOS BASTOS", classId: class8BId },
      { name: "GABRIELY CUNHA DA CONCEIÇÃO", classId: class8BId },
      { name: "IZABELLY KELLEN DE SOUZA SILVA", classId: class8BId },
      { name: "JONAS DOS SANTOS GOMES JUNIOR", classId: class8BId },
      { name: "KAIO VITOR NOBRE DE SOUZA", classId: class8BId },
      { name: "KAUA ARAÚJO SANTOS", classId: class8BId },
      { name: "LUIZ PHELIPE SOUSA CANDIDO BATISTA", classId: class8BId },
      { name: "MANUELLY COELHO SILVA FERREIRA", classId: class8BId },
      { name: "MARCOS PAULO PEREIRA SENA", classId: class8BId },
      { name: "MARCOS RENNAN SOUZA FERREIRA", classId: class8BId },
      { name: "MARIA CLARA TEIXEIRA DIAS", classId: class8BId },
      { name: "MARIA EDUARDA DA CONCEIÇÃO", classId: class8BId },
      { name: "MIGUEL LIMA VICENTE", classId: class8BId },
      { name: "MYKAEL PEREIRA DE ASSIS", classId: class8BId },
      { name: "NICOLLE CECILIA LOPES HIPOLITO", classId: class8BId },
      { name: "PAULA GEOVANNA SOARES BARROS REZENDE", classId: class8BId },
      { name: "RAFAEL MENEZES DO NASCIMENTO", classId: class8BId },
      { name: "RAÍSSA DE ALMEIDA CONCEIÇÃO", classId: class8BId },
      { name: "RAVENNA OLIVEIRA MESSIAS", classId: class8BId },
      { name: "RHUAN CARLOS MARQUES VIEIRA", classId: class8BId },
      { name: "RICHARD BORGES DE JESUS", classId: class8BId },
      { name: "RUAN PABLO DAS NEVES ROCHA", classId: class8BId },
      { name: "VICTOR ENZO PERIATO SILVA", classId: class8BId },
      { name: "YASMIN PAULINO MENDES", classId: class8BId },
      { name: "MARIA ISABELA DA SILVA TORRES", classId: class8BId },
      { name: "MARCOS ANDRÉ BATISTA DOS REIS", classId: class8BId },
      { name: "EMILY CRISTINA FRANÇA DA SILVA", classId: class8BId },
    ]);
    
    // Class 9B - Adicionando novos alunos da turma 9B
    const class9BId = (await this.getClassByName("9B"))?.id || 0;
    this.createManyStudents([
      { name: "ANA KARLA AVELINA DOS ANJOS", classId: class9BId },
      { name: "ANELYSE MOREIRA GUIMARÃES", classId: class9BId },
      { name: "ANNA JULYA ALVES ALBUQUERQUE", classId: class9BId },
      { name: "ARIELE ALVES BATISTA", classId: class9BId },
      { name: "DANIEL GONÇALVES SOUSA", classId: class9BId },
      { name: "DAVI MARÇAL GONDIM", classId: class9BId },
      { name: "EDUARDO PEREIRA DA SILVA", classId: class9BId },
      { name: "FAGNER OLIVEIRA DOS SANTOS", classId: class9BId },
      { name: "GABRIEL ROSA DOS SANTOS", classId: class9BId },
      { name: "GUILHERME SANTOS LINS CORREIA", classId: class9BId },
      { name: "HEITOR FILIPE DA COSTA", classId: class9BId },
      { name: "ISABELLA ALICE GONÇALVES DE MACEDO", classId: class9BId },
      { name: "ISABELLY CRISTINE ALVES DE ALMEIDA", classId: class9BId },
      { name: "JACIANE DA CONCEIÇÃO SOARES", classId: class9BId },
      { name: "JANDERSON SOUSA ALVES", classId: class9BId },
      { name: "JOÃO AMIEL DOS SANTOS ARAUJO", classId: class9BId },
      { name: "JOÃO GUILHERME RODRIGUES DA CUNHA", classId: class9BId },
      { name: "JOÃO VITOR NASCIMENTO SOARES", classId: class9BId },
      { name: "JOÃO VITOR SILVA DOS SANTOS", classId: class9BId },
      { name: "KANANDA VIEIRA DA ROCHA", classId: class9BId },
      { name: "KAYKY SOUZA GODOI", classId: class9BId },
      { name: "LUAN DOMINIQUE RIBEIRO SOUZA", classId: class9BId },
      { name: "LUÍZA LOPES DE PAULA", classId: class9BId },
      { name: "MARCOS RIAN MUNIZ FERREIRA", classId: class9BId },
      { name: "MARIA EDUARDA DO NASCIMENTO MORAES", classId: class9BId },
      { name: "MARIA EDUARDA RODRIGUES VIEIRA", classId: class9BId },
      { name: "MAYSA PEREIRA DE SOUSA", classId: class9BId },
      { name: "MIGUEL ALTOMARI GONÇALVES", classId: class9BId },
      { name: "MILENA ALVES DE SOUSA", classId: class9BId },
      { name: "NICOLAS DANIEL SOUZA SILVA", classId: class9BId },
      { name: "RUAN SANTOS MUNIZ", classId: class9BId },
      { name: "RYAN ALVES DA SILVA", classId: class9BId },
      { name: "STEFANY SILVA MAURIZ", classId: class9BId },
      { name: "SWYANG LORRANNY SOUZA NASCIMENTO", classId: class9BId },
      { name: "THAYLLA KELLY SOUSA DE ASSUNÇÃO", classId: class9BId },
      { name: "THAYLON FRANCIEL ALVES DE OLIVEIRA", classId: class9BId },
      { name: "TIFANY NICOLE GOMES DOS SANTOS", classId: class9BId },
      { name: "WALLISSON SANTOS DA SILVA", classId: class9BId },
      { name: "KAWAN MARÇAL CARVALHO", classId: class9BId },
      { name: "JOÃO GABRIEL GOMES ROMANO", classId: class9BId },
      { name: "MARIA CLARA OLIVIERA SANTOS", classId: class9BId },
    ]);
    
    // Class 9A
    const class9AId = (await this.getClassByName("9A"))?.id || 0;
    this.createManyStudents([
      { name: "Alex Santos Lima", classId: class9AId },
      { name: "Bruna Costa Silva", classId: class9AId },
      { name: "Carlos Eduardo Ferreira", classId: class9AId },
      { name: "Danielle Oliveira Santos", classId: class9AId },
      { name: "Enzo Gabriel Lima", classId: class9AId },
      { name: "Flávia Costa Gomes", classId: class9AId },
      { name: "Guilherme Santos Silva", classId: class9AId },
      { name: "Heloísa Lima Oliveira", classId: class9AId },
      { name: "Igor Ferreira Costa", classId: class9AId },
      { name: "Júlia Santos Gomes", classId: class9AId },
      { name: "Kevin Lima Silva", classId: class9AId },
      { name: "Larissa Oliveira Santos", classId: class9AId },
      { name: "Mateus Costa Lima", classId: class9AId },
      { name: "Nathália Ferreira Silva", classId: class9AId },
      { name: "Otávio Santos Costa", classId: class9AId },
      { name: "Priscila Lima Oliveira", classId: class9AId },
      { name: "Renan Ferreira Gomes", classId: class9AId },
      { name: "Sabrina Santos Silva", classId: class9AId },
      { name: "Thiago Lima Costa", classId: class9AId },
    ]);
    
    // Class 9C
    const class9CId = (await this.getClassByName("9C"))?.id || 0;
    this.createManyStudents([
      { name: "Arthur Lima Santos", classId: class9CId },
      { name: "Bianca Costa Silva", classId: class9CId },
      { name: "Caio Oliveira Lima", classId: class9CId },
      { name: "Daniela Santos Ferreira", classId: class9CId },
      { name: "Eduardo Costa Gomes", classId: class9CId },
      { name: "Fabiana Lima Silva", classId: class9CId },
      { name: "Gustavo Santos Oliveira", classId: class9CId },
      { name: "Isabela Lima Costa", classId: class9CId },
      { name: "João Pedro Ferreira", classId: class9CId },
      { name: "Kamila Santos Silva", classId: class9CId },
      { name: "Leonardo Lima Oliveira", classId: class9CId },
      { name: "Monique Santos Costa", classId: class9CId },
      { name: "Nícolas Ferreira Lima", classId: class9CId },
      { name: "Olívia Santos Silva", classId: class9CId },
      { name: "Pedro Lima Costa", classId: class9CId },
      { name: "Rafaela Santos Oliveira", classId: class9CId },
      { name: "Samuel Lima Ferreira", classId: class9CId },
      { name: "Tatiane Santos Costa", classId: class9CId },
      { name: "Vicente Lima Silva", classId: class9CId },
    ]);
    
    // Simulated reports for students
    const students = await this.getStudents();
    const reporterTypes = ["Professor", "Líder", "Vice"];
    
    // Creating random reports (for about 20% of students)
    for (let i = 0; i < students.length * 0.2; i++) {
      const randomStudent = students[Math.floor(Math.random() * students.length)];
      const randomReporterType = reporterTypes[Math.floor(Math.random() * reporterTypes.length)];
      
      this.createReport({
        studentId: randomStudent.id,
        content: "Ocorrência de comportamento inadequado em sala de aula.",
        reporterType: randomReporterType,
        createdBy: 1, // Admin user
        date: new Date()
      });
      
      // Some students get multiple reports
      if (Math.random() < 0.5) {
        this.createReport({
          studentId: randomStudent.id,
          content: "Não realizou a atividade solicitada.",
          reporterType: randomReporterType,
          createdBy: 1, // Admin user
          date: new Date()
        });
      }
      
      // Few students get 3 or more reports
      if (Math.random() < 0.2) {
        this.createReport({
          studentId: randomStudent.id,
          content: "Uso de celular durante a aula.",
          reporterType: randomReporterType,
          createdBy: 1, // Admin user
          date: new Date()
        });
      }
    }
  }
}

// Exportar uma única instância que será compartilhada em todo o aplicativo
export const storage = new DatabaseStorage();