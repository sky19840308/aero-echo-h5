// Native Canvas regression: warning artwork must never survive inside a blast.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {Game} from '../dist/engine.js?v=30';
import {Renderer} from '../dist/renderer.js?v=30';
import {stageConfig} from '../dist/data.js?v=30';
import {BOSS_ARSENALS,EFFECT_ART,hazardImpactArt,hazardPhaseArt} from '../dist/weapons.js?v=30';
import {HERO_BOMB_ASSETS,HERO_BOMB_STRIKE_TIME} from '../dist/hero-bombs.js?v=30';

const require=createRequire(import.meta.url);
const {createCanvas,loadImage}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
const root=new URL('../',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('dist/assets/manifest.json',root)));
const images=new Map();
for(const pack of [manifest.weapons,manifest.playerWeapons])for(const atlas of Object.values(pack.atlases)){
 images.set(atlas.src,await loadImage(fs.readFileSync(new URL('dist/'+atlas.src,root))));
}
globalThis.window={devicePixelRatio:1};
globalThis.ResizeObserver=class{observe(){}};
const canvas=createCanvas(450,800);
canvas.getBoundingClientRect=()=>({width:450,height:800});
const renderer=new Renderer(canvas,{manifest,get:src=>images.get(src)||null},{detail:true,shake:false,flash:false,numbers:false});
const rendered=[],nativeWeapon=renderer.weapon.bind(renderer);
renderer.weapon=(...args)=>{rendered.push(args[0]);return nativeWeapon(...args);};
const drawHazard=h=>{rendered.length=0;renderer.hazard(h,1,false);renderer.hazard(h,1,true);return [...rendered];};
let checkedBlasts=0;
function verifyBlast(game,h,expected){
 const impact=hazardImpactArt(h);
 assert.equal(impact,expected);
 assert.equal(manifest.weapons.sprites[impact].kind,'impact','detonation art is an isolated impact, never a carrier/pattern/glyph');
 assert.ok(drawHazard(h).includes(h.warnArt||h.art),'warning is visible before activation');
 const lives=game.player.lives;
 game.player.invulnerable=0;game.player.x=h.x;game.player.y=h.y;
 game.updateHazards(h.warn-.01);
 assert.equal(game.player.lives,lives,'warning does not cost a life');
 assert.equal(game.weaponEffects.length,0,'warning does not spawn an early explosion');
 game.updateHazards(.02);
 assert.equal(h.activated,true);
 assert.equal(game.player.lives,lives-1,'active blast collision costs exactly one life');
 assert.equal(game.weaponEffects.filter(f=>f.art===impact).length,1,'exactly one isolated impact is spawned (shield-hit feedback is separate)');
 assert.ok(game.weaponEffects.every(f=>f.art===impact||['GFX_04','GFX_17'].includes(f.art)),'neither the warning glyph nor the missile/carrier becomes an explosion effect');
 assert.equal(hazardPhaseArt(h),null);
 assert.deepEqual(drawHazard(h),[],'active blast does not paint its old warning/carrier underneath the impact');
 renderer.weaponEffect(game.weaponEffects[0]);
 assert.equal(rendered.at(-1),impact,'active effect actually draws the selected impact in native Canvas');
 game.updateHazards(.04);
 assert.equal(game.player.lives,lives-1,'one active hazard cannot remove a second life during hit recovery');
 assert.equal(game.weaponEffects.filter(f=>f.art===impact).length,1,'activation does not spawn a new impact every frame');
 checkedBlasts++;
}
for(const type of [12,13]){
 const g=new Game({stage:stageConfig(0,0),seed:12+type});g.start();g.firingEnemy={type};
 g.zone(225,400,35,50,'blast',{warn:1.25});
 assert.ok(g.hazards[0].art.startsWith('GARM_'));
 verifyBlast(g,g.hazards[0],'GFX_13');
}
for(let chapter=0;chapter<9;chapter++){
 for(const [index,entry] of BOSS_ARSENALS[chapter].entries()){
  if(!['telegraph','impact'].includes(entry.kind))continue;
  const g=new Game({stage:stageConfig(chapter,2,'boss','quick'),seed:100+chapter});g.start();g.spawnBoss();g.boss.y=185;g.boss.pattern=index+1;g.firingBoss=true;
  g.bossArsenal();g.weaponEffects=[];
  const h=g.hazards.find(x=>x.type==='blast');assert.ok(h,entry.id+' creates a targeted blast');
  verifyBlast(g,h,entry.kind==='impact'?entry.id:BOSS_ARSENALS[chapter].find(x=>x.kind==='impact').id);
 }
 const g=new Game({stage:stageConfig(chapter,2),seed:200+chapter});g.start();g.firingBoss=true;
 g.zone(225,400,35,50,'blast');
 verifyBlast(g,g.hazards[0],BOSS_ARSENALS[chapter].find(x=>x.kind==='impact').id);
}
for(const type of ['mine','fire','freeze','time']){
 const g=new Game({stage:stageConfig(0,0)});g.start();g.zone(200,300,45,0,type,{duration:3});
 const h=g.hazards[0];h.age=h.warn+.1;
 assert.equal(hazardPhaseArt(h),h.art,'persistent '+type+' artwork remains visible');
 assert.ok(drawHazard(h).includes(h.art));
}
assert.equal(hazardPhaseArt({type:'barrage',age:2,warn:1,art:'B01_W07'}),null,'barrage warning disappears when the volley starts');
for(let ship=0;ship<3;ship++){
 const g=new Game({stage:stageConfig(0,0),ship,seed:300+ship});g.start();g.skill();
 for(const effect of [...g.effects,...g.weaponEffects]){
  const art=effect.art||EFFECT_ART[effect.name],meta=manifest.playerWeapons.sprites[art];
  if(meta)assert.equal(meta.owner,g.ship.id,'skill effect belongs to the selected hero');
 }
 assert.ok(g.bomb());g.updatePlayer(1);
 assert.equal(g.player.heroBomb.attacked,true,'hero animation reaches its strike phase');
 assert.ok(g.effects.some(x=>x.name===(g.ship.id==='Dawn7'?'Dawn7_Corona':g.ship.id==='Bastion3'?'Bastion3_Gravity_Burst':'WraithX_Singularity')),'each hero uses its own full-screen strike effect');
 g.updatePlayer(2);
 assert.equal(g.player.heroBomb,null,'the fighter returns after the animated attack');
 assert.equal(g.player.invulnerable,5,'the returning fighter receives exactly five seconds of invulnerability');
 for(const ring of g.effects.filter(x=>x.name==='Bomb_Clear_Ring'))assert.equal(ring.art||EFFECT_ART[ring.name],'GFX_09','clear ring is a neutral shockwave, not another hero targeting glyph');
}

