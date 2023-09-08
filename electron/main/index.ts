import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { join } from 'node:path'

import MenuBuilder from  './menu';

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '../')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL ? join(process.env.DIST_ELECTRON, '../public') : process.env.DIST

let mainWindow: BrowserWindow;

const store = require('electron-store');
store.initRenderer();

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', async () => {
  ipcMain.handle('open-proto-files', async () => {
    const openDialogResult = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [ { name: 'Protos', extensions: ['proto'] } ]
    });
  
    const filePaths = openDialogResult.filePaths;
    return filePaths || [];
  });

  ipcMain.handle('open-directory', async () => {
    const openDialogResult = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      filters: []
    });

    const filePaths = openDialogResult.filePaths;
    return filePaths || [];
  });

  ipcMain.handle('open-single-file', async () => {
    const openDialogResult = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [ { name: 'All', extensions: ['*'] } ]
    });

    const filePaths = openDialogResult.filePaths;
    return filePaths[0];
  });

  mainWindow = new BrowserWindow({
    show: false,
    width: 1324,
    height: 728,
    backgroundColor: "#f0f2f5",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(`${process.env.VITE_DEV_SERVER_URL}/public/app.html`)
  } else {
    mainWindow.loadFile(join(process.env.DIST, 'app.html'));
  }

  // https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.once('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }

    setTimeout(function() {
      mainWindow.show();
      mainWindow.focus();
    }, 150);
  });

  mainWindow.on('closed', () => {
    mainWindow = undefined as any;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});