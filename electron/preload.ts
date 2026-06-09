import { contextBridge } from 'electron';

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', {
      platform: process.platform,
    });
  } catch (error) {
    console.error(error);
  }
}