// Legacy animated sheets are valid sheets, not uncut images. Every frame is
// drawn with a source rectangle; none may spill into the next tile or atlas.
const fallbackRenderer=new Renderer(canvas,{manifest:{...manifest,weapons:{sprites:{}},playerWeapons:{sprites:{}}},get:src=>images.get(src)||null},{detail:false});
const nativeDraw=fallbackRenderer.ctx.drawImage.bind(fallbackRenderer.ctx),sourceRects=[];
fallbackRenderer.ctx.drawImage=(...args)=>{sourceRects.push(args.slice(1,5));return nativeDraw(...args);};
let animatedFrames=0;
for(const [name,meta] of Object.entries(manifest.fx)){
 const im=await loadImage(fs.readFileSync(new URL('dist/'+meta.src,root)));images.set(meta.src,im);
 assert.ok(meta.frames>0&&meta.columns>0&&meta.frameSize>0);
 assert.ok(im.width>=meta.columns*meta.frameSize&&im.height>=Math.ceil(meta.frames/meta.columns)*meta.frameSize,name+' sheet geometry');
 for(let frame=0;frame<meta.frames;frame++){
  sourceRects.length=0;
  fallbackRenderer.frame(name,225,400,120,(frame+.1)/meta.frames,1);
  assert.deepEqual(sourceRects,[[frame%meta.columns*meta.frameSize,Math.floor(frame/meta.columns)*meta.frameSize,meta.frameSize,meta.frameSize]],name+' frame '+frame+' is cropped individually');
  animatedFrames++;
 }
}
for(const meta of Object.values(manifest.projectiles)){
 const im=await loadImage(fs.readFileSync(new URL('dist/'+meta.src,root)));
 assert.equal(im.width,meta.width);assert.equal(im.height,meta.height);
}
let heroBombFrames=0;
for(const [shipIndex,ship] of ['Dawn7','Bastion3','WraithX'].entries()){
 const path=HERO_BOMB_ASSETS[ship],im=await loadImage(fs.readFileSync(new URL('dist/'+path,root)));images.set(path,im);
 const game=new Game({stage:stageConfig(0,0),ship:shipIndex,seed:900+shipIndex});game.start();
 for(const [age,frame] of [[.1,0],[.6,1],[1.4,2],[2.6,3]]){
  game.player.heroBomb={age,attacked:age>=HERO_BOMB_STRIKE_TIME};sourceRects.length=0;
  fallbackRenderer.bombCinematics(game,age);
  assert.deepEqual(sourceRects,[[frame%2*384,Math.floor(frame/2)*384,384,384]],ship+' action frame '+frame+' is individually cropped');
  heroBombFrames++;
 }
}
console.log(JSON.stringify({passed:true,checkedBlasts,heroes:3,heroBombFrames,legacyAnimatedSheets:Object.keys(manifest.fx).length,animatedFrames,legacyProjectiles:Object.keys(manifest.projectiles).length,checks:['warning-only glyphs and carriers','one impact per activation','real blast collision retained','all nine Boss exclusive impact transitions','owner-specific skill and bomb art','all four new hero bomb frames rendered with source cropping','persistent fields retained','all legacy sheet frames individually cropped']}));
