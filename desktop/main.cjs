const {app,BrowserWindow,Menu,protocol,net,shell,session}=require('electron');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const fs=require('node:fs');
const BASE='https://sky19840308.github.io/aero-echo-h5/';
const ONLINE='https://aero-echo-sky.spy-liver.chatgpt.site/game';
const root=path.join(__dirname,'game');
if(process.argv.includes('--smoke-test'))app.commandLine.appendSwitch('disable-gpu');
app.setName('AERO ECHO');
app.whenReady().then(async()=>{
 // Serve the complete bundled game at its normal secure origin, including
 // range-aware audio fetches. Gameplay and local saves work with no network.
 protocol.handle('https',request=>{
  const url=new URL(request.url);
  if(url.origin==='https://sky19840308.github.io'&&url.pathname.startsWith('/aero-echo-h5/')){
   let rel;try{rel=decodeURIComponent(url.pathname.slice('/aero-echo-h5/'.length))||'index.html';}catch{return new Response('Invalid path',{status:400});}
   const file=path.resolve(root,rel);
   if(!file.startsWith(path.resolve(root)+path.sep)||!fs.existsSync(file))return new Response('Not found',{status:404});
   return net.fetch(pathToFileURL(file).href,{headers:request.headers});
  }
  return net.fetch(request,{bypassCustomProtocolHandlers:true});
 });
 session.defaultSession.setPermissionRequestHandler((_wc,permission,callback)=>callback(permission==='fullscreen'));
 const win=new BrowserWindow({width:1440,height:900,minWidth:960,minHeight:600,backgroundColor:'#04101b',title:'AERO ECHO',show:false,fullscreen:!process.argv.includes('--smoke-test'),webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,preload:path.join(__dirname,'preload.cjs')}});
 const {ipcMain}=require('electron');ipcMain.handle('aero-open-online',event=>{if(event.sender===win.webContents)shell.openExternal(ONLINE);});
 win.webContents.setWindowOpenHandler(({url})=>{if(url===ONLINE||url.startsWith('https://aero-echo-sky.spy-liver.chatgpt.site/'))shell.openExternal(ONLINE);return {action:'deny'};});
 win.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(BASE)){event.preventDefault();if(url.startsWith(ONLINE))shell.openExternal(ONLINE);}});
 Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'Game',submenu:[{label:'Fullscreen',accelerator:'F11',click:()=>win.setFullScreen(!win.isFullScreen())},{label:'Online co-op',click:()=>shell.openExternal(ONLINE)},{type:'separator'},{role:'quit'}]}]));
 win.once('ready-to-show',()=>{win.show();win.setMenuBarVisibility(false);});
 if(process.argv.includes('--smoke-test')){
  let failed=false;win.webContents.on('render-process-gone',()=>{failed=true;app.exit(1);});
  win.webContents.once('did-finish-load',async()=>{
   try{const data=await win.webContents.executeJavaScript(`(async()=>{const [{Game},{stageConfig},{playerBulletContact}]=await Promise.all([import('./engine.js?v=33'),import('./data.js?v=33'),import('./player-contact.js?v=33')]);const g=new Game({stage:stageConfig(0,0,'campaign','quick'),width:1422,height:800});g.start();g.player.invulnerable=0;const b=g.shoot(g.player.x+25,g.player.y-60,Math.PI/2,2800,100,'enemy');g.updateBullets(.05);const m=await (await fetch('./assets/manifest.json')).json();const im=new Image();im.src=m.players.Dawn7[0].src;await im.decode();return {build:33,loaded:!!document.getElementById('canvas'),collision:g.player.lives===2,impact:g.effects.some(f=>f.name==='Player_HullContact'),aircraft:im.naturalWidth>0,offlineBundle:true};})()`);
    if(Object.values(data).some(v=>v===false))throw new Error('Smoke check failed');
    const resultPath=process.env.AERO_SMOKE_RESULT;if(resultPath)fs.writeFileSync(resultPath,JSON.stringify({...data,platform:process.platform,electron:process.versions.electron}));
    console.log('AERO_SMOKE '+JSON.stringify(data));app.exit(failed?1:0);
   }catch(error){console.error(error.message);app.exit(1);}
  });setTimeout(()=>app.exit(2),45000).unref();
 }
 await win.loadURL(BASE+'?build=33');
});
app.on('window-all-closed',()=>app.quit());
