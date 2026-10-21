import {SHIPS,SKINS,TALENTS} from './data.js?v=25';
import {getLocale} from './i18n.js?v=25';
import {onlineText,escapeHtml} from './online-ui.js?v=25';
import {trainingHtml} from './growth-ui.js?v=25';
import {progressionHtml} from './progression-ui.js?v=25';
import {canUpgradeHull,fleetLevel,upgradeCost} from './economy.js?v=25';
const strings={
 title:['本地双人合作','ローカル2人協力','Local Two-player Co-op'],
 note:['两台设备连接同一个 Wi-Fi（关闭访客网络隔离），打开本游戏。一人建房，另一人输入房间码；无需登录。配对需要联网，战斗数据由两台设备直传，不经过游戏服务器转发。','2台を同じWi-Fiに接続し、ルームコードで参加。ログイン不要。ペアリング時はインターネットが必要、戦闘は端末間で直接通信し、ゲームサーバーでは中継しません。ゲストWi-Fiの端末隔離を解除してください。','Connect both devices to the same Wi-Fi and join by room code. No sign-in. Pairing requires internet; battle traffic goes directly between devices without a game-server relay. Disable guest-network client isolation.'],
 progress:['保留完整机库成长：机体、武器、六项天赋和三项研究。首次使用继承此设备的游客进度，之后独立保存；两位玩家各自结算首通奖励。死亡不会删除永久强化。','機体・武器・全6才能・全3研究を利用。初回は端末のゲスト進行を引き継ぎ、以降は別保存。報酬は各端末に保存され、撃墜でも永久強化は保持。','Full hull, weapon, six-talent and three-research progression. Initially copies this device’s guest save, then saves separately. Each pilot earns clear rewards locally; death keeps permanent upgrades.'],
 connecting:['正在建立局域网直连…','LAN直接接続中…','Establishing LAN link…'],
 connected:['局域网直连已就绪','LAN直接接続準備完了','LAN link ready'],
 unavailable:['尚未直连。请保持两页在前台，确认同一 Wi-Fi、VPN 已关闭、路由器未开启 AP / 客户端隔离。连接失败可退出后重新建房。','未接続。両画面を前面にし、同じWi-Fi・VPNオフ・AP隔離オフを確認。失敗時は退出して新しいルームを作成。','Not connected. Keep both pages in front; check the same Wi-Fi, VPN off and AP/client isolation off. Leave and create a fresh room to retry.'],
 sync:['正在同步机体配置…','機体構成を同期中…','Syncing loadouts…'],
 upgrades:['完整机库 · 下次出击生效','機庫・次の出撃に適用','Full Hangar · Applies Next Sortie'],
 saved:['本地合作进度已保存在此设备。','ローカル協力進行を端末に保存。','Local co-op progress is saved on this device.'],
 storage:['此浏览器未允许保存合作进度。请允许网站存储后重试。','協力進行を保存できません。サイトの保存を許可してください。','This browser cannot save co-op progress. Allow site storage and retry.'],
 down:['已阵亡 · 永久天赋与升级保留，下一大关复活','撃墜・永久強化は保持、次章で復活','Down · Permanent upgrades kept; revive next chapter'],
 input:['本机操作即时响应 · 局域网直传','端末操作は即時反映・LAN直接通信','Immediate local input · Direct LAN traffic'],
 unsupported:['此浏览器不支持局域网直连，请用最新版 Safari 或 Chrome 打开。','LAN直接接続に未対応。最新のSafari / Chromeで開いてください。','This browser does not support the LAN link. Open in a current Safari or Chrome.'],
 network:['未能连接房间服务，请检查网络后重试。无需登录。','ルームサービスに接続できません。ネットワークを確認して再試行してください。ログインは不要です。','Cannot reach the room service. Check your connection and retry. No sign-in is needed.'],
 timeout:['房间服务响应超时，请稍后重试。','ルームサービスがタイムアウトしました。再試行してください。','Room service timed out. Please retry.'],
 invalidCode:['请输入完整的 8 位房间码。','8文字のルームコードを入力してください。','Enter the complete 8-character room code.'],
 sameDevice:['这是当前页面创建的房间，请让另一台设备输入房间码加入。','この画面が作成したルームです。別の端末からコードを入力して参加してください。','This room belongs to this page. Enter its code on the other device to join.'],
 rateLimited:['房间操作过于频繁，请稍等片刻再重试。','操作回数が多すぎます。少し待って再試行してください。','Too many room requests. Wait briefly and retry.'],
 response:['房间服务返回异常，请刷新游戏页面后重试。','ルームサービスの応答が不正です。ゲームを再読込して再試行してください。','Unexpected room service response. Reload the game and retry.'],
 pairing:['正在连接房间服务，请稍候…','ルームサービスに接続中です。少々お待ちください…','Connecting to the room service. Please wait…'],
 exchange:['正在交换连接信息','接続情報を交換中','Exchanging connection details'],
 addresses:['正在发现设备网络地址','端末のネットワーク経路を検索中','Discovering device addresses'],
 routes:['正在验证两台设备之间的直连','端末間の直接経路を確認中','Checking a direct route between devices'],
 retry:['重新建立直连','直接接続をやり直す','Retry Direct Connection'],
 hostRetry:['若长时间没有进入游戏，请房主点击“重新建立直连”。','進まない場合、ホストが「直接接続をやり直す」を押してください。','If this does not progress, ask the host to retry the direct connection.'],
 diagnostic:['复制连接检查信息','接続診断をコピー','Copy Connection Diagnostics'],
 check:['连接检查','接続診断','Connection Check'],
};
export const lanText=key=>strings[key]?.[{zh:0,ja:1,en:2}[getLocale()]??0]||key;
const t=onlineText,l=lanText,e=escapeHtml;
const btn=(action,label,disabled=false)=>`<button class="secondary" data-action="${action}" ${disabled?'disabled':''}>${e(label)}</button>`;
export function lanHangarHtml(progress,choice,manifest){
 const p=progress.profile,ship=SHIPS[choice.shipIndex],level=fleetLevel(p);
 return `<details class="lan-hangar" ${p.points||canUpgradeHull(p)?'open':''}><summary>${l('upgrades')}</summary><div class="wallet"><span>${t('credits')} <b>${p.credits}</b></span><span>天赋点 <b>${p.points}</b></span></div><p>LV.${level} / 50 · ${e(ship.name)}</p>${btn('lan-hull',`强化机体 · ${upgradeCost(level)} 信用点`,!canUpgradeHull(p))}${trainingHtml(p).replaceAll('data-action="upgrade-five"','data-action="lan-hull-five"')}<span class="selection-label">飞行天赋 · 全部 6 项</span><div class="talent-grid">${TALENTS.map(node=>`<button class="talent-card" data-action="lan-talent" data-value="${node.id}" ${p.points<1||(p.talents[node.id]||0)>=node.max?'disabled':''}><span>${p.talents[node.id]||0} / ${node.max}</span><b>${node.name}</b><small>${node.note}</small></button>`).join('')}</div>${progressionHtml(p,ship.id,manifest).replaceAll('data-action="forge"','data-action="lan-weapon"').replaceAll('data-action="research"','data-action="lan-research"')}</details>`;
}
export function lanPanel(progress,session,{choice={shipIndex:0,skin:0},busy=false,manifest,error=''}={}){
 const warning=(error?`<p class="save-warning" role="alert">${e(error)}</p>`:'')+(busy?`<p class="modal-note" role="status">${l('pairing')}</p>`:'');
 if(!session?.code)return `${warning}<p class="modal-note">${l('note')}</p><p class="tiny-note">${l('progress')}</p><span class="selection-label">${t('chooseShip')}</span><div class="segmented">${SHIPS.map((s,i)=>`<button data-action="lan-ship" data-value="${i}" class="${i===choice.shipIndex?'active':''}" ${busy?'disabled':''}>${e(s.name)}</button>`).join('')}</div><div class="skin-grid">${SKINS.map((s,i)=>`<button data-action="lan-skin" data-value="${i}" class="${i===choice.skin?'active':''}" ${busy?'disabled':''}>${e(s)}</button>`).join('')}</div><button class="primary" data-action="lan-create" ${busy?'disabled':''}>${t(busy?'busy':'create')}</button><label class="online-field">${t('code')}<input id="lan-code" maxlength="8" minlength="8" pattern="[A-HJ-NP-Z2-9]{8}" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="XXXXXXXX"></label>${btn('lan-join',t(busy?'busy':'join'),busy)}${busy?'':lanHangarHtml(progress,choice,manifest)}`;
 const healthy=session.peerHealthy(),loaded=session.loadoutAck===session.loadoutVersion,peer=session.peer,state=session.state;
 const d=session.diagnostics?.(),phase=!session.room.guest?t('waiting'):!peer?.pc?.remoteDescription?l('exchange'):!healthy?l(d?.localCandidates?'routes':'addresses'):!loaded||!session.remoteVersion?l('sync'):l('connected');
 const diagnostic=d?`<div class="lan-link" role="status"><b>${phase}</b><small>${l('check')} · ICE ${e(d.ice)} · ${d.localCandidates}/${d.remoteCandidates} · DATA ${e(d.control)}/${e(d.frames)} · CFG ${d.loadoutAck}/${d.loadoutVersion}${d.error?' · '+e(d.error):''}</small></div>${btn('lan-diagnostic',l('diagnostic'))}`:'';
 let body='';
 if(state==='waiting')body=`<p class="modal-note">${phase}</p>${session.role==='host'?btn('coop-start',t('start'),busy||!session.canStart):''}${!session.canStart?session.role==='host'?btn('lan-retry',l('retry'),busy):`<p class="tiny-note">${l('hostRetry')}</p>`:''}${diagnostic}`;
 else if(state==='intermission')body=`<h3>${l('upgrades')}</h3>${!session.local?.alive?`<p>${l('down')}</p>`:''}${session.local?.ready?'':lanHangarHtml(progress,choice,manifest)}${btn('coop-ready',t(session.local?.ready?'readyWait':'ready'),session.local?.ready||!session.canReady)}${!loaded?`<p>${l('sync')}</p>`:''}`;
 else if(state==='loading')body=`<p>${t('assetLoading')}</p>${diagnostic}`;
 else if(state==='paused')body=`<p class="save-warning">${t(session.networkPaused?'reconnecting':'paused')}</p>${session.networkPaused?`<p>${l('unavailable')}</p>`:''}${btn('coop-resume',t('resume'),!session.pauseFlags[session.role])}`;
 else if(['finished','failed'].includes(state))body=`<h3>${t(state==='finished'?'victory':session.failureReason==='both-down'?'bothDown':'ended')}</h3><p>${l(progress.saved?'saved':'storage')}</p>${!healthy?`<p>${l('unavailable')}</p>`:''}`;
 else body=`<p>${l('input')}</p>`;
 const roster=['host','guest'].map(role=>`<div class="coop-pilot"><span>${t(role==='host'?'host':'partner')}</span><strong>${e(session.room[role]?.name||t('waiting'))}</strong></div>`).join('');
 return `<div class="room-code"><small>${t('room')}</small><strong>${e(session.code)}</strong>${btn('coop-copy',t('copy'))}</div><div class="coop-roster">${roster}</div><p class="lan-link">${l(healthy?'connected':peer?.state==='unavailable'?'unavailable':'connecting')}${healthy&&peer.rtt>0?' · '+Math.round(peer.rtt)+' ms':''}</p>${body}<p class="tiny-note">${l('progress')}</p>${btn('coop-leave',t('leave'),busy)}`;
}
