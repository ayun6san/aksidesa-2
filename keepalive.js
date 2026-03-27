const { spawn } = require('child_process');
const http = require('http');

let nextProcess = null;
let isRestarting = false;

function startNextServer() {
    if (isRestarting) return;
    isRestarting = true;
    
    console.log('Starting Next.js server...');
    
    nextProcess = spawn('node', ['node_modules/.bin/next', 'dev', '-p', '3000'], {
        stdio: 'inherit',
        shell: true
    });
    
    nextProcess.on('exit', (code) => {
        console.log(`Next.js server exited with code ${code}`);
        isRestarting = false;
        setTimeout(startNextServer, 2000);
    });
    
    nextProcess.on('error', (err) => {
        console.error('Failed to start Next.js:', err);
        isRestarting = false;
        setTimeout(startNextServer, 2000);
    });
    
    setTimeout(() => {
        isRestarting = false;
    }, 5000);
}

function healthCheck() {
    http.get('http://localhost:3000/api/auth/session', (res) => {
        console.log('Health check OK');
    }).on('error', (err) => {
        console.log('Health check failed:', err.message);
    });
}

// Start the server
startNextServer();

// Health check every 10 seconds
setInterval(healthCheck, 10000);

// Keep the process alive
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, keeping server alive');
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, keeping server alive');
});
