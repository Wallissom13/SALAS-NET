// Este script é usado para garantir que o 'npm start' funcione tanto no ambiente de desenvolvimento quanto em produção

// Módulos necessários
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Configura caminhos baseados no diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verifica se estamos em ambiente de produção (Render) ou desenvolvimento
const isProduction = process.env.NODE_ENV === 'production';

// Função para executar comandos npm
function runNpmCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Executando: ${command}`);
    
    const process = exec(command, { cwd: __dirname });
    
    process.stdout.on('data', (data) => console.log(data.toString()));
    process.stderr.on('data', (data) => console.error(data.toString()));
    
    process.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Falha ao executar: ${command}`));
      }
    });
  });
}

// Função para iniciar o servidor
async function runServer() {
  try {
    if (isProduction) {
      // Verifica se DATABASE_URL está configurado
      if (!process.env.DATABASE_URL) {
        console.error('\x1b[31m%s\x1b[0m', 'ERRO: Variável de ambiente DATABASE_URL não está definida');
        console.error('\x1b[33m%s\x1b[0m', 'No Render: Configure DATABASE_URL nas variáveis de ambiente do serviço');
        console.error('\x1b[33m%s\x1b[0m', 'Para desenvolvimento: Adicione DATABASE_URL=... no arquivo .env');
        process.exit(1);
      }
      
      console.log('\x1b[36m%s\x1b[0m', 'Iniciando em modo de produção...');
      
      // Verifica se o diretório dist existe
      if (!fs.existsSync(path.join(__dirname, 'dist'))) {
        console.log('\x1b[33m%s\x1b[0m', 'Diretório dist não encontrado, executando build...');
        await runNpmCommand('npm run build');
      }
      
      // Inicia o servidor de produção
      await runNpmCommand('NODE_ENV=production node dist/index.js');
    } else {
      // Ambiente de desenvolvimento
      console.log('\x1b[36m%s\x1b[0m', 'Iniciando em modo de desenvolvimento...');
      await runNpmCommand('NODE_ENV=development tsx server/index.ts');
    }
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `Erro ao iniciar o servidor: ${error.message}`);
    process.exit(1);
  }
}

// Inicia a execução
runServer().catch(err => {
  console.error('\x1b[31m%s\x1b[0m', `Erro fatal: ${err.message}`);
  process.exit(1);
});