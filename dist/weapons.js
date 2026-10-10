// Native-alpha weapon cuts. Moving, rotating, warnings and collision are engine behavior.
// A pattern is a complete attack image; it is never used as one tiny bullet sprite.
import {BOSS_ARSENALS,BOSS_BEAM_COMPONENTS} from './boss-arsenals.js?v=16';
export {BOSS_ARSENALS};
export const BOSS_COLORS=['#8edeff','#ff9950','#85f99b','#dfa6ff','#74eaff','#d8a0ff','#ffbf76','#baadff','#ff997d'];
const ENEMY_SHOTS={
 1:['GPROJ_01'],2:['GPROJ_02'],3:['GPROJ_03'],4:['GPROJ_04','GPROJ_05'],5:['GPROJ_06'],6:['GPROJ_08'],7:['GARM_01_single','GARM_02'],8:['GARM_03_single','GARM_04'],
 10:['GPROJ_07'],11:['GARM_05_single','GPROJ_13'],14:['GPROJ_17_single','GPROJ_20'],15:['GPROJ_09','GPROJ_10_single'],17:['GPROJ_10_single','GARM_02'],18:['GPROJ_13','GPROJ_20'],
 19:['GPROJ_14','GPROJ_19'],20:['GPROJ_19','GPROJ_17_single'],21:['GPROJ_18'],22:['GPROJ_11_single'],23:['GPROJ_12'],25:['GPROJ_14','GARM_01_single'],
 26:['GPROJ_14','GPROJ_19'],27:['GPROJ_16'],28:['GPROJ_15','GARM_12','GARM_13','GARM_16','GSPEC_15_single'],29:['GARM_14','GARM_15_single'],30:['GPROJ_19']
};
export function enemyShotArt(type,salvo=0,kind='orb'){
 const list=ENEMY_SHOTS[type]||[kind==='diamond'?'GPROJ_04':kind==='triangle'?'GPROJ_07':'GPROJ_01'];return list[Math.max(0,salvo-1)%list.length];
}
export function bossShotArt(chapter,pattern=0){
 const shots=BOSS_ARSENALS[chapter].filter(x=>x.kind==='projectile');
 return shots[pattern%shots.length].id;
}
export function bossHazardArt(chapter,type){const list=BOSS_ARSENALS[chapter];if(type==='laser')return BOSS_BEAM_COMPONENTS[chapter].id;return (list.find(x=>x.kind===(type==='time'||type==='freeze'?'field':type==='mine'?'weapon':'impact'))||list.find(x=>x.kind==='impact')||list[0]).id;}
export function bossTelegraphArt(chapter){return BOSS_ARSENALS[chapter].find(x=>x.kind==='telegraph'||x.kind==='field').id;}
export function bossImpactArt(chapter){return BOSS_ARSENALS[chapter].find(x=>x.kind==='impact').id;}
export function bossBeamParts(chapter){return BOSS_BEAM_COMPONENTS[chapter];}
export function playerShotArt(ship,kind){
 if(kind==='missile')return 'P_DAWN_missile';if(kind==='drone')return 'P_BASTION_drone_round';
 return ship==='Bastion3'?'P_BASTION_round':ship==='WraithX'?'P_WRAITH_AP_round':'P_DAWN_round';
}
export function playerTrailArt(ship,kind){return kind==='missile'?'P_DAWN_missile_tail':kind==='drone'?'P_BASTION_drone_tail':ship==='Bastion3'?'P_BASTION_tracer':ship==='WraithX'?'P_WRAITH_AP_tracer':'P_DAWN_tracer';}
export function playerEffectArt(ship,kind){
 const prefix=ship==='Bastion3'?'P_BASTION':ship==='WraithX'?'P_WRAITH':'P_DAWN';
 return prefix+(kind==='bomb'?'_bomb':kind==='hit'||kind==='blast'?'_blast':kind==='muzzle'?(ship==='Dawn7'?'_muzzle':'_tracer'):'_laser_strip');
}
export function enemyHazardArt(type,hazard,sequence=0){
 if(hazard==='laser')return type===24?'GSPEC_03':sequence%2?'GSPEC_02':'GSPEC_01';
 if(hazard==='mine')return ['GARM_08','GARM_09','GARM_10','GARM_11'][sequence%4];
 if(hazard==='time')return 'GSPEC_16';if(hazard==='freeze')return 'GFX_20';if(hazard==='fire')return 'GSPEC_07';
 if(type===12)return 'GARM_16';if(type===13)return 'GARM_06';
 return sequence%2?'GARM_07':'GARM_05';
}
export function enemyBeamParts(art){return {strip:art+'_strip',emitter:art+'_emitter'};}
// A targeting glyph/carrier is a warning, not part of the detonation. Blast
// impacts are spawned once by the engine; drawing the warning again underneath
// them would mix a missile or a neighboring-looking reticle into the explosion.
export function hazardPhaseArt(h){
 if(h.age<h.warn)return h.warnArt||h.art;
 return h.type==='blast'||h.type==='barrage'?null:h.art;
}
export function hazardImpactArt(h){
 if(h.impactArt)return h.impactArt;
 if(h.type!=='blast')return h.art;
 const boss=h.soundOwner?.boss;
 if(!boss)return 'GFX_13';
 const entry=BOSS_ARSENALS[boss-1]?.find(x=>x.id===h.art);
 return entry?.kind==='impact'?entry.id:bossImpactArt(boss-1);
}
export function enemyFireArt(type,salvo=1){
 const patterns={7:['GARM_01'],8:['GARM_03'],11:['GARM_05'],14:['GPROJ_17','GSPEC_08'],15:['GPROJ_10','GSPEC_04'],17:['GPROJ_10'],20:['GSPEC_06'],22:['GPROJ_11'],25:['GARM_01'],26:['GSPEC_14'],28:['GSPEC_15'],29:['GARM_15','GSPEC_09'],30:['GSPEC_16']};
 const list=patterns[type];return list?.[Math.max(0,salvo-1)%list.length];
}
export function enemyMuzzleArt(type){return type===14?'GFX_02':[7,8,12,13].includes(type)?'GFX_12':[6,15,19,20,26,30].includes(type)?'GFX_16':'GFX_01';}
export function enemyFieldArt(type){return type===17||type===19?'GSPEC_12':type===18?'GFX_05':type===20?'GSPEC_05':null;}
export function enemyImpactArt(art=''){
 if(/GPROJ_(14|19)|GARM_15|GSPEC_16/.test(art))return 'GFX_15';
 if(/GPROJ_(08|09|17)|GSPEC_0[1234]/.test(art))return 'GFX_14';
 if(/GARM_0[567]/.test(art))return 'GFX_10';
 if(/GPROJ_(01|11|12)/.test(art))return 'GFX_03';
 return art.startsWith('GARM')?'GFX_18':'GFX_04';
}
export const EFFECT_ART={
 Explosion_Small:'GFX_06',Explosion_Medium:'GFX_13',Explosion_Large:'GFX_07',Explosion_Boss:'CFX_03',
 Bomb_Clear_Ring:'GFX_09',Bomb_Detonation:'GFX_07',Shield_Break:'GFX_14',
 Dawn7_Overclock:'P_DAWN_muzzle',Dawn7_Solar_Beam:'P_DAWN_laser_core',Bastion3_Magnetic_Dome:'GFX_05',Bastion3_Gravity_Burst:'P_BASTION_blast',
 WraithX_Phase_Dash:'P_WRAITH_target',WraithX_Singularity:'P_WRAITH_blast'
};
