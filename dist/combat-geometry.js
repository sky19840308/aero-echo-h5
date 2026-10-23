export function bastionSatellitePosition(p,clock,index){
 const angle=clock*2.65+index*Math.PI;
 return {x:p.x+Math.cos(angle)*48,y:p.y+Math.sin(angle)*27,angle};
}

export function bastionUltimateTarget(p,boss){
 return boss?{x:boss.x,y:boss.y}:{x:p.x,y:Math.max(180,p.y-230)};
}

export function segmentHitsAabb(x0,y0,x1,y1,left,top,right,bottom){
 let low=0,high=1;const dx=x1-x0,dy=y1-y0;
 for(const [p,q] of [[-dx,x0-left],[dx,right-x0],[-dy,y0-top],[dy,bottom-y0]]){
  if(Math.abs(p)<1e-9){if(q<0)return false;continue;}
  const t=q/p;if(p<0){if(t>high)return false;low=Math.max(low,t);}else{if(t<low)return false;high=Math.min(high,t);}
 }
 return low<=high;
}

export function segmentPointDistance(x0,y0,x1,y1,x,y){
 const dx=x1-x0,dy=y1-y0,length=dx*dx+dy*dy;
 const t=length>0?Math.max(0,Math.min(1,((x-x0)*dx+(y-y0)*dy)/length)):0;
 return Math.hypot(x-(x0+dx*t),y-(y0+dy*t));
}
