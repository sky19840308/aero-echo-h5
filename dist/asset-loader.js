// Resolve against the deployed module, independent of the page's navigation path.
export const resourceUrl=src=>{const url=new URL(src,import.meta.url);if(url.protocol!=='data:'&&/\.(png|jpe?g|webp)$/i.test(url.pathname)&&!url.searchParams.has('v'))url.searchParams.set('v','15');return url.href;};

export class AssetLoadError extends Error {
 constructor(src,kind='load'){super('Asset load failed: '+(src.startsWith('data:')?'embedded image':src));this.name='AssetLoadError';this.src=src;this.kind=kind;}
}

export async function readManifest({timeoutMs=30000,retries=1}={}){
 const src='assets/manifest.json?v=18';
 for(let attempt=0;attempt<=retries;attempt++){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
   const response=await fetch(resourceUrl(src),{credentials:'same-origin',cache:'no-cache',signal:controller.signal});
   if(!response.ok)throw new AssetLoadError(src,[401,403].includes(response.status)?'access':'http');
   const manifest=await response.json();
   if(!['players','backgrounds','enemies','bosses','projectiles','fx'].every(key=>manifest?.[key]))throw new AssetLoadError(src,'manifest');
   return manifest;
  }catch(error){
   if(error.kind==='access'||attempt===retries)throw error instanceof AssetLoadError?error:new AssetLoadError(src,controller.signal.aborted?'timeout':'load');
  }finally{clearTimeout(timer);}
 }
}

