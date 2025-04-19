const { spawn } = require('child_process');
const path = require('path');

// Configurar as variáveis de ambiente para produção
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Comandos a serem executados
const command = 'node';
const args = ['-r', 'esbuild-register', 'server/index.ts'];

// Iniciar o processo
const child = spawn(command, args, {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: process.env
});

// Lidar com o término do processo
child.on('close', (code) => {
  console.log(`Processo encerrado com código ${code}`);
  process.exit(code);
});

// Lidar com erros
child.on('error', (err) => {
  console.error('Erro ao iniciar o processo:', err);
  process.exit(1);
});

// Lidar com sinais do sistema
process.on('SIGTERM', () => {
  console.log('Recebido sinal SIGTERM, encerrando aplicação');
  child.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Recebido sinal SIGINT, encerrando aplicação');
  child.kill('SIGINT');
});