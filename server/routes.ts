import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertClassSchema, insertStudentSchema, insertReportSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Classes API
  app.get("/api/classes", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Não autorizado");
    
    try {
      const classes = await storage.getClasses();
      res.json(classes);
    } catch (error) {
      res.status(500).send("Erro ao buscar turmas");
    }
  });
  
  app.get("/api/classes/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Não autorizado");
    
    try {
      const classId = parseInt(req.params.id);
      if (isNaN(classId)) {
        return res.status(400).send("ID de turma inválido");
      }
      
      const classData = await storage.getClassWithStudents(classId);
      if (!classData) {
        return res.status(404).send("Turma não encontrada");
      }
      
      res.json(classData);
    } catch (error) {
      res.status(500).send("Erro ao buscar dados da turma");
    }
  });
  
  app.post("/api/classes", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).send("Apenas administradores podem criar turmas");
    }
    
    try {
      const validatedData = insertClassSchema.parse(req.body);
      const existingClass = await storage.getClassByName(validatedData.name);
      
      if (existingClass) {
        return res.status(400).send("Já existe uma turma com este nome");
      }
      
      const newClass = await storage.createClass(validatedData);
      res.status(201).json(newClass);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).send("Erro ao criar turma");
    }
  });
  
  // Students API
  app.get("/api/students", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Não autorizado");
    
    try {
      const classId = req.query.classId ? parseInt(req.query.classId as string) : undefined;
      
      let students;
      if (classId && !isNaN(classId)) {
        students = await storage.getStudentsByClass(classId);
      } else {
        students = await storage.getStudents();
      }
      
      res.json(students);
    } catch (error) {
      res.status(500).send("Erro ao buscar alunos");
    }
  });
  
  app.post("/api/students", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Não autorizado");
    
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      
      // Verify that the class exists
      const classData = await storage.getClass(validatedData.classId);
      if (!classData) {
        return res.status(400).send("Turma não encontrada");
      }
      
      const newStudent = await storage.createStudent(validatedData);
      res.status(201).json(newStudent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).send("Erro ao adicionar aluno");
    }
  });
  
  app.post("/api/students/bulk", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).send("Apenas administradores podem fazer importação em massa");
    }
    
    try {
      const { classId, names } = req.body;
      
      if (!classId || !names || !Array.isArray(names) || names.length === 0) {
        return res.status(400).send("Dados inválidos para importação");
      }
      
      // Verify that the class exists
      const classData = await storage.getClass(classId);
      if (!classData) {
        return res.status(400).send("Turma não encontrada");
      }
      
      const studentsToAdd = names.map(name => ({
        name: name.trim(),
        classId
      }));
      
      const newStudents = await storage.createManyStudents(studentsToAdd);
      res.status(201).json(newStudents);
    } catch (error) {
      res.status(500).send("Erro ao importar alunos");
    }
  });
  
  // Editar aluno
  app.put("/api/students/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Não autorizado");
    
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).send("ID de aluno inválido");
      }
      
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).send("Aluno não encontrado");
      }
      
      const validatedData = insertStudentSchema.parse(req.body);
      
      // Verify that the class exists
      const classData = await storage.getClass(validatedData.classId);
      if (!classData) {
        return res.status(400).send("Turma não encontrada");
      }
      
      const updatedStudent = await storage.updateStudent(studentId, validatedData);
      res.json(updatedStudent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).send("Erro ao atualizar aluno");
    }
  });
  
  // Excluir aluno
  app.delete("/api/students/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Não autorizado");
    
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).send("ID de aluno inválido");
      }
      
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).send("Aluno não encontrado");
      }
      
      await storage.deleteStudent(studentId);
      res.status(200).send("Aluno removido com sucesso");
    } catch (error) {
      res.status(500).send("Erro ao excluir aluno");
    }
  });
  
  // Reports API
  app.get("/api/reports", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Não autorizado");
    
    try {
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      const classId = req.query.classId ? parseInt(req.query.classId as string) : undefined;
      
      let reports;
      if (studentId && !isNaN(studentId)) {
        reports = await storage.getReportsByStudent(studentId);
      } else if (classId && !isNaN(classId)) {
        reports = await storage.getReportsByClass(classId);
      } else {
        reports = await storage.getReports();
      }
      
      res.json(reports);
    } catch (error) {
      res.status(500).send("Erro ao buscar relatórios");
    }
  });
  
  app.post("/api/reports", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Não autorizado");
    
    try {
      const reportData = {
        ...req.body,
        createdBy: req.user.id,
        date: new Date(req.body.date)
      };
      
      const validatedData = insertReportSchema.parse(reportData);
      
      // Verify that the student exists
      const student = await storage.getStudent(validatedData.studentId);
      if (!student) {
        return res.status(400).send("Aluno não encontrado");
      }
      
      const newReport = await storage.createReport(validatedData);
      res.status(201).json(newReport);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).send("Erro ao criar relatório");
    }
  });
  
  // Get all data for dashboard
  app.get("/api/dashboard", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Não autorizado");
    
    try {
      const classes = await storage.getClassesWithStudents();
      res.json(classes);
    } catch (error) {
      res.status(500).send("Erro ao carregar dados do dashboard");
    }
  });
  
  // Users API (for admin)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
      return res.status(403).send("Apenas administradores podem listar usuários");
    }
    
    try {
      const users = Array.from((storage as any).usersMap.values()).map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(users);
    } catch (error) {
      res.status(500).send("Erro ao buscar usuários");
    }
  });

  const httpServer = createServer(app);
  
  return httpServer;
}
