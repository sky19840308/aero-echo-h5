import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Game} from '../dist/engine.js?v=27';
import {CoopGame} from '../dist/coop.js?v=27';
import {DIFFICULTIES,stageConfig} from '../dist/data.js?v=27';
import {HERO_BOMB_ASSETS,HERO_BOMB_DURATION,HERO_BOMB_FX,HERO_BOMB_STRIKE_TIME} from '../dist/hero-bombs.js?v=27';

const stage=stageConfig(0,0,'campaign','quick');
const difficultyRuns=DIFFICULTIES.map(({id})=>{
 const game=new Game({stage,seed:2450,difficulty:id});
 game.start();
 const enemy=game.spawn(1,110,180);
 const enemyHp=enemy.maxHp;
 const enemyY=enemy.y;game.updateEnemies(.05);const enemyMove=enemy.y-enemyY;
 game.player.vx=60;
 game.firingEnemy=enemy;
 game.enemyFire(enemy);
 const bullets=game.bullets.filter(b=>b.owner==='enemy');
 const wave=new Game({stage,seed:2450,difficulty:id});
 wave.start();wave.spawnWave();
 const bossGame=new Game({stage:stageConfig(0,2,'campaign','quick'),seed:2450,difficulty:id});
 bossGame.start();bossGame.spawnBoss();bossGame.boss.y=185;bossGame.boss.pattern=1;bossGame.bossPattern();
 const bossBullets=bossGame.bullets.filter(b=>b.owner==='enemy');
 return {game,enemyHp,enemyMove,enemyDamage:game.difficulty.damage,fireRate:game.difficulty.rate,aimAngle:Math.atan2(bullets[0].vy,bullets[0].vx),bulletCount:bullets.length,bulletSpeed:Math.hypot(bullets[0].vx,bullets[0].vy),waveCount:wave.spawned,nextWave:wave.nextWave,bossHp:bossGame.boss.maxHp,bossBulletCount:bossBullets.length,bossBulletSpeed:Math.hypot(bossBullets[0].vx,bossBullets[0].vy)};
});

for(const {game,enemyHp,bossHp} of difficultyRuns){
 assert.equal(game.player.lives,3);
 assert.equal(game.player.maxLives,3);
 assert.equal('hp' in game.player,false,'player no longer has an HP pool');
 assert.equal('shield' in game.player,false,'player no longer has a shield pool');
 assert.equal(bossHp,difficultyRuns[0].bossHp,'difficulty does not raise Boss HP');
}
assert.ok(difficultyRuns[0].enemyHp<difficultyRuns[1].enemyHp&&difficultyRuns[1].enemyHp<difficultyRuns[2].enemyHp,'enemy aircraft have meaningfully more health at each difficulty tier');
assert.deepEqual(difficultyRuns.map(run=>run.bulletCount),[2,2,2],'enemy bullet count stays fixed across difficulties');
assert.equal(difficultyRuns[0].bossBulletCount,difficultyRuns[1].bossBulletCount,'Easy and Standard retain their Boss projectile pattern size');
assert.ok(difficultyRuns[2].bossBulletCount<difficultyRuns[1].bossBulletCount,'Complex Boss volleys are lighter than Standard');
assert.equal(difficultyRuns[0].waveCount,difficultyRuns[1].waveCount,'Easy and Standard retain the same starting wave size');
assert.ok(difficultyRuns[2].waveCount>difficultyRuns[1].waveCount,'Complex fields more aircraft into each wave');
assert.deepEqual(difficultyRuns.map(run=>run.nextWave),[difficultyRuns[0].nextWave,difficultyRuns[0].nextWave,difficultyRuns[0].nextWave]);
assert.ok(difficultyRuns[0].enemyMove<difficultyRuns[1].enemyMove&&difficultyRuns[1].enemyMove<difficultyRuns[2].enemyMove,'difficulty increases enemy movement');
assert.ok(difficultyRuns[0].aimAngle>difficultyRuns[1].aimAngle&&difficultyRuns[1].aimAngle>difficultyRuns[2].aimAngle,'difficulty improves enemy aim lead');
assert.ok(difficultyRuns[0].bulletSpeed<difficultyRuns[1].bulletSpeed&&difficultyRuns[1].bulletSpeed<difficultyRuns[2].bulletSpeed,'difficulty changes projectile speed');
assert.ok(difficultyRuns[0].bossBulletSpeed<difficultyRuns[1].bossBulletSpeed&&difficultyRuns[1].bossBulletSpeed<difficultyRuns[2].bossBulletSpeed,'difficulty changes Boss projectile speed');
assert.ok(difficultyRuns[0].bulletSpeed>138,'ordinary enemy bullets are no longer slower than the old 138 baseline');
assert.ok(difficultyRuns[0].enemyDamage<difficultyRuns[1].enemyDamage&&difficultyRuns[1].enemyDamage<difficultyRuns[2].enemyDamage,'enemy damage increases by difficulty');
assert.ok(difficultyRuns[0].fireRate<difficultyRuns[1].fireRate,'Standard increases enemy firing cadence over Easy');
assert.ok(difficultyRuns[2].fireRate<difficultyRuns[1].fireRate,'Complex lowers firing cadence to keep more aircraft dodgeable');

