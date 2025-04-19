// Script de inicialização para o Render
const path = require('path');
const { spawn } = require('child_process');

// Função para executar um comando npm
function runNpmCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Executando: npm ${command}`);
    
    const child = spawn('npm', [command], { 
      stdio: 'inherit',
      shell: true 
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Comando 'npm ${command}' falhou com código ${code}`));
        return;
      }
      resolve();
    });
  });
}

// Função para executar o servidor compilado
function runServer() {
  console.log('Iniciando o servidor...');
  
  // Se estamos no ambiente do Render, vamos usar o node para executar o arquivo compilado
  try {
    if (process.env.NODE_ENV === 'production') {
      // Execução direta com o Node
      require('./dist/index.js');
    } else {
      // Durante desenvolvimento, usar tsx para execução
      require('tsx')('server/index.ts');
    }
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

// Iniciar o servidor
runServer();