import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Verificar se DATABASE_URL está definido
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não está definido. Usando SQLite em memória como fallback.");
  process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/postgres";
}

// Configurar a conexão com o banco de dados com suporte a SSL para o Render
const connectionConfig = { 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
};

// Criar pool de conexões
export const pool = new Pool(connectionConfig);

// Adicionar tratamento de erro para o pool
pool.on('error', (err) => {
  console.error('Erro inesperado no pool do PostgreSQL', err);
  // Não fazer throw do erro para evitar que a aplicação caia
});

// Inicializar o drizzle com o pool
export const db = drizzle({ client: pool, schema });