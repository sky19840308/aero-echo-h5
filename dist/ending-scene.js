import {resourceUrl} from './asset-loader.js?v=19';

export const ENDING_ASSETS=Object.freeze({background:'assets/ending/earth-dawn.png',fighters:'assets/ending/fighters.png',fallback:'assets/ending/homecoming-original.jpg'});
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
// Clip each aircraft separately: the central aircraft's wings share the atlas
// bounding box with its wingmen, so rectangular crops alone are insufficient.
const JETS=[
 {rect:[152,447,400,180],clip:[[152,447],[552,447],[552,627],[152,627]],x:.24,y:.69,width:.27},
 {rect:[407,439,847,326],clip:[[646,439],[1043,439],[1070,548],[1173,624],[1254,704],[1150,765],[520,765],[407,678],[589,564]],x:.50,y:.76,width:.52},
 {rect:[1189,500,423,188],clip:[[1250,500],[1503,500],[1612,615],[1612,664],[1405,688],[1230,638],[1189,604]],x:.77,y:.71,width:.29}
];
export function sceneState(seconds,width,height){
 const p=clamp(seconds/270),end=clamp((seconds-260)/8),sun={x:width*.62,y:height*.27};
 return {progress:p,zoom:1+.24*p,light:.12+.45*p+.4*end,sun,jets:JETS.map(j=>({
  x:width*(j.x+(.62-j.x)*p*.87),y:height*(j.y+(.27-j.y)*p*.9),
  width:Math.min(width, height*1.5)*j.width*(1-.77*p),alpha:1-end
 }))};
}
function loadImage(src,onLoad,onError){
 if(!globalThis.Image)return null;const image=new Image();image.onload=()=>onLoad(image);image.onerror=onError;image.src=resourceUrl(src);return image;
}
export class EndingScene {
 constructor(canvas,{reducedMotion=false}={}){this.canvas=canvas;this.ctx=canvas?.getContext?.('2d')||null;this.reducedMotion=reducedMotion;this.images={};this.loaded=false;}
 load(){if(this.loaded)return;this.loaded=true;
  loadImage(ENDING_ASSETS.background,i=>{this.images.background=i;},()=>loadImage(ENDING_ASSETS.fallback,i=>{this.images.fallback=i;},()=>{}));
  loadImage(ENDING_ASSETS.fighters,i=>{this.images.fighters=i;},()=>{});
 }
 resize(width=globalThis.window?.innerWidth||450,height=globalThis.window?.innerHeight||800){
  this.width=Math.max(1,width);this.height=Math.max(1,height);const ratio=Math.min(1.5,globalThis.window?.devicePixelRatio||1,1440/this.width);
  if(this.canvas){this.canvas.width=Math.round(this.width*ratio);this.canvas.height=Math.round(this.height*ratio);}this.ratio=ratio;
 }
 draw(seconds){const c=this.ctx;if(!c)return;if(!this.width)this.resize();const w=this.width,h=this.height,state=sceneState(seconds,w,h);c.setTransform(this.ratio,0,0,this.ratio,0,0);c.globalAlpha=1;
  c.fillStyle='#02060d';c.fillRect(0,0,w,h);
  const image=this.images.background||this.images.fallback;
  if(image){const s=Math.max(w/image.width,h/image.height)*(this.reducedMotion?1:state.zoom),iw=image.width*s,ih=image.height*s;
   const x=clamp(w*.62-image.width*.687*s,w-iw,0),y=clamp(h*.27-image.height*.306*s,h-ih,0);c.drawImage(image,x,y,iw,ih);
  }else{
   const earth=c.createRadialGradient(w*.5,h*.78,w*.07,w*.5,h*.78,w*1.1);earth.addColorStop(0,'#27799d');earth.addColorStop(.66,'#07253e');earth.addColorStop(1,'#030811');c.fillStyle=earth;c.fillRect(0,0,w,h);
  }
  // Slow layered motion, without oscillation or flashes. Aircraft disappear
  // into the sunrise only during the ten-second final title.
  if(!this.images.fallback||this.images.background)for(let i=0;i<JETS.length;i++)this.drawJet(JETS[i],state.jets[i]);
  const glow=c.createRadialGradient(state.sun.x,state.sun.y,0,state.sun.x,state.sun.y,Math.max(w,h)*.8);
  glow.addColorStop(0,`rgba(255,240,200,${state.light})`);glow.addColorStop(.22,`rgba(255,194,106,${state.light*.25})`);glow.addColorStop(1,'rgba(255,174,85,0)');c.fillStyle=glow;c.fillRect(0,0,w,h);
  c.fillStyle='rgba(0,5,14,.26)';c.fillRect(0,0,w,h);
 }
 drawJet(slice,state){if(state.alpha<=0)return;const c=this.ctx,[sx,sy,sw,sh]=slice.rect,scale=state.width/sw,dh=sh*scale;c.save();c.globalAlpha=state.alpha;c.translate(state.x-state.width/2,state.y-dh/2);
  const trail=c.createLinearGradient(0,dh*.8,0,dh*1.8);trail.addColorStop(0,'rgba(139,210,255,.38)');trail.addColorStop(1,'rgba(139,210,255,0)');c.fillStyle=trail;c.beginPath();c.moveTo(state.width*.42,dh*.7);c.lineTo(state.width*.47,dh*1.8);c.lineTo(state.width*.58,dh*.7);c.fill();
  if(this.images.fighters){c.beginPath();slice.clip.forEach(([x,y],i)=>{const p=[(x-sx)*scale,(y-sy)*scale];i?c.lineTo(...p):c.moveTo(...p);});c.closePath();c.clip();c.drawImage(this.images.fighters,sx,sy,sw,sh,0,0,state.width,dh);}
  else{c.fillStyle='#90a6bb';c.beginPath();c.moveTo(state.width*.5,0);c.lineTo(state.width*.6,dh*.55);c.lineTo(state.width,dh*.78);c.lineTo(state.width*.58,dh*.82);c.lineTo(state.width*.5,dh);c.lineTo(state.width*.42,dh*.82);c.lineTo(0,dh*.78);c.lineTo(state.width*.4,dh*.55);c.closePath();c.fill();}c.restore();
 }
}
