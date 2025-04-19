import { db } from './db';
import { users, classes } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Script para inicializar o banco de dados no Render
async function setupDb() {
  console.log('Configurando banco de dados...');
  
  try {
    // Verificar se já existe um usuário admin, se não, criar um
    const adminUser = await db.select().from(users).where(eq(users.username, "Wallisson10"));
    
    if (adminUser.length === 0) {
      console.log('Criando usuário admin padrão...');
      await db.insert(users).values({
        username: "Wallisson10",
        password: "CEPI10",
        isAdmin: true
      });
    }
    
    // Verificar se já existem turmas, se não, criar as turmas necessárias
    const existingClasses = await db.select().from(classes);
    
    if (existingClasses.length === 0) {
      console.log('Criando turmas padrão...');
      await db.insert(classes).values([
        { name: "6A" },
        { name: "6B" },
        { name: "6C" },
        { name: "7A" },
        { name: "7B" },
        { name: "7C" },
        { name: "8A" },
        { name: "8B" },
        { name: "9B" }
      ]);
    }
    
    console.log('Banco de dados configurado com sucesso!');
  } catch (error) {
    console.error('Erro ao configurar banco de dados:', error);
  }
}

export { setupDb };