import Store from 'electron-store'
import { app, shell, BrowserWindow, ipcMain, dialog, Notification } from 'electron'
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
      const fileName = filePath.split(/[\\/]/).pop(); // Get filename!
      const ext = filePath.split('.').pop().toLowerCase();
      const dataBuffer = fs.readFileSync(filePath);
      
      if (ext === 'pdf') {
        const pdfModule = eval("require('pdf-parse')");
        const pdfFn = typeof pdfModule === 'function' ? pdfModule : pdfModule.default;
        if (typeof pdfFn !== 'function') throw new Error("pdf-parse is not a function.");
        const data = await pdfFn(dataBuffer);
        return { type: 'pdf', data: data.text, name: fileName };
      } else {
        const base64 = dataBuffer.toString('base64');
        return { type: 'image', data: base64, url: `file://${filePath.replace(/\\/g, '/')}`, name: fileName };
      }
    } catch (error) {
      console.error('Failed to read file:', error);
      throw new Error(error.message);
    }
  });

   ipcMain.handle('install-ollama', async () => {
    return new Promise((resolve) => {
      // Elevate process (-Verb RunAs) to trigger UAC and launch winget in a visible terminal
      const command = `powershell -Command "Start-Process powershell -ArgumentList '-NoExit', '-Command', 'echo \\\"Initializing Ollama Installation...\\\"; winget install Ollama.Ollama -e --accept-package-agreements --accept-source-agreements' -Verb RunAs"`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Ollama Install Error:`, error);
          resolve({ success: false, message: error.message });
        } else {
          resolve({ success: true, message: 'Installer launched in terminal.' });
        }
      });
    });
  });

  //Dynamic App Launcher (With Security Dialog)
  ipcMain.handle('launch-app', async (event, appName) => {
    const focusWindow = BrowserWindow.getFocusedWindow();
    const result = await dialog.showMessageBox(focusWindow, {
      type: 'question',
      buttons: ['Allow', 'Deny'],
      defaultId: 0,
      cancelId: 1,
      title: 'Permission Request 🛡️',
      message: `Permission required to launch "${appName}"`,
      detail: `Luna is attempting to open this desktop application. Do you grant permission?`
    });

    if (result.response === 0) { // Allow
      return new Promise((resolve) => {
        let target = appName;
        const appMappings = {
          'whatsapp': 'whatsapp://',
          'spotify': 'spotify://',
          'discord': 'discord://',
          'slack': 'slack://',
          'chrome': 'chrome.exe',
          'notepad': 'notepad.exe',
          'calculator': 'calc.exe',
          'paint': 'mspaint.exe'
        };
        
        const cleanName = appName.toLowerCase().trim();
        if (appMappings[cleanName]) {
          target = appMappings[cleanName];
        }

        exec(`start ${target}`, (error) => {
          if (error) resolve(`Failed to launch ${appName}. It might not be installed or registered on your system.`);
          else resolve(`Successfully Launched ${appName}!`);
        });
      });
    } else { // Deny
      return `Access Denied: You did not grant permission to launch ${appName}.`;
    }
  });

  ipcMain.handle('draft-email', async (event, email, subject, body) => {
    return new Promise((resolve) => {
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      const webGmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      exec(`start "" "${mailtoUrl}"`, (error) => {
        resolve(`I have triggered your local mail client! 📬\n\n` +
                `🔗 **Webmail Fallback:**\n` +
                `*   If you use browser email, click to compose: [Open in Gmail Web](${webGmailUrl})\n\n` +
                `📋 **Draft Template (Copy-paste):**\n` +
                `*   **To:** \`${email}\`\n` +
                `*   **Subject:** \`${subject}\`\n` +
                `*   **Body:** \`${body}\``);
      });
    });
  });

  ipcMain.handle('rename-note', async (event, oldName, newName) => {
    try {
      const desktopPath = app.getPath('desktop');
      const oldPath = join(desktopPath, oldName);
      const newPath = join(desktopPath, newName);

      if (!fs.existsSync(oldPath)) {
        return `Failed: File "${oldName}" does not exist on your desktop.`;
      }

      fs.renameSync(oldPath, newPath);
      return `Success! Renamed "${oldName}" to "${newName}" on your desktop.`;
    } catch (error) {
      return `Failed to rename: ${error.message}`;
    }
  });

  ipcMain.handle('add-todo', async (event, task) => {
    try {
      const desktopPath = app.getPath('desktop');
      const todoPath = join(desktopPath, 'todo.txt');
      const taskLine = `[ ] ${new Date().toLocaleDateString()} - ${task}\n`;
      fs.appendFileSync(todoPath, taskLine);
      return `Added to your To-Do List: "${task}" (Saved in todo.txt on your desktop).`;
    } catch (error) {
      return `Failed to add task: ${error.message}`;
    }
  });

  ipcMain.handle('create-calendar-event', async (event, title, dateStr) => {
    const focusWindow = BrowserWindow.getFocusedWindow();
    const permission = await dialog.showMessageBox(focusWindow, {
      type: 'question',
      buttons: ['Allow', 'Deny'],
      defaultId: 0,
      cancelId: 1,
      title: 'Permission Request 📅',
      message: `Permission required to schedule event`,
      detail: `Luna is requesting permission to add "${title}" on ${dateStr} to your Calendar.`
    });

    if (permission.response !== 0) {
      return `Access Denied: You did not grant permission to modify calendar.`;
    }

    try {
      const desktopPath = app.getPath('desktop');
      const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
      const icsPath = join(desktopPath, fileName);

      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) {
        return `Failed: Invalid date format. Please use YYYY-MM-DD.`;
      }

      const yyyymmdd = dateObj.toISOString().split('T')[0].replace(/-/g, '');
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `SUMMARY:${title}`,
        `DTSTART:${yyyymmdd}T090000`,
        `DTEND:${yyyymmdd}T100000`,
        'DESCRIPTION:Generated by Luna Desktop Assistant',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\n');

      fs.writeFileSync(icsPath, icsContent);

      exec(`start "" "${icsPath}"`);
      return `Success! I created calendar event "${fileName}" on your desktop and opened your default Calendar application.`;
    } catch (error) {
      return `Failed to create calendar event: ${error.message}`;
    }
  });

  // 2. Native Reminders (Upgraded for guaranteed delivery)
