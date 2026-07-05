import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { ipcRenderer } from 'electron'
// Custom APIs for renderer
const api = {
  runDesktopCommand: (command) => ipcRenderer.invoke('run-desktop-command', command),
  createNote: (filename,content) => ipcRenderer.invoke('create-note', filename, content),
  //Memory System
  getChats: () => ipcRenderer.invoke('get-chats'),
  saveChats: (chatsArray) => ipcRenderer.invoke('save-chats', chatsArray),
  clearChats: () => ipcRenderer.invoke('clear-chats'),
  deleteChatById: (chatsArray,id) => ipcRenderer.invoke('delete-chat-by-id',chatsArray,id),
  readFile: () => ipcRenderer.invoke('read-file')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
