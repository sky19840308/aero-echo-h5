// Pixel proportions determine the world; aircraft and hitboxes keep square units.
export function battlefieldForViewport(width,height){
 const w=Math.max(1,Number(width)||450),h=Math.max(1,Number(height)||800);
 const desktop=w>=760&&w>h;
 return {width:desktop?Math.round(800*w/h):450,height:800,desktop};
}

export function fitBattlefield(pixelWidth,pixelHeight,width,height){
 const scale=Math.min(pixelWidth/width,pixelHeight/height);
 return {scale,x:(pixelWidth-width*scale)/2,y:(pixelHeight-height*scale)/2};
}

export function resizeBattlefield(game,width,height=800){
 const nextW=Math.max(320,Math.min(3840,Math.round(Number(width)||450)));
 const nextH=Math.max(480,Math.min(1600,Math.round(Number(height)||800)));
 const oldW=game.width||450,oldH=game.height||800;
 if(nextW===oldW&&nextH===oldH)return false;
 const sx=nextW/oldW,sy=nextH/oldH,seen=new Set();
 const reflow=object=>{
  if(!object||seen.has(object))return;seen.add(object);
  for(const key of ['x','px','originX','targetX','dashX','diveTargetX','formationCenter','formationOffset'])if(Number.isFinite(object[key]))object[key]*=sx;
  for(const key of ['y','py','originY','targetY','dashY','diveTargetY','baseY'])if(Number.isFinite(object[key]))object[key]*=sy;
  for(const key of ['hitCrash','crash','targetPoint'])reflow(object[key]);
 };
 reflow(game.player);for(const pilot of game.crew||[])reflow(pilot.player);
 for(const key of ['enemies','bullets','pickups','hazards','effects','weaponEffects','particles','texts','lootBursts','wingmen'])for(const item of game[key]||[])reflow(item);
 reflow(game.boss);game.width=nextW;game.height=nextH;
 for(const player of new Set([game.player,...(game.crew||[]).map(p=>p.player)])){
  for(const key of ['x','targetX'])player[key]=Math.max(20,Math.min(nextW-20,player[key]));
  for(const key of ['y','targetY'])if(!player.hitCrash)player[key]=Math.max(155,Math.min(nextH-93,player[key]));
 }
 // Deferred barrages capture their original warning coordinates. Cancel those
 // warnings together instead of firing at an unmarked point after reflow.
 game.hazards=game.hazards.filter(h=>h.type!=='barrage');
 return true;
}