for(const id of ['easy','normal','hard']){
 const game=new Game({stage,seed:25,difficulty:id});game.start();
 for(const expected of [2,1,0]){
  game.player.hitCrash=null;
  game.player.invulnerable=0;
  game.hurtPlayer(999);
  assert.equal(game.player.lives,expected,'one hit costs one life');
  const hits=game.hits;
  game.hurtPlayer(999);
  assert.equal(game.player.lives,expected,'hit recovery blocks repeat contact');
  assert.equal(game.hits,hits,'hit recovery records no second hit');
 }
}

{
 const game=new Game({stage,seed:91});game.start();game.player.lives=2;
 game.collect({kind:'repair',tier:'s'});
 assert.equal(game.player.lives,3,'repair restores one life');
 game.collect({kind:'repair',tier:'s'});
 assert.equal(game.player.lives,3,'repair caps at three lives');
 assert.equal(game.score,250,'repair at full lives converts to score');
 game.shoot(100,100,0,200,1,'enemy',{unclearable:true});
 game.collect({kind:'shield',tier:'s'});
 assert.equal(game.bullets.filter(b=>b.owner==='enemy'&&b.alive).length,0,'shield pickup is a pulse that clears enemy bullets');
}

for(const [shipIndex,shipId] of ['Dawn7','Bastion3','WraithX'].entries()){
 const game=new Game({stage,ship:shipIndex,seed:80+shipIndex});game.start();
 const enemy=game.spawn(1,225,200);
 game.shoot(225,400,Math.PI/2,120,10,'enemy',{unclearable:true});
 assert.equal(game.bomb(),true);
 const target={x:25,y:155};game.moveTo(target.x,target.y);
 assert.notEqual(game.player.targetX,target.x,'pilot stays locked during the bomb scene');
 game.updatePlayer(HERO_BOMB_STRIKE_TIME+.02);
 assert.equal(game.player.heroBomb.attacked,true);
 assert.equal(enemy.alive,false,'bomb strike destroys regular enemies');
 assert.equal(game.bullets.filter(b=>b.owner==='enemy'&&b.alive).length,0,'bomb clears even otherwise uncleareable bullets');
 assert.ok(game.effects.some(effect=>effect.name===HERO_BOMB_FX[shipId]),'each pilot uses a dedicated full-screen strike effect');
 game.updatePlayer(HERO_BOMB_DURATION-HERO_BOMB_STRIKE_TIME+.02);
 assert.equal(game.player.heroBomb,null,'pilot returns after the animated bomb');
 assert.equal(game.player.invulnerable,5,'pilot returns with five seconds of invulnerability');
 assert.equal(game.player.bombReturn,5,'return protection is visible to the renderer');

 const bossGame=new Game({stage:stageConfig(0,2,'boss','quick'),ship:shipIndex,seed:180+shipIndex});bossGame.start();bossGame.spawnBoss();bossGame.boss.y=185;
 const hp=bossGame.boss.hp;
 bossGame.bomb();bossGame.updatePlayer(HERO_BOMB_STRIKE_TIME+.02);
 assert.ok(bossGame.boss.hp<hp,'bomb strike damages the Boss');
 assert.ok(bossGame.boss.hp>0,'bomb strike cannot defeat the Boss by itself');

 const path=new URL('../dist/'+HERO_BOMB_ASSETS[shipId],import.meta.url);
 const png=fs.readFileSync(path);
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a','hero action sheet is a PNG');
 assert.equal(png.readUInt32BE(16),768,'hero action sheet has two 384px columns');
 assert.equal(png.readUInt32BE(20),768,'hero action sheet has two 384px rows');
}

{
 const room={mode:'online',host:{id:'host',name:'Host',choice:{shipIndex:0}},guest:{id:'guest',name:'Guest',choice:{shipIndex:2}}};
 const coop=new CoopGame({mission:0,room,seed:321});coop.start();
 const host=coop.crew.find(pilot=>pilot.role==='host'),guest=coop.crew.find(pilot=>pilot.role==='guest');
 for(const expected of [2,1,0]){
  host.player.hitCrash=null;
  host.player.invulnerable=0;
  coop.withPilot(host,()=>coop.hurtPlayer(500));
  assert.equal(host.player.lives,expected,'co-op pilot loses one life per hit');
  assert.equal(host.alive,expected>0,'co-op pilot becomes a spectator at zero lives');
  assert.equal(coop.snapshot().crew.find(pilot=>pilot.role==='host').player.lives,expected,'co-op snapshots carry remaining lives');
 }
 assert.deepEqual(coop.living().map(pilot=>pilot.role),['guest'],'the other pilot continues after a teammate falls');
 assert.equal(guest.player.lives,3);
}

console.log(JSON.stringify({passed:true,difficulties:DIFFICULTIES.map(d=>d.id),heroes:Object.keys(HERO_BOMB_ASSETS).length,checks:['three lives and hit recovery','enemy durability, aim, movement and projectile speed scale with difficulty','Complex waves and aircraft increase while enemy volleys and Boss patterns become lighter','life restoration and pulse pickup','three animated hero bomb sheets and effects','Boss survives bomb strike','co-op life snapshots and individual elimination']}));
