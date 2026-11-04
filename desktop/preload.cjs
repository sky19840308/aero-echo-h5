const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('aeroDesktop',{build:33,openOnline:()=>ipcRenderer.invoke('aero-open-online')});
