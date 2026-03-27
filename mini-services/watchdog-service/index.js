#!/usr/bin/env node

/**
 * AKSIDESA Watchdog Service
 * Runs on port 3001 and keeps Next.js alive on port 3000
 */

const { spawn, exec } = require('child_process');
const http = require('http');
const fs = require('fs');

const PORT = 3001;
const NEXTJS_PORT = 3000;
const LOG_FILE = '/home/z/my-project/dev.log';

let nextjsProcess = null;
let restartCount = 0;

function log(msg) {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    console.log(line.trim());
    try { fs.appendFileSync(LOG_FILE, line); } catch(e) {}
}

function startNextJS() {
    log('Starting Next.js server...');
    
    nextjsProcess = spawn('node', ['node_modules/.bin/next', 'dev', '-p', String(NEXTJS_PORT)], {
        cwd: '/home/z/my-project',
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
    });
    
    nextjsProcess.stdout.on('data', data => {
        try { fs.appendFileSync(LOG_FILE, data); } catch(e) {}
        process.stdout.write(data);
    });
    
    nextjsProcess.stderr.on('data', data => {
        try { fs.appendFileSync(LOG_FILE, data); } catch(e) {}
        process.stderr.write(data);
    });
    
    nextjsProcess.on('exit', (code, signal) => {
        log(`Next.js exited (code=${code}, signal=${signal}), restarting...`);
        nextjsProcess = null;
        restartCount++;
        if (restartCount < 20) {
            setTimeout(startNextJS, 2000);
        } else {
            log('Max restarts reached');
        }
    });
    
    log(`Next.js PID: ${nextjsProcess.pid}`);
}

// HTTP server for health checks and control
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    
    if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'ok', 
            nextjs: nextjsProcess ? 'running' : 'stopped',
            pid: nextjsProcess?.pid || null,
            restarts: restartCount
        }));
    } else if (url.pathname === '/restart') {
        log('Manual restart requested');
        if (nextjsProcess) {
            nextjsProcess.kill('SIGTERM');
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'restarting' }));
    } else if (url.pathname === '/') {
        // Proxy to Next.js
        const proxy = http.request({
            hostname: 'localhost',
            port: NEXTJS_PORT,
            path: url.pathname + url.search,
            method: req.method,
            headers: req.headers
        }, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });
        proxy.on('error', () => {
            res.writeHead(502, { 'Content-Type': 'text/html' });
            res.end('<html><body><h1>Server Starting...</h1><p>Please wait...</p></body></html>');
        });
        req.pipe(proxy);
    } else {
        // Proxy all other requests to Next.js
        const proxy = http.request({
            hostname: 'localhost',
            port: NEXTJS_PORT,
            path: url.pathname + url.search,
            method: req.method,
            headers: req.headers
        }, (proxyRes) => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });
        proxy.on('error', () => {
            res.writeHead(502, { 'Content-Type': 'text/plain' });
            res.end('Server unavailable');
        });
        req.pipe(proxy);
    }
});

// Health check interval
setInterval(() => {
    http.get(`http://localhost:${NEXTJS_PORT}/api/auth/session`, (res) => {
        if (res.statusCode === 200) {
            restartCount = 0; // Reset on successful health check
        }
    }).on('error', () => {
        if (!nextjsProcess) {
            log('Health check failed, starting Next.js...');
            startNextJS();
        }
    });
}, 10000);

// Start
server.listen(PORT, '0.0.0.0', () => {
    log(`Watchdog service running on port ${PORT}`);
    // Clear log and start Next.js
    fs.writeFileSync(LOG_FILE, '');
    startNextJS();
});

process.on('SIGTERM', () => log('SIGTERM received'));
process.on('SIGINT', () => log('SIGINT received'));
