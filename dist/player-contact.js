// The visible, solid aircraft body is the hit area. Transparent corners and
// exhaust remain outside it. Use a swept path relative to the moving pilot so
// fast projectiles and a pilot crossing a projectile cannot tunnel.
export const PLAYER_HULL=[
 [0,-43],[8,-27],[11,-11],[34,9],[31,17],[12,12],
 [13,28],[6,24],[0,28],[-6,24],[-13,28],[-12,12],
 [-31,17],[-34,9],[-11,-11],[-8,-24]
];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function inside(x,y){let hit=false;for(let i=0,j=PLAYER_HULL.length-1;i<PLAYER_HULL.length;j=i++){
 const [ax,ay]=PLAYER_HULL[i],[bx,by]=PLAYER_HULL[j];
 if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)hit=!hit;
}return hit;}
function pointSegment(x,y,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy,t=l?clamp(((x-ax)*dx+(y-ay)*dy)/l,0,1):0;return {d:Math.hypot(x-ax-dx*t,y-ay-dy*t),t};}
function edgeContact(ax,ay,bx,by,cx,cy,dx,dy,r){
 const ux=bx-ax,uy=by-ay,vx=dx-cx,vy=dy-cy,den=ux*vy-uy*vx;
 if(Math.abs(den)>1e-9){const t=((cx-ax)*vy-(cy-ay)*vx)/den,s=((cx-ax)*uy-(cy-ay)*ux)/den;if(t>=0&&t<=1&&s>=0&&s<=1)return t;}
 const a=pointSegment(ax,ay,cx,cy,dx,dy),b=pointSegment(bx,by,cx,cy,dx,dy),c=pointSegment(cx,cy,ax,ay,bx,by),d=pointSegment(dx,dy,ax,ay,bx,by);
 const ts=[];if(a.d<=r)ts.push(0);if(b.d<=r)ts.push(1);if(c.d<=r)ts.push(c.t);if(d.d<=r)ts.push(d.t);return ts.length?Math.min(...ts):null;
}
export function playerBulletContact(b,p,margin=0){
 if(p.hitCrash||p.heroBomb||p.lives<=0)return null;
 const x0=(b.px??b.x)-(p.previousX??p.x),y0=(b.py??b.y)-(p.previousY??p.y),x1=b.x-p.x,y1=b.y-p.y,r=Math.max(0,b.r||0)+Math.max(0,margin)+1;
 // Broad phase: almost all rounds are far away. Avoid trig, edge tests and
 // allocations for them, even while both pilots have active support wings.
 if(Math.max(x0,x1)<-50-r||Math.min(x0,x1)>50+r||Math.max(y0,y1)<-50-r||Math.min(y0,y1)>50+r)return null;
 const angle=-(p.bank||0)*.13,c=Math.cos(angle),s=Math.sin(angle);
 const ax=x0*c-y0*s,ay=x0*s+y0*c,bx=x1*c-y1*s,by=x1*s+y1*c;
 let t=inside(ax,ay)?0:inside(bx,by)?1:null;
 for(let i=0;i<PLAYER_HULL.length;i++){const a=PLAYER_HULL[i],d=PLAYER_HULL[(i+1)%PLAYER_HULL.length],n=edgeContact(ax,ay,bx,by,...a,...d,r);if(n!==null)t=t===null?n:Math.min(t,n);}
 if(t===null)return null;
 return {x:(b.px??b.x)+(b.x-(b.px??b.x))*t,y:(b.py??b.y)+(b.y-(b.py??b.y))*t,t};
}