export class AssetStore {
 constructor(manifest,{timeoutMs=12000,retries=1,maxConcurrent=4,retryDelayMs=250}={}){
  this.manifest=manifest;this.images=new Map();this.fallbacks=new Map();this.jobs=new Map();this.timeoutMs=timeoutMs;this.retries=retries;this.maxConcurrent=maxConcurrent;this.retryDelayMs=retryDelayMs;this.active=0;this.queue=[];this.stageEpoch=0;
 }
 load(src,{priority=false}={}){
  if(this.images.has(src)){if(priority){const job=this.jobs.get(src);if(job)job.priority=true;const index=this.queue.findIndex(job=>job.src===src);if(index>0)this.queue.unshift(this.queue.splice(index,1)[0]);}return Promise.resolve(this.images.get(src));}
  let resolve,reject;
  const pending=new Promise((yes,no)=>{resolve=yes;reject=no;});
  this.images.set(src,pending);
  const job={src,priority,pending,reject,controller:new AbortController(),started:false,run:async()=>{
   try{const image=await this.loadWithRetry(src,job.controller.signal);if(this.images.get(src)===pending)this.images.set(src,image);resolve(image);}
   catch(error){if(this.images.get(src)===pending)this.images.delete(src);reject(error);}
   finally{if(this.jobs.get(src)===job)this.jobs.delete(src);}
  }};
  this.jobs.set(src,job);
  if(priority)this.queue.unshift(job);else this.queue.push(job);
  this.pump();return pending;
 }
 pump(){while(this.active<this.maxConcurrent&&this.queue.length){const job=this.queue.shift();job.started=true;this.active++;job.run().finally(()=>{this.active--;this.pump();});}}
 cancelJob(job){
  if(this.jobs.get(job.src)===job)this.jobs.delete(job.src);
  if(this.images.get(job.src)===job.pending)this.images.delete(job.src);
  job.controller.abort();
  if(!job.started){this.queue=this.queue.filter(queued=>queued!==job);job.reject(new AssetLoadError(job.src,'cancelled'));}
 }
 cancelOptional(){for(const job of [...this.jobs.values()])if(!job.priority)this.cancelJob(job);}
 async loadWithRetry(src,signal){
  for(let attempt=0;attempt<=this.retries;attempt++){
   try{return await this.loadImage(src,attempt,signal);}
   catch(error){if(signal.aborted||attempt===this.retries)throw error;await new Promise((resolve,reject)=>{const abort=()=>{clearTimeout(timer);reject(new AssetLoadError(src,'cancelled'));};const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},this.retryDelayMs);signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();});}
  }
 }
 loadImage(src,attempt,signal){return new Promise((resolve,reject)=>{
  const image=new Image();image.decoding='async';let settled=false;
  const abort=()=>finish(new AssetLoadError(src,'cancelled'));
  const finish=(error)=>{if(settled)return;settled=true;clearTimeout(timer);signal.removeEventListener('abort',abort);image.onload=image.onerror=null;if(error){try{image.src='';}catch{}reject(error);}else resolve(image);};
  const timer=setTimeout(()=>finish(new AssetLoadError(src,'timeout')),src.startsWith('data:')?Math.max(1500,this.timeoutMs):this.timeoutMs);
  signal.addEventListener('abort',abort,{once:true});if(signal.aborted){abort();return;}
  image.onload=()=>finish();image.onerror=()=>finish(new AssetLoadError(src));
  const url=new URL(resourceUrl(src));if(attempt&&url.protocol!=='data:')url.searchParams.set('retry',String(attempt));
  try{image.src=url.href;}catch{finish(new AssetLoadError(src));}
 });}
 get(src){const image=this.images.get(src);return image&&typeof image.then!=='function'?image:this.fallbacks.get(src)||null;}
 forMenu(){
  const frames=this.manifest.menuArt?.frames||[],epoch=this.stageEpoch;
  this.menuReady=Promise.all(frames.map(async meta=>{
   if(meta.fallback&&!this.fallbacks.has(meta.src))try{this.fallbacks.set(meta.src,await this.load(meta.fallback));}catch{}
   if(epoch!==this.stageEpoch)return;
   try{await this.load(meta.src);}catch{}
  }));return this.menuReady;
 }
 async forStage(stage,ship,skin,progress=()=>{},additionalPlayers=[]){
  const epoch=++this.stageEpoch;
  // Abort active decorative downloads as well as queued ones. A slow optional
  // atlas must not occupy every request slot when the player enters the next mission.
  this.cancelOptional();
  const m=this.manifest,boss=stage.boss?m.bosses[stage.chapter+1]:null,required=[m.players[ship]?.[skin]||m.players[ship]?.[0],m.backgrounds[stage.chapter+1],...stage.enemies.map(id=>m.enemies[id]),...(boss?[boss]:[]),m.projectiles.PRJ_Blue_Pulse_01,m.projectiles.PRJ_Orange_Lance_01,m.projectiles.PRJ_Blue_Lance_01,...Object.values(m.items?.atlases||{})];
  for(const pilot of additionalPlayers.slice(0,1)){const meta=m.players[pilot.ship]?.[pilot.skin]||m.players[pilot.ship]?.[0];if(meta)required.push(meta);}
  const pilotShips=[ship,...additionalPlayers.slice(0,1).map(p=>p.ship)];
  const playerAtlases=Object.values(m.playerWeapons?.atlases||{});required.push(...playerAtlases);
  const generalAtlas=m.weapons?.atlases?.GENERAL;if(generalAtlas?.fallback)required.push(generalAtlas);
  const backgroundFrames=m.backgrounds[stage.chapter+1].frames||[];
  const bossAtlases=Object.entries(m.weapons?.atlases||{}).filter(([group,meta])=>meta.fallback&&stage.boss&&(group==='shared_boss_support'||group.startsWith('BOSS_'+String(stage.chapter+1).padStart(2,'0')+'_'))).map(([,meta])=>meta);required.push(...bossAtlases);
  const resources=[...new Map(required.map(meta=>[meta.src,meta])).values()],paths=resources.map(meta=>meta.fallback||meta.src),weaponAtlases=Object.entries(m.weapons?.atlases||{}).filter(([group])=>group==='GENERAL'||(stage.boss&&(group==='shared_boss_support'||group.startsWith('BOSS_'+String(stage.chapter+1).padStart(2,'0')+'_')))).map(([,meta])=>meta.src),effects=[...weaponAtlases,...Object.entries(m.fx).filter(([name])=>(name==='WraithX_Phase_Dash'&&stage.enemies.includes(6))||!['Dawn7_','Bastion3_','WraithX_'].some(prefix=>name.startsWith(prefix))||pilotShips.some(id=>name.startsWith(id+'_'))).map(([,f])=>f.src)],keep=new Set([...paths,...effects,...resources.map(meta=>meta.src),...backgroundFrames.flatMap(frame=>[frame.src,frame.fallback])]);
  // Release textures from previous chapters instead of retaining every decoded background.
  for(const src of this.images.keys())if(!keep.has(src)){const job=this.jobs.get(src);if(job)this.cancelJob(job);else this.images.delete(src);}
  for(const src of this.fallbacks.keys())if(!keep.has(src))this.fallbacks.delete(src);
  let done=0;await Promise.all(resources.map(async meta=>{let image;try{image=await this.load(meta.fallback||meta.src,{priority:true});}catch(error){if(!playerAtlases.includes(meta)&&!bossAtlases.includes(meta)&&meta!==generalAtlas)throw error;}if(epoch===this.stageEpoch&&meta.fallback&&image)this.fallbacks.set(meta.src,image);progress(++done,paths.length);}));
  // Every essential texture is immediately available from the already-loaded manifest.
  // Ship changes, skins, backgrounds and enemies no longer depend on new PNG requests.
  if(epoch===this.stageEpoch){this.essentialReady=Promise.all(resources.map(meta=>meta.fallback?this.load(meta.src).catch(()=>this.get(meta.src)):this.get(meta.src)));if(boss)this.bossReady=this.load(boss.src).catch(()=>this.get(boss.src));}
  // Decorative atlases must never prevent flight; particles and projectile fallbacks still render.
  if(epoch===this.stageEpoch)this.effectsReady=Promise.all(effects.map(async src=>{try{await this.load(src);return null;}catch{return src;}})).then(failures=>failures.filter(Boolean));
  // Storyboard downloads are decorative and cannot hold the next chapter hostage.
  if(epoch===this.stageEpoch)this.backgroundReady=Promise.all(backgroundFrames.map(async meta=>{
   if(epoch!==this.stageEpoch)return;
   if(meta.fallback&&!this.fallbacks.has(meta.src))try{const image=await this.load(meta.fallback);if(epoch===this.stageEpoch)this.fallbacks.set(meta.src,image);}catch{}
   if(epoch!==this.stageEpoch)return;try{await this.load(meta.src);}catch{}
  }));
 }
}
