import assert from 'node:assert/strict';
import {Game} from '../dist/engine.js?v=30.1';
import {DIFFICULTIES,TALENTS,TALENT_BRANCHES,stageConfig} from '../dist/data.js?v=30.1';
import {canLearnTalent,learnTalent,normalizeTalentProgress,talentTreeHtml} from '../dist/talent-tree.js?v=30.1';
import {createProfile,normalizeProfile} from '../dist/profile.js?v=30.1';
import {CoopGame} from '../dist/coop.js?v=30.1';
import {LanSession} from '../dist/lan.js?v=30.1';

assert.equal(TALENT_BRANCHES.length,3,'the new tree has offense, mobility and survival paths');
assert.equal(TALENTS.reduce((sum,node)=>sum+node.max,0),18,'the complete tree uses all 18 earned points');

const migrated=normalizeTalentProgress({points:2,talents:{fire:2,energy:1,shield:1,cooldown:1}});
assert.equal(migrated.talentTreeVersion,2);
assert.equal(migrated.points,7,'legacy levels are refunded alongside unspent points');
assert.ok(Object.values(migrated.talents).every(level=>level===0),'legacy effects reset so the player can choose the new tree');
const legacySave=createProfile();legacySave.talentTreeVersion=1;legacySave.points=2;legacySave.talents={fire:2,energy:1,shield:1,cooldown:1};
const normalizedSave=normalizeProfile(legacySave);assert.equal(normalizedSave.talentTreeVersion,2);assert.equal(normalizedSave.points,7,'profile loading applies the talent refund to real saves');
const retained=normalizeTalentProgress({treeVersion:2,points:4,talents:{assault_core:2,mobility_graze:1}});
assert.equal(retained.points,4);
assert.equal(retained.talents.assault_core,2,'new-tree allocations survive save normalization');

const lanProfile=createProfile();lanProfile.talents={mobility_core:2,mobility_graze:1,mobility_feedback:1,mobility_magnet:1,mobility_salvage:1,survival_core:2};
const lanSession=Object.create(LanSession.prototype);lanSession.progress={profile:lanProfile};
const lanLoadout=lanSession.loadout();assert.equal(lanLoadout.talentTreeVersion,2,'LAN loadouts identify the current talent tree version');
const lanRoom={mode:'lan',host:{id:'host',choice:{shipIndex:0},loadout:lanLoadout},guest:{id:'guest',choice:{shipIndex:1},loadout:{version:1,talentTreeVersion:2,talents:{}}}};
const lanGame=new CoopGame({mission:0,room:lanRoom,seed:2700});lanGame.start();
const lanPilot=lanGame.crew.find(pilot=>pilot.role==='host');
assert.equal(lanPilot.talents.mobility_graze,1,'LAN construction retains the allocated graze talent');
assert.equal(lanPilot.talents.survival_core,2,'LAN construction retains the allocated reentry talent');
const p=lanPilot.player;lanGame.pickups=[];
const graze={id:100,owner:'enemy',alive:true,x:p.x+26,y:p.y,px:p.x+26,py:p.y,vx:0,vy:0,r:3,age:0,damage:1,hit:new Set()};
lanGame.bullets=[graze];lanGame.bulletCounts.enemy=1;p.energy=0;lanGame.updateBullets(.01);
assert.equal(graze.grazed,true,'LAN pilots use the five-pixel graze radius talent');
assert.equal(p.energy,8,'LAN graze feedback grants the talent’s extra three energy');
const magnetDrop={id:101,kind:'coin',x:p.x-170,y:p.y,age:.2,dead:false};lanGame.pickups=[magnetDrop];lanGame.updatePickups(.1);
assert.equal(magnetDrop.attracting,true,'LAN pickup magnet talent extends the attraction radius');
assert.ok(magnetDrop.x>p.x-170,'the extended magnet moves distant drops toward the pilot');
const salvageDrop={id:102,kind:'coin',x:p.x-120,y:p.y,age:.2,dead:false},startX=salvageDrop.x;lanGame.pickups=[salvageDrop];lanGame.updatePickups(.1);
assert.ok(salvageDrop.x-startX>35,'LAN salvage talent increases pickup attraction speed by 25%');
lanPilot.player.hitCrash={x:p.x,y:p.y,vx:0,vy:0,age:.09,duration:.1};lanGame.updateCrashes(.02);
assert.equal(p.respawnTime,5.4,'both LAN survival ranks extend the five-second respawn shield');
assert.equal(p.invulnerable,5.4,'LAN invulnerability matches the longer respawn shield duration');

