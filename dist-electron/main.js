"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const net_1 = __importDefault(require("net"));
const isDev = !electron_1.app.isPackaged;
function getFreePort() {
    return new Promise((resolve) => {
        const srv = net_1.default.createServer();
        srv.listen(0, '127.0.0.1', () => {
            const port = srv.address().port;
            srv.close(() => resolve(port));
        });
    });
}
function waitForPort(port, host = '127.0.0.1', timeoutMs = 15000) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        const tick = () => {
            const socket = new net_1.default.Socket();
            socket.setTimeout(1000);
            socket.once('connect', () => {
                socket.destroy();
                resolve();
            });
            const onFail = () => {
                socket.destroy();
                if (Date.now() - start > timeoutMs) {
                    reject(new Error(`Timeout esperando ${host}:${port}`));
                }
                else {
                    setTimeout(tick, 200);
                }
            };
            socket.once('error', onFail);
            socket.once('timeout', onFail);
            socket.connect(port, host);
        };
        tick();
    });
}
let mainWindow = null;
let nextProc = null;
let creating = false;
async function createWindow() {
    if (creating)
        return;
    creating = true;
    try {
        mainWindow = new electron_1.BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                preload: path_1.default.join(__dirname, 'preload.js'),
            },
        });
        if (isDev) {
            await mainWindow.loadURL('http://localhost:3000');
            mainWindow.webContents.openDevTools();
            return;
        }
        const port = await getFreePort();
        const nextDir = path_1.default.join(process.resourcesPath, 'next');
        const serverPath = path_1.default.join(nextDir, 'server.js');
        const dbPath = path_1.default.join(electron_1.app.getPath('userData'), 'app.db');
        console.log('[ELECTRON] resourcesPath:', process.resourcesPath);
        console.log('[ELECTRON] nextDir:', nextDir);
        console.log('[ELECTRON] serverPath:', serverPath);
        console.log('[ELECTRON] port:', port);
        console.log('[ELECTRON] dbPath:', dbPath);
        nextProc = (0, child_process_1.spawn)(process.execPath, ['--runAsNode', serverPath], {
            cwd: nextDir,
            env: {
                ...process.env,
                NODE_ENV: 'production',
                PORT: String(port),
                HOSTNAME: '127.0.0.1',
                DATABASE_URL: `file:${dbPath}`,
            },
            stdio: 'inherit',
        });
        nextProc.on('error', (err) => {
            console.error('[NEXT] spawn error:', err);
        });
        nextProc.on('exit', (code, signal) => {
            console.error('[NEXT] exited', { code, signal });
        });
        // espera a porta abrir (não HTTP)
        await waitForPort(port);
        await mainWindow.loadURL(`http://127.0.0.1:${port}`);
    }
    catch (err) {
        console.error('[ELECTRON] createWindow failed:', err);
        electron_1.dialog.showErrorBox('Falha ao iniciar', String(err?.message ?? err));
        electron_1.app.quit();
    }
    finally {
        creating = false;
    }
}
const gotLock = electron_1.app.requestSingleInstanceLock();
if (!gotLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized())
                mainWindow.restore();
            mainWindow.focus();
        }
    });
}
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => {
    if (nextProc)
        nextProc.kill();
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
