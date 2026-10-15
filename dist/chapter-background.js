import {W,H} from './data.js?v=22';

const TAU=Math.PI*2;
const palettes=[['255,136,64','255,191,92'],['240,174,52','255,226,132'],['103,183,239','110,230,192'],['231,122,69','255,177,100'],['249,118,61','255,202,143'],['204,205,225','241,229,177'],['114,226,232','175,246,245'],['109,158,255','170,221,255'],['193,164,255','220,226,255']];
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const fadedTiles=new WeakMap();let blendLayer=null;
function newCanvas(width,height){
 if(typeof globalThis.OffscreenCanvas==='function')return new OffscreenCanvas(width,height);
 const canvas=globalThis.document?.createElement?.('canvas');if(!canvas?.getContext)return null;canvas.width=width;canvas.height=height;return canvas;
}
export function chapterFrameState(meta,time){
 const count=meta?.frames?.length||1,seconds=Math.max(.5,meta?.frameSeconds||4),transition=Math.min(seconds,meta?.transitionSeconds||1.4);
 const cycle=((time%(count*seconds))+count*seconds)%(count*seconds),index=Math.floor(cycle/seconds);
 return {index,next:(index+1)%count,mix:smooth((cycle%seconds-(seconds-transition))/transition)};
}
// A positive world offset is downward flight motion. The overlap blends the
// unmodified square panels at the repeat seam without a hard edge or blank row.
export function chapterScrollState(meta,time,image){
 const width=W*1.24,height=width*(image.height/image.width),overlap=Math.min(height*.24,Math.max(32,meta?.scrollOverlap||96));
 const stride=height-overlap,speed=Math.max(8,meta?.scrollSpeed||28),distance=Math.max(0,time)*speed;
 return {width,height,overlap,stride,speed,distance,offset:distance%stride};
}
function fadedTile(image,ratio){
 let entry=fadedTiles.get(image);if(entry&&entry.ratio===ratio)return entry.canvas;
 const canvas=newCanvas(image.width,image.height);if(!canvas)return null;const c=canvas.getContext('2d');c.drawImage(image,0,0);c.globalCompositeOperation='destination-in';
 const mask=c.createLinearGradient(0,0,0,image.height*ratio);mask.addColorStop(0,'rgba(255,255,255,0)');mask.addColorStop(1,'rgba(255,255,255,1)');c.fillStyle=mask;c.fillRect(0,0,image.width,image.height);
 fadedTiles.set(image,{ratio,canvas});return canvas;
}
function scrollFrame(ctx,image,state,alpha=1){
 const {width,height,overlap,stride,offset}=state,x=(W-width)/2,tile=fadedTile(image,overlap/height);ctx.globalAlpha=alpha;
 for(let y=offset-stride*2;y<H;y+=stride){
  if(y+height<=0)continue;
  if(tile)ctx.drawImage(tile,x,y,width,height);
  else{
   // Tiny fallback environments without a spare canvas still blend the seam.
   const rows=16;for(let i=0;i<rows;i++){ctx.globalAlpha=alpha*(i+.5)/rows;ctx.drawImage(image,0,image.height*overlap/height*i/rows,image.width,image.height*overlap/height/rows,x,y+overlap*i/rows,width,overlap/rows+.25);}
   ctx.globalAlpha=alpha;ctx.drawImage(image,0,image.height*overlap/height,image.width,image.height*(1-overlap/height),x,y+overlap,width,height-overlap);
  }
 }
 ctx.globalAlpha=1;
}
function weather(ctx,chapter,time,speed){
 const [warm,cool]=palettes[chapter];
 // Clouds, dust, ice and light remain in motion at every rendered frame,
 // independently of the six-panel storm/impact animation.
 const haze=ctx.createRadialGradient(W*(.5+.25*Math.sin(time*.15+chapter)),H*(.48+.1*Math.sin(time*.21)),8,W*.5,H*.5,330);
 haze.addColorStop(0,`rgba(${cool},${.04+.018*Math.sin(time*.49)})`);haze.addColorStop(1,`rgba(${cool},0)`);ctx.fillStyle=haze;ctx.fillRect(0,0,W,H);
 for(let i=0;i<24;i++){
  const cold=chapter>=6,x=(i*79.31+Math.sin(time*.21+i)*19+time*(cold?4:9))%(W+24)-12,y=(i*137.17+time*speed*1.36)%(H+20)-10;
  ctx.fillStyle=`rgba(${cold?cool:warm},${.10+(i%3)*.025})`;ctx.fillRect(x,y,cold?1.2:1,cold?1.2:2.4);
 }
 if([2,5,6,7].includes(chapter)){
  const age=(time+chapter*.83)%8.7;
  if(age<.32){const flash=Math.sin(age/.32*Math.PI)*.08;ctx.strokeStyle=`rgba(${cool},${flash*2})`;ctx.lineWidth=1.2;ctx.beginPath();for(let i=0;i<7;i++){const x=290+i*9+Math.sin(i*8.2)*21,y=110+i*34+time*speed%150;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
 }
 for(let i=0;i<3;i++){
  const period=11.2+i*2.1,age=(time+chapter*.71+i*3.7)%period;
  if(age<2.15){
   const x=430-i*66-age*107,y=40+i*54+age*183,alpha=.40*Math.min(1,age*4,(2.15-age)*4);
   const trail=ctx.createLinearGradient(x+57,y-79,x,y);trail.addColorStop(0,`rgba(${warm},0)`);trail.addColorStop(1,`rgba(${warm},${alpha})`);
   ctx.strokeStyle=trail;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x+57,y-79);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle=`rgba(${cool},${alpha})`;ctx.beginPath();ctx.arc(x,y,1.6,0,TAU);ctx.fill();
  }else if(age<3.65){
   const impact=age-2.15,x=430-i*66-2.15*107,y=40+i*54+2.15*183+impact*speed;
   ctx.strokeStyle=`rgba(${warm},${.16*(1-impact/1.5)})`;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y,6+impact*28,3+impact*13,0,0,TAU);ctx.stroke();
  }
 }
}
export function drawChapterBackground(ctx,assets,settings,chapter,clock){
 const meta=assets.manifest.backgrounds[chapter+1];if(!meta?.frames?.length)return false;
 const reduced=globalThis.window?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches,moving=settings.shake!==false&&!reduced,time=moving?Math.max(0,clock):0;
 const frame=chapterFrameState(meta,time),current=assets.get(meta.frames[frame.index].src)||assets.get(meta.src);if(!current)return false;
 const state=chapterScrollState(meta,time,current);ctx.save();ctx.fillStyle='#07141f';ctx.fillRect(0,0,W,H);scrollFrame(ctx,current,state);
 const next=assets.get(meta.frames[frame.next].src);
 if(moving&&next&&frame.mix){
  blendLayer??=newCanvas(W,H);
  if(blendLayer){const layer=blendLayer.getContext('2d');layer.clearRect(0,0,W,H);scrollFrame(layer,next,chapterScrollState(meta,time,next));ctx.globalAlpha=frame.mix;ctx.drawImage(blendLayer,0,0);ctx.globalAlpha=1;}
  else scrollFrame(ctx,next,chapterScrollState(meta,time,next),frame.mix);
 }
 if(moving&&settings.detail)weather(ctx,chapter,time,state.speed);
 const shade=ctx.createLinearGradient(0,0,0,H);shade.addColorStop(0,'#02101a35');shade.addColorStop(.48,'#02101a3d');shade.addColorStop(1,'#01081372');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);ctx.restore();return true;
}
