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
    
    // Initialize with students for each class
    this.initializeStudents();
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
  
  async updateStudent(id: number, studentData: InsertStudent): Promise<Student> {
    const existingStudent = await this.getStudent(id);
    if (!existingStudent) {
      throw new Error("Aluno não encontrado");
    }
    
    const updatedStudent: Student = { ...studentData, id };
    this.studentsMap.set(id, updatedStudent);
    return updatedStudent;
  }
  
  async deleteStudent(id: number): Promise<void> {
    // Delete related reports first
    const reports = await this.getReportsByStudent(id);
    for (const report of reports) {
      this.reportsMap.delete(report.id);
    }
    
    this.studentsMap.delete(id);
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
  
  // Initialize students from provided list
  private async initializeStudents() {
    // List of students for 6A
    const students6A = [
      "ALEXIA DOS SANTOS FRANÇA",
      "ANA CLARA MARÇAL HAIDAR DE CASTRO",
      "ANA JULIA BATISTA DA SILVA",
      "ANA LAURA ALMEIDA REZENDE",
      "ANA LUIZA DE PAIVA VASCONCELOS",
      "ANNE SOFFIA COSTA GOMES",
      "ARTHUR BARBOSA DA SILVA",
      "BEATRIZ VALÉRIO DE SOUSA",
      "BIANCA IZADORA DA HORA FERNANDES",
      "CARLOS FERNANDO RODRIGUES CARNEIRO",
      "CONRADO GABRIEL FERREIRA SIMIONI",
      "EDUARDO DOS SANTOS MARTINS",
      "EMANUELY SEBASTIANA ALVES LIMA",
      "EMILY MONIQUE BATISTA DOS SANTOS",
      "ESTER HADASSAH GALIANO GALHARDO",
      "FABIO HENRIQUE SILVA DIAS",
      "FELIPE GABRIEL BATISTA SOARES",
      "GUSTAVO HENRIQUE SILVA NASCIMENTO",
      "ISABELA BORBA DE SOUZA",
      "ISABELLI PEREIRA DE SOUZA",
      "JÚLIA EDUARDA SAUDADES MAGALHÃES",
      "LARA MARIE CASTRO VIAΝΑ",
      "LARA REBECA DE ARAÚJO CHIMBA",
      "LAURA DO NASCIMENTO MORAES",
      "LETÍCIA DOS SANTOS MARTINS",
      "LORENA DA SILVA",
      "LORRANY DA SILVA",
      "LUAN FELIPE REYCHALHAM DA SILVA",
      "MARIA EDUARDA RODRIGUES DA SILVA",
      "MARIA VITORIA NASCIMENTO DE SOUSA",
      "MATHEUS HENRIQUE SOUSA SAMPAIO",
      "NICOLAS GOMES DOS SANTOS",
      "NICOLLY CRISTINE OLIVEIRA RODRIGUES",
      "STEFANY SOUZA ROCHA",
      "TAUANNA FERREIRA DA SILVA OLIVEIRA",
      "THALLES AUGUSTO ARAUJO BORGES",
      "VALENTIM GULTIEREZ DUARTE RODRIGUES",
      "VICTOR ALEJANDRO LEAL DA SILVA",
      "VITOR GABRIEL DA SILVA E SILVA",
      "YAN FELIPE ABADIO DOS SANTOS CIRINO",
      "YASMIM DA SILVA BARROS",
      "MARIA FLOR LIMA OLIVEIRA",
      "YASMIM DOS ANJOS COSTA"
    ];
    
    // List of students for 6B
    const students6B = [
      "ADRIAN DAVANZO ABIB CORTEZ",
      "ÁGATA BEATRIZ OLIVEIRA DOS SANTOS RAMOS",
      "AMANDA SOPHIA BORGES PEREIRA",
      "ANA GRAZIELLE SANTIAGO MELO",
      "ANA RAIANA DE ALMEIDA CONCEIÇÃO",
      "CRISTIAN DAVI SANTOS SILVA",
      "DEIVYD ALESSANDRO CAVALCANTE DE SOUZA",
      "EDUARDO BENTO AGUIAR",
      "ELISA RODRIGUES AMANCIO",
      "ISAQUE OLIVEIRA DA SILVA",
      "ISRAEL FERREIRA DE SOUZA",
      "JAMILY LORRANY SOARES MELO",
      "JEFFERSON THIAGO SOBREIRA NERIS",
      "JOÃO MIGUEL DUARTE DE MELO",
      "JOÃO PAULO ARRIEL DE ASSIS FILHO",
      "JOÃO PEDRO PEREIRA MONTEIRO",
      "KAUA HENRIQUE SOUSA ALVES DOS SANTOS",
      "KAUANY GABRIELY NASCIMENTO OLIVEIRA",
      "LARA MICHELE DE SOUSA MARTINS",
      "LUNNA SOPHIA RODRIGUES DA SILVA CARVALHO",
      "MANUELA APARECIDA PIRES FERNANDES",
      "MARCOS LINCOLN QUAIOTTI RIBEIRO",
      "MARIA EDUARDA OLIVEIRA DA SILVA",
      "MARIA PAULA VIEIRA SANTOS",
      "MARILIA GABRIELLE DA SILVA RODRIGUES",
      "MICHELLY ALVES DA SILVA",
      "NAILAH SUDHAMANI PRATA SCHUELER",
      "NATHALLY DANTAS CAPUCCE MACHADO",
      "PAULA KAUANY LIMA DA SILVA",
      "PAULO HENRIQUE RODRIGUES SOUSA",
      "PEDRO PEIXOTO DA SILVA",
      "RICHARLISON GUSTAVO DOS SANTOS BELEZA",
      "RYAN AQUINO DE ALMEIDA SOUZA",
      "RYANNA RYLARY DAS NEVES ROCHA",
      "SAMUEL ARANTES VERAS DE MORAIS",
      "SOFIA DE JESUS TRINDADE GOMES",
      "SOPHIA ARAUJO SANTOS",
      "VALENTINA FRÓES CRUZ",
      "YAGO DA SILVA BARROS",
      "MARIA EDUARDA NASCIMENTO SÁ",
      "DAVI LUCCA DOS SANTOS LIRA DE CARVALHO"
    ];
    
    // List of students for 6C
    const students6C = [
      "ALLYCE ARAUJO SANTOS",
      "ANA BEATRIZ XAVIER OLIVEIRA",
      "ANA VITÓRIA DANTAS",
      "ANGELLYNA ALVES PEREIRA",
      "CAIO VICTOR RODRIGUES DE LIMA",
      "DANIEL MEDEIROS CORRÊA SALDANHA",
      "DAVI LUCAS SOUSA NASCIMENTO",
      "ENZO DAVI COSTA DA SILVA",
      "ENZO GABRIEL SILVA BISPO",
      "GABRIEL CONCEIÇÃO CAVALCANTE DA SILVA",
      "GEOVANA MORAIS ANDRADE",
      "HITALO RAFAEL OEIRAS ABREU",
      "ITHALLO GUILHERME DA SILVA",
      "IZABELLY VICTORIA SANTOS ARAGÃO",
      "JHULLYA VITÓRIA ALVES MARTINS",
      "JOÃO VICTOR MACHADO",
      "JULIA EDUARDA BEZERRA DOS SANTOS",
      "JULIA FERREIRA BARBOSA DA SILVA",
      "JÚLIO CÉSAR SOARES DA COSTA",
      "JULLIA SOPHIA MELO BORGES",
      "KAUAN FERREIRA SOARES DO NASCIMENTO",
      "KELLY KEMYLLY FEITOSA DOS SANTOS",
      "LEVI MENEZES RAMALHO",
      "LUCAS EDUARDO COSTA SILVA",
      "MANUELLA DOS SANTOS ALVES AMORIM",
      "MARCELLY NOGUEIRA DE ALENCAR",
      "MARIA EDUARDA SOARES VIEIRA",
      "MARIA FERNANDA DE MEDEIROS ALVES",
      "NICOLAS SAMPAIO MARTINS",
      "NYKOLLAS KAUA CARNEIRO RIBEIRO",
      "PEDRO HENRIQUE FREITAS MESSIAS",
      "PEDRO VITOR FERREIRA OLIVEIRA",
      "SOPHIA VICTORYA FERREIRA DA SILVA RIBEIRO",
      "THAYLLA CRISTINA BRAGA DOS SANTOS",
      "VALENTYN GABRIEL MACHADO ALVES",
      "VITOR NASCIMENTO DA SILVA",
      "WESLEY DA SILVA",
      "PAULO HENRIQUE DA SILVA SOUZA",
      "JÚLIA VITÓRIA SILVA MEIRELES",
      "ARTHUR PEREIRA SILVESTRE"
    ];
    
    // List of students for 7A
    const students7A = [
      "AMANDA HICKMANNE SILVA FREITAS",
      "ANA BEATRIZ CORRÊA SOARES",
      "ANA BEATRIZ VICENTE DE ASSIS SILVA",
      "ANA CLARA JANUÁRIO DA SILVA",
      "ANA CLARA OLIVEIRA DOS SANTOS",
      "ANA JÚLIA REZENDE RIBEIRO",
      "ANA SOPHYA GOMES AMARAL",
      "BEATRIZ GOMES DE BRITO",
      "BRUNO DOS SANTOS ABREU",
      "CLARA SOPHIA DE PAULA RIBEIRO MARQUES",
      "DIOGO GONÇALVES DE ANDRADE",
      "EMILLY GONZAGA ROCHA",
      "ESTEFANY ALVES DOS SANTOS",
      "FELIPE VARGAS DE ARAÚJO",
      "FERNANDO EMANUEL DOURADO SALES DA CRUZ",
      "GABRIEL HENRIQUE DA SILA LEAL",
      "ISABELLA GONZAGA DE ALENCAR",
      "ΚΑΙΟ VITOR BARBOSA MACHADO",
      "LARA VITÓRIA ALVES DE SOUSA",
      "LUISE EMANUELE SANTOS",
      "LUIZ GABRIEL RODRIGUES RAMOS",
      "MARIA EDUARDA DÉA DE ANDRADE CASTELA",
      "MARIA EDUARDA MEDEIROS PESSOA DA SILVA",
      "MARIANNY ROCHA AMARAL",
      "MIGUEL DA SILVA NOVAES",
      "MILENA ROCHA SILVA",
      "PABLINNY DE SOUSA MIRANDA",
      "PEDRO HENRIQUE DE JESUS CONCEIÇÃO",
      "STELLA SOUSA VIEIRA",
      "VICTOR GABRIEL BORGES XAVIER",
      "WYSLLANE RAISLLANE DA SILVA ARAUJO",
      "YANN RAFAEL REZENDE SANTOS",
      "ARTHUR ARAÚJO LIMA",
      "DÁVIDE HENRIQUE BERNARDES DA SILVA",
      "HENZO LEVI SALES DA SILVA"
    ];
    
    // List of students for 7B
    const students7B = [
      "ADRIAN EMANUEL OLIVEIRA VOGADO",
      "ALEXIA ALVES DE OLIVEIRA",
      "ALISSON OLIVEIRA VOGADO",
      "CAIQUE DIAS BRAZ",
      "CARLOS EDUARDO GOMES DA SILVA",
      "CARLOS FELIPE DA SILVA",
      "CAUA VICTOR MENEZES DA SILVA",
      "DEIVYRLLAN KAIQUE BORBA ROCHA",
      "DIULIA RAMOS DE DEUS",
      "ELLEN CRISTINA PEREIRA DE MOURA",
      "EMILLY CAROLINY SILVA DE ASSUNÇÃO",
      "ERICK GABRIEL SILVA SANTANA",
      "FELLIPE GABRIEL MACHADO DA SILVA",
      "FRANCISCO KAUÃ DE SOUSA CRUZ",
      "GABRIEL SILVA DE OLIVEIRA",
      "GABRIELY VITÓRIA COSTA SOUSA",
      "GEOVANNA RAYELY CARVALHO DOS SANTOS",
      "GUILBERT ROMULLO DA SILVA SILVA",
      "GUILHERME FELIX ROMÃO CAVALHEIRO",
      "GUILHERME HENRIQUE LIMA",
      "HELOÁ DOS SANTOS SILVA",
      "ISAAC OLIVEIRA SILVA ARAÚJO",
      "ISABELLA DE ARAÚJO",
      "ISABELLA SOPHIA MOREIRA SOUZA",
      "ISABELY DA SILVA SANTOS",
      "JADISSON DE SOUSA ALVES",
      "JEFFERSON DUARTE MARQUES JUNIOR",
      "JOÃO LUCAS SOARES DAS NEVES",
      "JOSÉ LUIZ BARBOSA DE PAULA",
      "JÚLIA GOMES DA SILVA",
      "KAUA GUSTAVO LIMA PAULINO",
      "KAYRON WHALYSSON FERREIRA DE SOUSA COSTA",
      "KEMILLY VICTORIA DA SILVA BATISTA",
      "LUIS ANDRÉ OLIVEIRA DOS SANTOS MAGALHÃES",
      "MARIA CECÍLIA DE SOUZA HENRIQUE",
      "MATHEUS HENRIQUE FERREIRA DA SILVA",
      "PAULO GABRIEL DOS SANTOS SILVA",
      "PIETRA LINHARES LAZZARINI",
      "RAFAELLA CHRISTINE DE PAULA AMARAL",
      "TALYSSON MATEUS CARVALHO DE AGUIAR",
      "THEO MARÇAL GONDIM",
      "UESTER FELIPE SOARES DA SILVA"
    ];
    
    // List of students for 7C
    const students7C = [
      "ADRYAN MIGUEL OLIVEIRA CORDEIRO",
      "ANA JULIA ARAUJO DE SOUSA",
      "ANA LÍDIA FERREIRA DIAS LIMA",
      "ARYELA MOREIRA DE OLIVEIRA",
      "DAVI BRAGA PORTES",
      "EMANUELE SANTOS DE SOUSA",
      "ERICK GONZAGA ROCHA",
      "EVERTTON ARTHUR SOUZA NASCIMENTO",
      "HENRIQUE GABRIEL SANTOS FERREIRA",
      "ISABELLA CRISTINE SANTOS SOARES",
      "ISMAEL DE JESUS ALVES",
      "IZABELI PEREIRA BRANDÃO",
      "JOAO VITOR SOUSA MANGABEIRA",
      "JONATHAS HERNANE PEREIRA DE ARAUJO",
      "JOSEANE SOARES DE SOUZA",
      "JULIA GOMES DE BRITO",
      "JULIA LIMA DE OLIVEIRA",
      "LARA OLIVEIRA DE PAULA",
      "LARISSA LUZ DA SILVA",
      "LORRANE DE SANTANA SOUZA",
      "LUCAS MATHEUS MOURA CAIXETA",
      "MARCIA RHYANNA SILVA SAID",
      "MARIA EDUARDA DOS SANTOS SOUSA",
      "MARIA EDUARDA PEREIRA DA SILVA",
      "MISAEL PEREIRA SOUZA",
      "PABLO EDUARDO FERREIRA DE OLIVEIRA",
      "PAULO EDUARDO BATISTA RIBEIRO",
      "PEDRO HENRIKY MARTINS SOUZA",
      "PIETTRA SOFYA RIBEIRO DA SILVA",
      "RAFAELLA COSTA FERREIRA",
      "RAICON TAYLOR SOARES RODRIGUES"
    ];
    
    // Add students to their respective classes
    const class6A = await this.getClassByName("6A");
    const class6B = await this.getClassByName("6B");
    const class6C = await this.getClassByName("6C");
    const class7A = await this.getClassByName("7A");
    const class7B = await this.getClassByName("7B");
    const class7C = await this.getClassByName("7C");
    
    if (class6A) {
      await this.createManyStudents(students6A.map(name => ({ name, classId: class6A.id })));
    }
    
    if (class6B) {
      await this.createManyStudents(students6B.map(name => ({ name, classId: class6B.id })));
    }
    
    if (class6C) {
      await this.createManyStudents(students6C.map(name => ({ name, classId: class6C.id })));
    }
    
    if (class7A) {
      await this.createManyStudents(students7A.map(name => ({ name, classId: class7A.id })));
    }
    
    if (class7B) {
      await this.createManyStudents(students7B.map(name => ({ name, classId: class7B.id })));
    }
    
    if (class7C) {
      await this.createManyStudents(students7C.map(name => ({ name, classId: class7C.id })));
    }
  }
}

export const storage = new MemStorage();