ipcMain.handle('create-reminder', (event, task, milliseconds) => {
  setTimeout(() => {
    // Attempt the native toast notification
    if (Notification.isSupported()) {
      new Notification({
        title: 'Luna Reminder 🌙',
        body: task
      }).show();
    }
    
    // Force a native dialog box popup to guarantee they see it!
    dialog.showMessageBox({
      type: 'info',
      title: 'Luna Reminder 🌙',
      message: 'Time for your task!',
      detail: task,
      buttons: ['Acknowledge']
    });
    
  }, milliseconds);
  
  return `I have set a reminder for: "${task}". You will receive a popup shortly!`;
});

  ipcMain.handle('find-file', async (event, fileName) => {
  return new Promise((resolve) => {
    const searchPath = join(app.getPath('home'), 'Downloads');
    // PowerShell command to quickly find a file by name
    const command = `powershell -Command "Get-ChildItem -Path '${searchPath}' -Recurse -Filter '*${fileName}*' -ErrorAction SilentlyContinue | Select-Object -First 5 -ExpandProperty FullName"`;
    
    exec(command, (error, stdout) => {
      if (stdout.trim()) {
        resolve(`I found these files:\n${stdout.trim()}`);
      } else {
        resolve(`I couldn't find any files matching "${fileName}" in your Downloads folder.`);
      }
    });
  });
});
// 4. Organize Downloads Folder
ipcMain.handle('organize-downloads', () => {
  try {
    const downloadsPath = app.getPath('downloads');
    const files = fs.readdirSync(downloadsPath);
    
    const folders = {
      'Images': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'Documents': ['.pdf', '.docx', '.txt', '.xlsx', '.csv'],
      'Installers': ['.exe', '.msi']
    };
    let movedCount = 0;
    // Create folders if they don't exist
    Object.keys(folders).forEach(folder => {
      if (!fs.existsSync(join(downloadsPath, folder))) fs.mkdirSync(join(downloadsPath, folder));
    });
    // Move files based on extension
    files.forEach(file => {
      const filePath = join(downloadsPath, file);
      if (fs.statSync(filePath).isFile()) {
        const ext = file.substring(file.lastIndexOf('.')).toLowerCase();
        for (const [folder, exts] of Object.entries(folders)) {
          if (exts.includes(ext)) {
            fs.renameSync(filePath, join(downloadsPath, folder, file));
            movedCount++;
            break;
          }
        }
      }
    });
    return `Successfully organized ${movedCount} files in your Downloads folder!`;
  } catch (error) {
    return `Failed to organize downloads: ${error.message}`;
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
