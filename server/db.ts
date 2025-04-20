import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from "@shared/schema";

// Configuração para websockets (necessário para Neon Database)
neonConfig.webSocketConstructor = ws;

// Verificar variáveis de ambiente e fornecer mensagens de erro claras
if (!process.env.DATABASE_URL) {
  console.error("ERRO: DATABASE_URL não está definido no ambiente.");
  console.error("Para desenvolvimento local: Certifique-se de que o .env contém DATABASE_URL");
  console.error("Para deploy no Render: Configure DATABASE_URL nas variáveis de ambiente");
  process.exit(1);
}

// Log para depuração em ambientes não-produção
if (process.env.NODE_ENV !== 'production') {
  console.log("Conectando ao banco de dados...");
}

// Inicializar o pool de conexões
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Configurações para funcionar no Render
  ssl: process.env.NODE_ENV === 'production'
});

// Verificar conexão durante inicialização
pool.on('error', (err) => {
  console.error('Erro na conexão com PostgreSQL:', err);
});

// Inicializar Drizzle ORM
const db = drizzle(pool, { schema });

// Exportar para uso em outros módulos
export { pool, db };