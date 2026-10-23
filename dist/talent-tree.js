import {TALENTS,TALENT_BRANCHES,TALENT_TREE_VERSION} from './data.js?v=30.1';

const byId=new Map(TALENTS.map(node=>[node.id,node]));
const levelOf=(talents,id)=>Math.max(0,Math.min(byId.get(id)?.max||0,Math.floor(Number(talents?.[id])||0)));
const localeIndex=()=>({zh:0,ja:1,en:2}[globalThis.document?.documentElement?.dataset?.locale||'zh']??0);
const phrases={assault:['火力专精','火力特化','Offense'],mobility:['机动专精','機動特化','Mobility'],survival:['生存专精','生存特化','Survival'],title:['飞行天赋树','飛行才能ツリー','Flight Talent Tree'],choose:['选择火力、机动、生存路线；点亮前置节点后解锁后续节点。','火力・機動・生存のルートから選択。前提ノードを点灯すると次が解放されます。','Choose offense, mobility, or survival. Light prerequisite nodes to unlock the next tier.'],points:['剩余点数','残りポイント','Points available'],summary:['九章共可获得 18 点天赋。每个节点点亮后立即生效，三条路线可以混合强化。','全9章で才能ポイントを18獲得。点灯したノードはすぐ有効になり、3系統を組み合わせられます。','Earn 18 points across nine chapters. Lit nodes take effect immediately, and all three paths can be mixed.']};
const localized=key=>phrases[key][localeIndex()];

export function talentCanUnlock(talents,nodeOrId){
 const node=typeof nodeOrId==='string'?byId.get(nodeOrId):nodeOrId;
 return !!node&&(node.requires||[]).every(requirement=>levelOf(talents,requirement.id)>=(requirement.level||1));
}

export function canLearnTalent(profile,nodeOrId){
 const node=typeof nodeOrId==='string'?byId.get(nodeOrId):nodeOrId;
 return !!node&&Number(profile?.points)>0&&levelOf(profile?.talents,node.id)<node.max&&talentCanUnlock(profile?.talents,node);
}

export function learnTalent(profile,nodeOrId){
 if(!canLearnTalent(profile,nodeOrId))return null;
 const node=typeof nodeOrId==='string'?byId.get(nodeOrId):nodeOrId;
 profile.points=Math.max(0,Math.floor(Number(profile.points)||0)-1);
 profile.talents??={};profile.talents[node.id]=levelOf(profile.talents,node.id)+1;
 return node;
}

export function normalizeTalentProgress({treeVersion=0,points=0,talents={}}={}){
 let available=Math.max(0,Math.min(18,Math.floor(Number(points)||0)));
 const normalized=Object.fromEntries(TALENTS.map(node=>[node.id,0]));
 if((Number(treeVersion)||0)<TALENT_TREE_VERSION){
  available=Math.min(18,available+['fire','energy','shield','repair','bomb','cooldown'].reduce((sum,id)=>sum+Math.max(0,Math.min(3,Math.floor(Number(talents?.[id])||0))),0));
 }else for(const node of TALENTS)normalized[node.id]=levelOf(talents,node.id);
 return {talentTreeVersion:TALENT_TREE_VERSION,points:available,talents:normalized};
}

function talentNodeHtml(profile,node,action){
 const level=levelOf(profile.talents,node.id),unlocked=talentCanUnlock(profile.talents,node),canLearn=canLearnTalent(profile,node),status=level>0?'talent-lit':unlocked?'talent-open':'talent-locked';
 const pips=Array.from({length:node.max},(_,index)=>`<i class="${index<level?'lit':''}"></i>`).join('');
 return `<button class="talent-node ${status} ${canLearn?'talent-ready':''}" type="button" data-action="${action}" data-value="${node.id}" ${canLearn?'':'disabled'} aria-label="${node.name} · ${node.note} · ${level}/${node.max}"><span class="talent-node-mark">${node.glyph}</span><span class="talent-node-rank">${level}/${node.max}</span><b>${node.name}</b><small>${node.note}</small><span class="talent-node-pips" aria-hidden="true">${pips}</span></button>`;
}

export function talentTreeHtml(profile,{action='talent'}={}){
 const points=Math.max(0,Math.floor(Number(profile?.points)||0)),talents=profile?.talents||{};
 const branches=TALENT_BRANCHES.map(branch=>{
  const nodes=[branch.root,...branch.routes.flat()];
  const spent=nodes.reduce((sum,id)=>sum+levelOf(talents,id),0),percent=Math.min(100,Math.round(spent/6*100));
  const routes=branch.routes.map(([child,capstone])=>`<div class="talent-path"><span class="talent-connector" aria-hidden="true"></span>${talentNodeHtml(profile,byId.get(child),action)}<span class="talent-connector" aria-hidden="true"></span>${talentNodeHtml(profile,byId.get(capstone),action)}</div>`).join('');
  return `<section class="talent-branch branch-${branch.id}" aria-label="${localized(branch.id)}"><header class="talent-branch-head"><span class="talent-branch-mark" aria-hidden="true">${branch.id==='assault'?'✦':branch.id==='mobility'?'✧':'⬡'}</span><b>${localized(branch.id)}</b><span class="talent-branch-progress">${spent} / 6</span><i class="talent-branch-meter"><em style="width:${percent}%"></em></i></header><div class="talent-root">${talentNodeHtml(profile,byId.get(branch.root),action)}</div><div class="talent-paths">${routes}</div></section>`;
 }).join('');
 return `<section class="talent-tree"><header class="talent-tree-head"><div><span class="selection-label">${localized('title')}</span><p>${localized('choose')}</p></div><b class="talent-points"><small>${localized('points')}</small>${points}</b></header><div class="talent-branches">${branches}</div><footer class="talent-tree-foot">${localized('summary')}</footer></section>`;
}
