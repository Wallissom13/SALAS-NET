// Arquivo de inicialização para o Render
const { spawn } = require('child_process');

// Função para executar um script
function runScript(script) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [script], { stdio: 'inherit' });
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Script ${script} exited with code ${code}`));
        return;
      }
      resolve();
    });
  });
}

// Iniciar o servidor
async function startServer() {
  try {
    await runScript('./dist/index.js');
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Executar o servidor
startServer();