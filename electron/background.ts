import * as path from 'path';
import * as os from 'os';
import { app, BrowserWindow, protocol, shell } from 'electron';
// import updaterModule from 'updater';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
const isProduction = process.env.NODE_ENV !== 'development';
const platform: 'darwin' | 'win32' | 'linux' = process.platform as any;
const architucture: '64' | '32' = os.arch() === 'x64' ? '64' : '32';
const headerSize = 32;

function createWindow() {
    console.log('System info', { isProduction, platform, architucture });

    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        minWidth: 960,
        minHeight: 640,
        backgroundColor: '#1d293d',
        webPreferences: {
            devTools: true,
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        },
        titleBarStyle: 'hiddenInset',
        frame: true,
        titleBarOverlay: platform === 'darwin' && { height: headerSize },
        title: 'TNY - Block Editor',
        autoHideMenuBar: true,
    });

    // Open web browser instead of new window
    mainWindow.webContents.setWindowOpenHandler((details) => {
        const { url } = details;
        if (url.startsWith('http')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    // Open devtools in development mode
    if (!isProduction) {
        mainWindow.webContents.openDevTools({mode: 'right'});
    }

    // Open the web interface
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:3000'); // nuxt dev server
    } else {
        mainWindow.loadFile(path.join(__dirname, 'public', 'index.html')); // production build
    }

    return mainWindow;
}

app.whenReady().then(async () => {
    const allWindows = BrowserWindow.getAllWindows()
    if (allWindows.length) {
        allWindows[0].focus()
    } else {
        createWindow()
    }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});