const profile={points:18,talents:{}};
assert.equal(canLearnTalent(profile,'assault_piercer'),false,'route nodes stay locked until both root pips are lit');
assert.ok(learnTalent(profile,'assault_core'));
assert.equal(canLearnTalent(profile,'assault_piercer'),false);
assert.ok(learnTalent(profile,'assault_core'));
assert.equal(canLearnTalent(profile,'assault_piercer'),true);
assert.ok(learnTalent(profile,'assault_piercer'));
assert.equal(canLearnTalent(profile,'assault_weakpoint'),true,'each capstone unlocks from its own route');
const tree=talentTreeHtml(profile);
assert.match(tree,/class="talent-tree"/);
assert.match(tree,/talent-lit/);
assert.match(tree,/talent-ready/);
assert.match(tree,/火力专精/);

const plain=new Game({stage:stageConfig(0,0),seed:2701}),trained=new Game({stage:stageConfig(0,0),profile:{talents:{assault_core:2,mobility_core:2,survival_reserve:1}},seed:2701});
assert.ok(trained.dps>plain.dps,'assault root nodes raise primary damage modestly');
assert.ok(trained.player.speed>plain.player.speed,'mobility root nodes raise movement speed');
assert.equal(trained.player.bombs,3,'the reserve node grants one extra start bomb');
assert.equal(trained.player.maxBombs,5,'talents preserve the hard five-bomb limit');

const normal=new Game({stage:stageConfig(0,0),difficulty:'normal',seed:2702}),complex=new Game({stage:stageConfig(0,0),difficulty:'hard',seed:2702});
normal.spawnWave();complex.spawnWave();
assert.ok(complex.enemies.length>normal.enemies.length,'Complex difficulty adds more enemies per wave');
assert.ok(complex.difficulty.enemyHp>normal.difficulty.enemyHp);
assert.ok(complex.difficulty.rate<normal.difficulty.rate,'enemy fire cadence is lower to preserve dodge space');
assert.ok(complex.difficulty.skillBonus<normal.difficulty.skillBonus,'Boss skill intervals are longer');
normal.bullets=[];normal.bulletCounts.enemy=0;complex.bullets=[];complex.bulletCounts.enemy=0;
normal.fan(100,100,10,.7,200,1,Math.PI/2);complex.fan(100,100,10,.7,200,1,Math.PI/2);
assert.ok(complex.bullets.length<normal.bullets.length,'Complex volleys use fewer projectiles per fan');

const survivor=new Game({stage:stageConfig(0,0),seed:2703});survivor.start();survivor.player.invulnerable=0;
survivor.hurtPlayer(1);assert.equal(survivor.player.lives,2);assert.ok(survivor.player.hitCrash);
survivor.updatePlayer(.92);
assert.equal(survivor.player.hitCrash,null,'the crash animation ends before reentry protection starts');
assert.equal(survivor.player.invulnerable,5,'every reentry receives five seconds of invulnerability');
assert.equal(survivor.player.respawnTime,5,'the visual reentry shield also lasts five seconds');
survivor.updatePlayer(1);assert.ok(Math.abs(survivor.player.invulnerable-4)<1e-9);
const lives=survivor.player.lives;survivor.hurtPlayer(999);assert.equal(survivor.player.lives,lives,'the reentry window blocks a second hit');

const warningGame=new Game({stage:stageConfig(0,0),profile:{talents:{survival_warning:1}},seed:2704});
warningGame.hazards=[{type:'blast',x:100,y:100,r:20,damage:1,warn:1,duration:.4,age:0}];warningGame.updateHazards(.01);
assert.equal(warningGame.hazards[0].warn,1.15,'the warning talent adds readable reaction time');

console.log(JSON.stringify({passed:true,nodes:TALENTS.length,pointBudget:18,checks:['save migration and refunds','LAN loadout version and retained talent allocations','co-op graze, magnet and salvage talent effects','prerequisite unlocking and lit tree presentation','balanced passive effects and five-bomb cap','more enemies with lighter complex-difficulty volleys','five-second baseline and rank-extended respawn protection','longer warning windows']}));
