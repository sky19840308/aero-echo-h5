import {CoopGame} from './coop.js?v=30';

export const LOCAL_DUO_MOVEMENT={
 host:{up:'KeyW',left:'KeyA',down:'KeyS',right:'KeyD'},
 guest:{up:'ArrowUp',left:'ArrowLeft',down:'ArrowDown',right:'ArrowRight'}
};

const ACTION_KEYS={
 KeyQ:{role:'host',type:'skill'},KeyE:{role:'host',type:'bomb'},KeyR:{role:'host',type:'wingmen'},Space:{role:'host',type:'ultimate'},
 Numpad1:{role:'guest',type:'skill'},Numpad2:{role:'guest',type:'bomb'},Numpad3:{role:'guest',type:'wingmen'},Numpad0:{role:'guest',type:'ultimate'},NumpadEnter:{role:'guest',type:'ultimate'},
 ShiftRight:{role:'guest',type:'skill'},ControlRight:{role:'guest',type:'bomb'},AltRight:{role:'guest',type:'wingmen'},Enter:{role:'guest',type:'ultimate'}
};

export const LOCAL_DUO_KEY_CODES=new Set([
 ...Object.values(LOCAL_DUO_MOVEMENT).flatMap(bindings=>Object.values(bindings)),
 ...Object.keys(ACTION_KEYS)
]);

export function localDuoActionForKey(code){return ACTION_KEYS[code]||null;}

export function moveLocalDuoPilots(game,keys,dt){
 if(!game?.coop||game.state!=='playing'||!Array.isArray(game.crew))return false;
 const step=Math.max(0,Math.min(.05,Number(dt)||0));let moved=false;
 for(const role of ['host','guest']){
  const pilot=game.crew.find(item=>item.role===role),bindings=LOCAL_DUO_MOVEMENT[role];
  if(!pilot?.alive||pilot.player.lives<=0)continue;
  const dx=(keys.has(bindings.right)?1:0)-(keys.has(bindings.left)?1:0);
  const dy=(keys.has(bindings.down)?1:0)-(keys.has(bindings.up)?1:0);
  if(!dx&&!dy)continue;
  const length=Math.hypot(dx,dy),p=pilot.player;
  game.withPilot(pilot,()=>game.moveTo(p.targetX+dx/length*p.speed*step,p.targetY+dy/length*p.speed*step));
  moved=true;
 }
 game.selectPilot('host');
 return moved;
}

export function localDuoCharges(profile,chapter){
 const saved=profile?.localDuoWingmenChargesByChapter?.[chapter];
 const charge=role=>Number.isFinite(Number(saved?.[role]))?Math.max(0,Math.min(3,Math.floor(Number(saved[role])))):3;
 return {host:charge('host'),guest:charge('guest')};
}

export function rememberDuoCharge(profile,event){
 if(event?.type!=='wingman-charge'||!Number.isInteger(event.chapter)||event.chapter<0||event.chapter>8||!['host','guest'].includes(event.role))return false;
 const budget=localDuoCharges(profile,event.chapter);
 budget[event.role]=Math.max(0,Math.min(3,Math.floor(Number(event.charges)||0)));
 profile.localDuoWingmenChargesByChapter||={};profile.localDuoWingmenChargesByChapter[event.chapter]=budget;return true;
}

export function createLocalDuoGame({mission,hostShip,hostSkin=0,guestShip,guestSkin=0,profile={},difficulty='normal',pace='quick',stageMode='campaign',onEvent=()=>{},seed=Date.now()}){
 const room={mode:'local',host:{id:'local-host',name:'P1',loadout:profile,choice:{shipIndex:hostShip,skin:hostSkin}},guest:{id:'local-guest',name:'P2',loadout:profile,choice:{shipIndex:guestShip,skin:guestSkin}}};
 const game=new CoopGame({mission,room,localRole:'host',difficulty,pace,stageMode,onEvent,seed});
 const charges=localDuoCharges(profile,game.stage.chapter);
 for(const pilot of game.crew)pilot.player.wingmanCharges=charges[pilot.role];
 return game;
}

export function localDuoResult(game,win){
 return {type:'result',win,stage:game.stage,score:Math.round(game.score),kills:game.kills,grazes:game.grazes,hits:game.hits,coins:game.coins,materials:{...game.materials},time:game.time,stars:win?1+(game.kills/Math.max(1,game.spawned)>=.65?1:0)+(game.hits===0?1:0):0,seen:[...game.seen],difficulty:game.difficulty.id,pace:game.pace,ship:game.crew[0].ship.id,level:game.crew[0].level};
}
