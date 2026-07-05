import Store from 'electron-store'
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { exec } from 'child_process' //
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs';
import os from 'os';

const store = new (Store.default|| Store)();


function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.handle('run-desktop-command', async (event, command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error:`, error);
        resolve(`Failed: ${error.message}`);
      } else {
        resolve(`Success! Executed: ${command}`);
      }
    });
  });
})

ipcMain.handle('create-note',async(event,filename,content) => {
  try{
    const desktopPath = app.getPath('desktop');
    const filePath = join(desktopPath,filename);

    fs.writeFileSync(filePath,content);
    return `Success! I created ${filename} on your desktop.`
  }
  catch(error){
    console.error(error);
    return `Failed to create note: ${error.message}`
  }
})

 // --- MEMORY SYSTEM ---
ipcMain.handle('get-chats', () => {
  return store.get('luna-chats', []); // Returns empty array if no chats exist
});

ipcMain.handle('save-chats', (event, chatsArray) => {
  store.set('luna-chats', chatsArray);
  return true;
});

ipcMain.handle('clear-chats', () => {
  store.delete('luna-chats');
  return true;
});

ipcMain.handle('delete-chat-by-id', (event, chatsArray, id) => {
  store.set('luna-chats', chatsArray.filter(chat => chat.id !== id));
  return true;
})

  ipcMain.handle('read-file', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Documents & Images', extensions: ['pdf', 'png', 'jpg', 'jpeg'] }]
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      const filePath = result.filePaths[0];
      const ext = filePath.split('.').pop().toLowerCase();
      const dataBuffer = fs.readFileSync(filePath);
      
      if (ext === 'pdf') {
        // Safely load and unwrap the module
        const pdfModule = eval("require('pdf-parse')");
        const pdfFn = typeof pdfModule === 'function' ? pdfModule : pdfModule.default;
        if (typeof pdfFn !== 'function') throw new Error("pdf-parse is still not a function.");
        const data = await pdfFn(dataBuffer);
        return { type: 'pdf', data: data.text };
      } else {
        // It's an image
        const base64 = dataBuffer.toString('base64');
        return { type: 'image', data: base64, url: `file://${filePath.replace(/\\/g, '/')}` };
      }
    } catch (error) {
    console.error('Failed to read PDF:', error);
    throw new Error(error.message);
  }
});

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
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
