import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let rustProcess: ChildProcess | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: true,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startRustBackend() {
  const rustBin = isDev
    ? path.join(__dirname, '../../backend/target/debug/wly-music-backend')
    : path.join(process.resourcesPath || '', 'bin/wly-music-backend');

  rustProcess = spawn(rustBin, [], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  rustProcess.stdout?.on('data', (data: Buffer) => {
    console.log('[Rust]', data.toString());
  });

  rustProcess.stderr?.on('data', (data: Buffer) => {
    console.error('[Rust Error]', data.toString());
  });

  rustProcess.on('close', (code: number | null) => {
    console.log(`Rust process exited with code ${code}`);
  });
}

ipcMain.handle('rust:send', async (_event: IpcMainInvokeEvent, command: string) => {
  return new Promise((resolve, reject) => {
    if (!rustProcess || !rustProcess.stdin) {
      reject(new Error('Rust process not running'));
      return;
    }

    let responseData = '';
    const timeout = setTimeout(() => {
      reject(new Error('Rust process timeout'));
    }, 5000);

    rustProcess.stdout?.once('data', (data: Buffer) => {
      clearTimeout(timeout);
      responseData += data.toString();
      try {
        resolve(JSON.parse(responseData));
      } catch {
        reject(new Error('Invalid JSON response'));
      }
    });

    rustProcess.stdin.write(command + '\n');
  });
});

app.whenReady().then(() => {
  startRustBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    rustProcess?.kill();
    app.quit();
  }
});