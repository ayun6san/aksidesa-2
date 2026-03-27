#!/usr/bin/env node

/**
 * AKSIDESA Watchdog - Aggressive Keepalive
 * Monitors and restarts Next.js with frequent health checks
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const WATCHDOG_PORT = 3000;
const NEXTJS_PORT = 3001;
const LOG_FILE = '/home/z/my-project/dev.log';

let nextjsProcess = null;
let restartCount = 0;
let isStarting = false;
let lastHealthCheck = Date.now();

function log(msg) {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    console.log(line.trim());
    try { fs.appendFileSync(LOG_FILE, line); } catch(e) {}
}

function startNextJS() {
    if (isStarting) return;
    isStarting = true;
    
    log('Starting Next.js...');
    
    try { fs.writeFileSync(LOG_FILE, ''); } catch(e) {}
    
    nextjsProcess = spawn('node', ['node_modules/.bin/next', 'dev', '-p', String(NEXTJS_PORT)], {
        cwd: '/home/z/my-project',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, PORT: String(NEXTJS_PORT) }
    });
    
    nextjsProcess.stdout.on('data', data => {
        try { fs.appendFileSync(LOG_FILE, data); } catch(e) {}
        process.stdout.write(data);
    });
    
    nextjsProcess.stderr.on('data', data => {
        try { fs.appendFileSync(LOG_FILE, data); } catch(e) {}
        process.stderr.write(data);
    });
    
    nextjsProcess.on('error', (err) => {
        log(`Error: ${err.message}`);
        nextjsProcess = null;
        isStarting = false;
    });
    
    nextjsProcess.on('exit', (code, signal) => {
        log(`Exit (code=${code}, signal=${signal})`);
        nextjsProcess = null;
        isStarting = false;
        restartCount++;
        if (restartCount < 50) {
            setTimeout(startNextJS, 1500);
        }
    });
    
    setTimeout(() => {
        isStarting = false;
        log(`Next.js PID: ${nextjsProcess?.pid || 'unknown'}`);
    }, 2000);
}

// HTTP proxy server
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${WATCHDOG_PORT}`);
    
    // Health check
    if (url.pathname === '/__health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, nextjs: !!nextjsProcess, restarts: restartCount }));
        return;
    }
    
    // Proxy to Next.js
    const proxy = http.request({
        hostname: 'localhost',
        port: NEXTJS_PORT,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: req.headers.host }
    }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });
    
    proxy.on('error', () => {
        res.writeHead(502, { 'Content-Type': 'text/html' });
        res.end(`<!DOCTYPE html><html><head><title>Loading...</title><meta http-equiv="refresh" content="2"></head>
<body style="background:linear-gradient(135deg,#059669,#0d9488);min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0;font-family:system-ui">
<div style="text-align:center;color:white"><h1 style="font-size:3rem;margin:0 0 1rem">AKSIDESA</h1>
<p>Memulai server...</p></div></body></html>`);
    });
    
    req.pipe(proxy);
});

// Aggressive health check every 3 seconds
function healthCheck() {
    http.get(`http://localhost:${NEXTJS_PORT}/api/auth/session`, (res) => {
        lastHealthCheck = Date.now();
        if (res.statusCode === 200) {
            restartCount = Math.max(0, restartCount - 1);
        }
    }).on('error', () => {
        if (!nextjsProcess && !isStarting) {
            log('Health failed, restarting...');
            startNextJS();
        }
    });
}

// Keep process alive - ping itself
function selfPing() {
    http.get(`http://localhost:${WATCHDOG_PORT}/__health`, () => {}).on('error', () => {});
}

// Start everything
server.listen(WATCHDOG_PORT, '0.0.0.0', () => {
    log(`Watchdog on :${WATCHDOG_PORT} -> Next.js on :${NEXTJS_PORT}`);
    startNextJS();
    
    // Health check every 3 seconds
    setInterval(healthCheck, 3000);
    
    // Self-ping every 2 seconds to keep process active
    setInterval(selfPing, 2000);
});

// Ignore termination signals
process.on('SIGTERM', () => log('SIGTERM ignored'));
process.on('SIGINT', () => log('SIGINT ignored'));
