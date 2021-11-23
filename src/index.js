// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
var fs = require('fs');
var path = require('path');

try {
  require('electron-reloader')(module);
} catch { }

let mainWindow = null;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    frame: false
  })

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'))

  // Open the DevTools.
  mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
}) 

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('closeApp', (event, path) => {
  app.quit();
});

ipcMain.on('newfile', (event, path) => {
  const { dialog } = require('electron')
  dialog.showSaveDialog().then(result => {
    process.stdout.write("newfile? " + JSON.stringify(result) );
    if (!result.filePath) {
      process.stdout.write("No file selected");
    } else {
      event.sender.send('filepath', result.filePath)
      event.sender.send('fileData', "")
    }
  });
});

ipcMain.on('openFile', (event, path) => {
  const { dialog } = require('electron')
  const fs = require('fs')

  dialog.showOpenDialog().then(result => {
    // process.stdout.write("file? " + JSON.stringify(result) );
    if (result.filePaths.length < 1) {
      process.stdout.write("No file selected");
    } else {
      event.sender.send('filepath', result.filePaths[0])
      readFile(result.filePaths[0]);
    }
  });

  function readFile(filepath) {
    fs.readFile(filepath, 'utf-8', (err, data) => {
      if (err) {
        process.stdout.write("An error ocurred reading the file :" + err.message)
        return
      }
      // handle the file content 
      event.sender.send('fileData', data)
    })
  }
});

ipcMain.on('savefile', (event, path) => {
  const { dialog } = require('electron')
  const fs = require('fs')

  dialog.showSaveDialog().then(result => {
    // process.stdout.write("file? " + JSON.stringify(result) );
    if (!result.filePath) {
      process.stdout.write("No file selected");
    } else {
      event.sender.send('saveto',  result.filePath)
      // process.stdout.write("saveto", result.filePath);
      //readFile(result.filePaths[0]);
    }
  });
});

ipcMain.on('savecontent', (event, args) => {
  fs.writeFileSync(args.file, args.content, 'utf-8');
});

ipcMain.on('toggleMaxWnd', (event, args) => {
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});
