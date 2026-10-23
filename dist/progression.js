import {SHIPS} from './data.js?v=31';
import {weaponCap,researchCap} from './economy.js?v=31';

export const WEAPON_MULTIPLIERS=[1,1.35,1.9,2.65,3.6];
const WEAPON_COSTS=[{blueprint:6,credits:300},{blueprint:12,credits:650},{blueprint:24,credits:1200},{blueprint:40,credits:2000}];
export const RESEARCH=[
 {id:'charge',max:3,name:['能量协同','エネルギー連携','Energy Synergy'],note:['大招能量获得 +4% / 级，最高 +12%。','必殺技の充電 +4% / レベル、最大 +12%。','Ultimate charging +4% per level, up to +12%.']},
 {id:'supply',max:3,name:['补给增幅','補給増幅','Supply Amplifier'],note:['护盾与修复拾取 +8% / 级，最高 +24%。','シールド・修復アイテム +8% / レベル、最大 +24%。','Shield and repair pickups +8% per level, up to +24%.']},
 {id:'magnet',max:3,name:['磁力回收','磁力回収','Magnetic Recovery'],note:['道具吸附距离 +18 / 级，最高 +54。','アイテム吸引距離 +18 / レベル、最大 +54。','Pickup attraction range +18 per level, up to +54.']}
];
const bounded=(value,max)=>Number.isFinite(Number(value))?Math.max(0,Math.min(max,Math.floor(Number(value)))):0;
export const weaponTier=(profile,ship)=>bounded(profile?.weapons?.[ship],4);
export const researchLevel=(profile,id)=>bounded(profile?.research?.[id],RESEARCH.find(node=>node.id===id)?.max||0);
export const weaponCost=tier=>WEAPON_COSTS[bounded(tier,4)]||null;
export const researchCost=level=>level>=3?null:{data:[4,8,14][bounded(level,2)],credits:[150,300,500][bounded(level,2)]};
export function growthStats(profile,ship){return {weapon:WEAPON_MULTIPLIERS[weaponTier(profile,ship)],charge:1+.04*researchLevel(profile,'charge'),supply:1+.08*researchLevel(profile,'supply'),magnet:150+18*researchLevel(profile,'magnet')};}
export function upgradeWeapon(profile,ship){
 if(!SHIPS.some(s=>s.id===ship))return false;const tier=weaponTier(profile,ship),cost=weaponCost(tier);
 if(!cost||tier>=weaponCap(profile)||!(profile.credits>=cost.credits)||!(profile.materials?.blueprint>=cost.blueprint))return false;
 profile.credits-=cost.credits;profile.materials.blueprint-=cost.blueprint;(profile.weapons??={})[ship]=tier+1;return true;
}
export function upgradeResearch(profile,id){
 if(!RESEARCH.some(node=>node.id===id))return false;const level=researchLevel(profile,id),cost=researchCost(level);
 if(!cost||level>=researchCap(profile)||!(profile.credits>=cost.credits)||!(profile.materials?.data>=cost.data))return false;
 profile.credits-=cost.credits;profile.materials.data-=cost.data;(profile.research??={})[id]=level+1;return true;
}
