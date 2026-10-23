import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const runtime=path.resolve(process.argv[2]),output=path.resolve(process.argv[3]);
const require=createRequire(import.meta.url),{createCanvas,loadImage,GlobalFonts}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
GlobalFonts.registerFromPath(path.join(runtime,'assets/fonts/YujiSyuku-bombs.ttf'),'Yuji Syuku');
globalThis.window={devicePixelRatio:1,matchMedia:()=>({matches:false})};globalThis.ResizeObserver=class{observe(){}};
const module=name=>import(pathToFileURL(path.join(runtime,name)).href+'?v=31');
const [{Game},{Renderer},{stageConfig},{createLocalDuoGame},{HERO_BOMB_ASSETS}]=await Promise.all([module('engine.js'),module('renderer.js'),module('data.js'),module('local-duo.js'),module('hero-bombs.js')]);
const manifest=JSON.parse(fs.readFileSync(path.join(runtime,'assets/manifest.json'))),images=new Map();
const metas=[...Object.values(manifest.players).flat(),...Object.values(manifest.enemies),...Object.values(manifest.bosses),...Object.values(manifest.projectiles),...Object.values(manifest.backgrounds).flatMap(meta=>[meta,...(meta.frames||[]).slice(0,2)]),...Object.values(manifest.playerWeapons.atlases),manifest.weapons.atlases.GENERAL,...Object.values(manifest.items.atlases),...Object.values(HERO_BOMB_ASSETS).map(src=>({src})),...['dawn7','bastion3','wraithx'].map(name=>({src:'assets/wingmen/'+name+'-wingman.svg'}))];
for(const meta of metas){if(!meta?.src||images.has(meta.src))continue;images.set(meta.src,await loadImage(path.join(runtime,meta.src)));}
const canvas=createCanvas(450,800);canvas.getBoundingClientRect=()=>({width:450,height:800});
const renderer=new Renderer(canvas,{manifest,get:src=>images.get(src)||null},{detail:true,numbers:true,shake:false,flash:false,contrast:true});
const sheet=createCanvas(225*3,420*3),sheetCtx=sheet.getContext('2d');sheetCtx.fillStyle='#05121c';sheetCtx.fillRect(0,0,sheet.width,sheet.height);
fs.mkdirSync(output,{recursive:true});
for(let chapter=0;chapter<9;chapter++){
 const game=new Game({stage:stageConfig(chapter,2,'campaign','quick'),ship:chapter%3});game.start();game.clock=1;game.time=20;game.spawnBoss();game.boss.y=180;
 for(const [index,id]of game.stage.enemies.entries()){const enemy=game.spawn(id,75+index*150,340+index*25);enemy.age=2;enemy.hp*=.65;game.enemyFire(enemy);}
 game.callWingmen();game.updateWingmen(4.7);renderer.draw(game,1);
 const x=chapter%3*225,y=Math.floor(chapter/3)*420;sheetCtx.drawImage(canvas,x,y+20,225,400);sheetCtx.fillStyle='#c8efff';sheetCtx.font='12px sans-serif';sheetCtx.fillText('CHAPTER '+(chapter+1),x+9,y+14);
 if(chapter===0)fs.writeFileSync(path.join(output,'solo-battle.png'),canvas.toBuffer('image/png'));
}
fs.writeFileSync(path.join(output,'nine-chapters.png'),sheet.toBuffer('image/png'));
const duo=createLocalDuoGame({mission:2,hostShip:0,guestShip:2});duo.start();duo.clock=.9;duo.use('host','bomb');duo.use('guest','bomb');duo.updatePlayer(.9);renderer.draw(duo,.9);fs.writeFileSync(path.join(output,'duo-simultaneous-bombs.png'),canvas.toBuffer('image/png'));
console.log('Rendered nine chapter views, solo aircraft and simultaneous co-op hero bombs: '+output);
