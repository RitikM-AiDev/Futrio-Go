import { app, BrowserWindow, globalShortcut, screen, ipcMain, safeStorage } from "electron";
import path from "path";
import fs from "fs";

let mainWindow: BrowserWindow | null = null;

const KEY_PATH        = path.join(app.getPath('userData'), 'key.bin')
const TAVILY_KEY_PATH = path.join(app.getPath('userData'), 'tavily.bin')
const SERPER_KEY_PATH = path.join(app.getPath('userData'), 'serper.bin')

// Helper: save any key encrypted
function saveKey(filePath: string, key: string) {
  const encrypted = safeStorage.encryptString(key)
  fs.writeFileSync(filePath, encrypted)
}

// Helper: load any key decrypted
function loadKey(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null
  const encrypted = fs.readFileSync(filePath)
  return safeStorage.decryptString(encrypted)
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const winWidth = 420;
  const winHeight = 680;

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: width - winWidth - 24,
    y: height - winHeight - 12,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    hasShadow: false,
    resizable: false,
    skipTaskbar: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  if (app.isPackaged) {
    mainWindow.loadFile(
      path.join(app.getAppPath(), "dist-react/index.html")
    );
  } else {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow()

  // Window controls
  ipcMain.on('minimize-window', () => {
    mainWindow?.minimize()
  })

  // ── Gemini API Key ──────────────────────────────────────
  ipcMain.handle('save-api-key', (_event, key: string) => {
    saveKey(KEY_PATH, key)
    return true
  })
  ipcMain.handle('get-api-key', () => loadKey(KEY_PATH))
  ipcMain.handle('has-api-key', () => fs.existsSync(KEY_PATH))

  // ── Tavily API Key ──────────────────────────────────────
  ipcMain.handle('save-tavily-key', (_event, key: string) => {
    saveKey(TAVILY_KEY_PATH, key)
    return true
  })
  ipcMain.handle('get-tavily-key', () => loadKey(TAVILY_KEY_PATH))

  // ── Serper API Key ──────────────────────────────────────
  ipcMain.handle('save-serper-key', (_event, key: string) => {
    saveKey(SERPER_KEY_PATH, key)
    return true
  })
  ipcMain.handle('get-serper-key', () => loadKey(SERPER_KEY_PATH))

  // Check all 3 keys exist (used to gate the app)
  ipcMain.handle('has-all-keys', () => {
    return fs.existsSync(KEY_PATH) &&
           fs.existsSync(TAVILY_KEY_PATH) &&
           fs.existsSync(SERPER_KEY_PATH)
  })

  const shortcuts = ["CommandOrControl+Shift+G", "CommandOrControl+Alt+G"];
  shortcuts.forEach((shortcut) => {
    globalShortcut.register(shortcut, () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      } else {
        createWindow();
      }
    });
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});