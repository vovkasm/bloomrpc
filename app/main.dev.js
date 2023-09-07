/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 */
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const MenuBuilder = require('./menu');

let mainWindow = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

require('electron-debug')();

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

  mainWindow.loadURL(`file://${__dirname}/app.html`);

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
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});
