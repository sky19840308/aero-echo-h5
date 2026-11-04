import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js?v=33.2';
import {CoopGame} from '../dist/coop.js?v=33.2';
import {stageConfig} from '../dist/data.js?v=33.2';
import {playerBulletContact} from '../dist/player-contact.js?v=33.2';
let checks=0;const ok=(v,label)=>{assert.ok(v,label);checks++;};
for(let ship=0;ship<3;ship++)for(const mode of ['solo','local','online']){
 const g=mode==='solo'?new Game({stage:stageConfig(0,0,'campaign','quick'),ship}):new CoopGame({mission:0,room:{mode:mode==='local'?'local':'online',host:{choice:{shipIndex:ship}},guest:{choice:{shipIndex:(ship+1)%3}}}});g.start();
 const p=g.player;p.invulnerable=0;p.x=300;p.y=500;p.targetX=300;p.targetY=500;
 const b=g.shoot(p.x+25,p.y-60,Math.PI/2,2800,100,'enemy');g.updateBullets(.05);
 ok(p.lives===2,mode+' / '+ship+': swept wing contact costs exactly one life');
 ok(!b.alive&&p.hitCrash,mode+': projectile consumed and crash starts');
 ok(g.effects.some(f=>f.name==='Player_HullContact'),mode+': visible body impact');
 const hits=g.hits;g.hurtPlayer(100);ok(g.hits===hits,'same contact cannot take two lives');
 p.hitCrash=null;p.lives=2;p.invulnerable=3;p.impactCooldown=0;p.previousX=p.x;p.previousY=p.y;
 const block=g.shoot(p.x,p.y-65,Math.PI/2,2800,100,'enemy');g.updateBullets(.05);
 ok(p.lives===2&&!block.alive,'protected aircraft consumes the bullet without losing life');
 ok(g.effects.some(f=>f.name==='Player_ShieldContact'),'protected aircraft shows shield impact');
}
const p={x:400,y:500,previousX:200,previousY:500,bank:0,lives:3};
ok(!!playerBulletContact({px:300,py:495,x:300,y:505,r:3},p),'moving aircraft cannot tunnel across stationary rounds');
ok(!playerBulletContact({px:440,py:450,x:440,y:470,r:2},{...p,previousX:400}),'transparent sprite corner is safe');
ok(!playerBulletContact({px:400,py:470,x:400,y:520,r:4},{...p,heroBomb:{}}),'absent plane during hero animation has no body');
for(const mode of ['solo','duo']){const g=mode==='solo'?new Game({stage:stageConfig(0,0,'campaign','quick')}):new CoopGame({mission:0,room:{host:{choice:{shipIndex:0}},guest:{choice:{shipIndex:2}}}});g.start();const p=g.player;p.x=300;p.y=500;p.invulnerable=0;g.hazards=[{type:'laser',x:330,y:100,width:5,warn:0,duration:1,age:0,damage:1}];g.updateHazards(.01);ok(p.lives===2,'laser contacts the wing in '+mode);ok(g.effects.some(x=>x.name==='Player_HullContact'),'beam impact has visible feedback');p.hitCrash=null;p.invulnerable=3;p.impactCooldown=0;g.updateHazards(.01);ok(p.lives===2&&g.effects.some(x=>x.name==='Player_ShieldContact'),'protected beam contact has shield feedback');}
console.log(JSON.stringify({passed:true,checks,modes:3,aircraft:3}));
