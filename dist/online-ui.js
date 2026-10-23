import {SHIPS,SKINS} from './data.js?v=30';
import {getLocale} from './i18n.js?v=30';

const text={
 account:['账户与云存档','アカウントとクラウド保存','Account & Cloud Save'],
 online:['双人协作','2人協力','Two-player Co-op'],
 guest:['游客 · 本机存档','ゲスト・端末保存','Guest · Device Save'],
 synced:['云端已同步','クラウド同期済み','Cloud Synced'],
 pending:['等待同步','同期待ち','Sync Pending'],
 saving:['正在同步','同期中','Syncing'],
 loading:['正在确认账户','アカウントを確認中','Checking Account'],
 offline:['离线 · 本机备份','オフライン・端末バックアップ','Offline · Local Backup'],
 conflict:['存档需要选择','保存データを選択','Save Choice Required'],
 accountNote:['登录后，各账户的单人进度分别保存在云端；切换账户不会合并进度。','ログイン後、ソロ進行はアカウントごとに保存されます。アカウント間で進行を混ぜません。','Sign in to keep separate cloud saves for each account. Switching accounts never merges progress.'],
 staticNote:['此链接是静态试玩版。账户、云存档和联网协作在账户版中使用。','このリンクは静的体験版です。アカウント版でクラウド保存とオンライン協力を利用できます。','This is the static edition. Accounts, cloud saves and online co-op are available in the account edition.'],
 openCloud:['打开账户版','アカウント版を開く','Open Account Edition'],
 signIn:['使用 Google 登录','Google でログイン','Sign in with Google'],
 signOut:['退出账户','ログアウト','Sign Out'],
 googleNote:['使用 Google 账户保存进度，并与另一位玩家联网协作。','Google アカウントで進行を保存し、他のプレイヤーとオンライン協力できます。','Use a Google account for cloud saves and online co-op.'],
 googleLoading:['正在连接 Google 登录…','Google ログインに接続中…','Connecting to Google sign-in…'],
 googlePending:['Google 登录暂未启用。你可以先以游客身份游玩。','Google ログインは準備中です。ゲストとしてプレイできます。','Google sign-in is not enabled yet. You can play as a guest.'],
 googleError:['Google 登录暂时无法连接，请重试。','Google ログインに接続できません。もう一度お試しください。','Could not connect to Google sign-in. Please retry.'],
 googlePopupNote:['将进入安全登录页面，完成后自动返回本游戏。请使用 Safari / Chrome 打开。','安全なログイン画面に移動し、完了後ゲームに自動で戻ります。Safari / Chrome をご利用ください。','Open the secure sign-in page, then return to this game automatically. Use Safari / Chrome.'],
 googleStorageError:['浏览器无法保存登录状态。请用 Safari / Chrome 打开游戏后重试。','ログイン状態を保存できません。Safari / Chrome でゲームを開いて再試行してください。','This browser cannot save sign-in state. Open the game in Safari / Chrome and retry.'],
 googleReturnExpired:['登录返回已失效或不是原来的浏览器页面，请再次点击 Google 登录。','ログインの戻り情報が無効か、元のブラウザー画面ではありません。再度 Google ログインを押してください。','Sign-in return expired or is not in the original browser tab. Click Sign in with Google again.'],
 googlePopupBlocked:['浏览器拦截了登录弹窗。请允许弹窗后重试，或用 Safari / Chrome 打开。','ポップアップがブロックされました。許可して再試行するか、Safari / Chrome で開いてください。','The sign-in popup was blocked. Allow popups and retry, or open in Safari / Chrome.'],
 googlePopupRetry:['登录尚未完成，请再次点击 Google 登录。','ログインが完了していません。もう一度 Google ログインを押してください。','Sign-in did not finish. Click Sign in with Google again.'],
 nickname:['飞行员昵称','パイロット名','Pilot Name'],
 rename:['保存昵称','名前を保存','Save Name'],
 retry:['重新连接','再接続','Reconnect'],
 syncNow:['立即同步存档','今すぐ同期','Sync Save Now'],
 saved:['存档已同步','保存データを同期しました','Save Synced'],
 guestImport:['导入此设备的游客进度','この端末のゲスト進行を取り込む','Import This Device’s Guest Save'],
 importNote:['导入会先预览，并需再次确认；不会自动把游客进度写进你的账户。','取り込みはプレビュー後に確認が必要です。ゲスト進行を自動でアカウントに書き込みません。','Import is previewed and requires confirmation. Guest progress is never automatically written to your account.'],
 conflictNote:['另一个设备已经更新了云端存档。已保留本机版本，请选择要继续的进度。','別の端末がクラウド保存を更新しました。端末版は保持されています。続けるデータを選んでください。','Another device updated the cloud save. Your local version is preserved; choose which progress to continue.'],
 useCloud:['继续云端进度','クラウド版を続ける','Continue Cloud Save'],
 useLocal:['使用保留的本机版本','保持された端末版を使う','Use Preserved Local Save'],
 rules:['从第一章开始，双方使用基础机体，不读取单人强化，也不结算单人奖励。大关通关后，存活者获得 2 点临时强化；死亡即清空，队友通关当前大关后在下一大关复活。双方阵亡，本次协作结束。','第1章から基本機体で開始。ソロ強化・報酬は使いません。章クリア時、生存者に一時強化2ポイント。死亡すると消去され、仲間が章をクリアすると次章で復活。全員死亡で終了。','Start in chapter one with base aircraft. No solo upgrades or rewards. Survivors receive 2 temporary points after each chapter. Death clears your upgrades; revive next chapter if your partner clears this one. Both down ends the run.'],
 create:['创建房间','ルームを作成','Create Room'],
 join:['加入房间','ルームに参加','Join Room'],
 code:['8 位房间码','8桁のルームコード','8-character Room Code'],
 room:['房间','ルーム','Room'],
 host:['房主','ホスト','Host'],
 partner:['队友','仲間','Partner'],
 waiting:['等待队友加入','仲間の参加を待機中','Waiting for Partner'],
 start:['两人开始出击','2人で出撃','Start Together'],
 leave:['退出房间 · 返回基地','ルームを退出・基地へ','Leave Room · Return'],
 connecting:['正在接入双人战场','協力戦場に接続中','Connecting to Co-op'],
 directLink:['实时直连','リアルタイム直接接続','Direct Link'],
 relayLink:['网络中继','ネットワークリレー','Network Relay'],
 assetLoading:['等待双方资源准备完成','両者の素材準備を待機中','Waiting for Both Pilots’ Assets'],
 resume:['取消我的暂停','自分の一時停止を解除','Clear My Pause'],
 paused:['协作已暂停','協力プレイを一時停止','Co-op Paused'],
 peerPaused:['等待队友取消暂停','仲間の再開を待機中','Waiting for Partner to Resume'],
 reconnecting:['连接暂时中断，正在重连','接続が途切れました。再接続中','Connection Interrupted · Reconnecting'],
 intermission:['大关完成 · 临时强化','章クリア・一時強化','Chapter Clear · Temporary Upgrades'],
 points:['临时强化点','一時強化ポイント','Temporary Points'],
 fire:['火力 +10% / 级','火力 +10% / レベル','Damage +10% / Level'],
 shield:['受击后无敌 +0.12 秒 / 级','被弾後の無敵 +0.12 秒 / レベル','Post-hit invulnerability +0.12 seconds / level'],
 cooldown:['技能冷却 -5% / 级','スキル待機 -5% / レベル','Skill Cooldown −5% / Level'],
 ready:['准备进入下一大关','次章への準備完了','Ready for Next Chapter'],
 readyWait:['已准备 · 等待队友','準備完了・仲間を待機中','Ready · Waiting for Partner'],
 fallen:['已阵亡 · 临时成长已清空','撃墜・一時強化は消去済み','Down · Temporary Upgrades Cleared'],
 reviveNote:['队友完成本大关，下一大关以基础机体复活。','仲間がこの章をクリアすると、次章で基本機体として復活します。','If your partner clears this chapter, revive next chapter with a base aircraft.'],
 bothDown:['双方阵亡 · 本次协作结束','全員撃墜・協力終了','Both Down · Run Ended'],
 victory:['九章协作完成','9章の協力を完了','Nine-chapter Co-op Complete'],
 ended:['房间或连接已结束','ルームまたは接続が終了','Room or Connection Ended'],
 noRewards:['联机临时成长已结束，单人存档和永久奖励没有改变。','一時強化は終了しました。ソロ保存と永久報酬は変わりません。','Temporary co-op progress has ended. Your solo save and permanent rewards are unchanged.'],
 copy:['复制房间码','ルームコードをコピー','Copy Room Code'],
 copied:['房间码已复制','ルームコードをコピーしました','Room Code Copied'],
 error:['操作未完成，请检查连接后重试。','処理できませんでした。接続を確認して再試行してください。','Action could not complete. Check the connection and try again.'],
 chooseShip:['选择本次协作机体','協力機体を選択','Choose Co-op Aircraft'],
 chooseSkin:['选择机体外观','機体外観を選択','Choose Aircraft Skin'],
 busy:['正在处理','処理中','Working'],
 syncError:['暂未同步到云端；本账户的本机备份仍保留。','クラウド未同期です。このアカウントの端末バックアップは保持されています。','Not yet synced to cloud. This account’s local backup is preserved.'],
 identityChanged:['账户已切换，本次作战已停止。','アカウントが変わったため戦闘を停止しました。','Account changed. The current flight has stopped.'],
 soloImport:['本账户存档','このアカウントの保存','This Account’s Save'],
 guestBackup:['本机游客存档','端末のゲスト保存','Device Guest Save'],
 backupNote:['导入前会预览并保留覆盖前版本。登录账户的存档只会同步到该账户。','取り込み前にプレビューし、置換前の版を保持します。保存は現在のアカウントだけに同期します。','Import is previewed and preserves the previous version. Signed-in saves sync only to that account.'],
 spectator:['观战','観戦','Spectating'],
 alive:['作战中','戦闘中','In Flight'],
 loginRequired:['登录账户后可创建或加入联网房间。两人需要使用不同账户。','別々のアカウントでログインして、オンラインルームを作成・参加できます。','Sign in to create or join online rooms. Each pilot needs a different account.'],
 accountUnknown:['无法确认当前账户。请重新连接后再使用云功能。','現在のアカウントを確認できません。再接続してからクラウド機能をご利用ください。','Could not verify the current account. Reconnect before using cloud features.'],
 offlineStart:['连接恢复后才能创建或加入联网房间。','再接続後にルームを作成・参加できます。','Reconnect before creating or joining a room.'],
 export:['下载存档备份','バックアップをダウンロード','Download Save Backup'],
 close:['返回','戻る','Return'],
 credits:['信用点','クレジット','Credits'],
 clears:['已通关小关','クリア済みミッション','Cleared Missions'],
 backup:['保留的本机版本','保持された端末版','Preserved Local Version'],
 cloud:['云端版本','クラウド版','Cloud Version'],
 deadReady:['确认下一大关复活','次章の復活を確認','Confirm Revival Next Chapter'],
 rejoin:['重新打开协作大厅','協力ロビーへ','Open Co-op Lobby'],
 nicknameSaved:['昵称已保存','名前を保存しました','Pilot Name Saved'],
 chapter:['章','章','Chapter'],
 accountLoading:['正在加载账户存档，请稍候。','アカウント保存を読込中です。','Loading your account save. Please wait.'],
 unsupportedGoogle:['Google 登录暂未启用。','Google ログインは準備中です。','Google sign-in is not enabled yet.'],
 upgradeCap:['每项最多 8 级，仅本次协作有效。','各8レベルまで。この協力プレイ中のみ有効。','Up to 8 levels per upgrade, valid only for this run.'],
 accountFailure:['账户服务暂时不可用','アカウントサービスが利用できません','Account Service Temporarily Unavailable'],
 connectingNote:['请保持两个游戏页面都在前台。离开前台会暂停协作。','両方のゲーム画面を前面に保ってください。バックグラウンドに移ると一時停止します。','Keep both game pages in the foreground. Backgrounding a page pauses co-op.'],
 checkLogin:['重新确认账户','アカウントを再確認','Check Account Again'],
 imported:['存档已恢复，覆盖前版本已保留。','保存データを復元し、置換前の版を保持しました。','Save Restored · Previous Version Preserved'],
 emptyGuest:['此设备尚无可导入的游客存档。','この端末に取り込めるゲスト保存はありません。','This Device Has No Guest Save to Import'],
 lobbyNote:['九章故事 · 账户独立 · 双人协作','9章ストーリー・個別保存・2人協力','Nine Chapters · Separate Accounts · Co-op'],
 leaveConfirm:['退出会结束整个房间，本次联机成长不保留。','退出するとルーム全体が終了。一時強化は保持されません。','Leaving Ends the Room. Temporary Co-op Progress Is Not Saved'],
 soloSafe:['单人进度保持不变','ソロ進行は変更なし','Solo Progress Unchanged'],
 readyStatus:['准备完成','準備完了','Ready'],
 preparing:['准备中','準備中','Preparing'],
 deadHint:['观战当前大关，等待下一大关复活。','現在の章は観戦し、次章で復活します。','Spectate This Chapter · Revive Next Chapter'],
 loadingRetry:['重新加载资源','素材を再読込','Reload Assets'],
 hostAuthority:['房主负责战场运算，双方画面通过联网同步。','ホストが戦場を計算し、両画面をオンライン同期します。','The Host Simulates the Shared Battlefield; Both Screens Sync Online'],
 unknownStatus:['等待连接','接続待機','Waiting for Connection'],
 accountSwitchSafe:['其他账户的进度不会出现在这里。','他のアカウントの進行はここに表示されません。','Other Accounts’ Progress Is Never Shown Here'],
 limitedVerification:['上线后需要两个不同账户同时加入。','公開後は別々の2アカウントで参加してください。','After Publishing, Join with Two Different Accounts'],
 restartCoop:['重新创建协作房间','新しい協力ルームを作成','Create a Fresh Co-op Room'],
 relay:['联网协作','オンライン協力','Online Co-op'],
 denied:['该房间无法加入，请核对房间码与账户。','参加できません。ルームコードとアカウントを確認してください。','Cannot Join This Room. Check the Code and Account'],
 full:['房间已有两位飞行员。','ルームは2人で満員です。','The Room Already Has Two Pilots'],
 notFound:['房间不存在或已过期。','ルームが存在しないか期限切れです。','Room Not Found or Expired'],
 ownRoom:['不能使用同一个账户占据两位飞行员席位。','同じアカウントで2人分の席を使えません。','One Account Cannot Occupy Both Pilot Seats'],
 flightLoading:['正在准备飞行资源','飛行素材を準備中','Preparing Flight Assets'],
 roomBusy:['房间操作进行中，请稍候。','ルーム処理中です。','Room Action in Progress · Please Wait'],
 unlink:['退出后仍保留本账户的单人存档。','ログアウト後もソロ保存は保持されます。','Signing Out Keeps This Account’s Solo Save'],
 sourceRestored:['已恢复游戏工程','ゲーム工程を復元済み','Game Project Restored'],
 unused:['','', ''],
};
export function onlineText(key){const row=text[key];return row?row[{zh:0,ja:1,en:2}[getLocale()]??0]:key;}
export const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t=onlineText,e=escapeHtml;
const button=(action,label,disabled=false,value='')=>`<button class="secondary" data-action="${action}" ${value?`data-value="${e(value)}"`:''} ${disabled?'disabled':''}>${t(label)}</button>`;
const link=(url,label)=>`<a class="primary cloud-link" href="${e(url)}" target="_top">${t(label)} ↗</a>`;
const googleButton=()=>`<div id="google-signin" class="google-signin" role="status" aria-label="${e(t('signIn'))}">${t('googleLoading')}</div>`;
export function accountBadge(account){return account.user?`${account.user.name} · ${t(account.status==='disabled'?'guest':account.status)}`:t(account.status==='disabled'||account.status==='guest'?'guest':account.status);}
export function accountPanel(account,{cloudUrl,signinUrl,signoutUrl,guestAvailable=false}={}){
 if(!account.enabled)return `<p class="modal-note">${t('staticNote')}</p>${link(cloudUrl,'openCloud')}<p class="tiny-note">${t('googleNote')}</p>`;
 if(!account.user)return `<p class="modal-note">${t('accountNote')}</p><p class="save-warning">${t(account.status==='loading'?'accountLoading':account.status==='offline'?'accountUnknown':'guest')}</p>${googleButton()}${button('account-retry','checkLogin',account.status==='loading')}<p class="tiny-note">${t('googleNote')}</p>`;
 const conflict=account.conflict;
 return `<div class="account-card"><small>${t('account')}</small><h3>${e(account.user.name)}</h3><p>${e(accountBadge(account))}</p></div><p class="modal-note">${t('accountNote')}</p>${conflict?`<p class="save-warning">${t('conflictNote')}</p><div class="result-stats">${[['cloud',conflict.remote],['backup',conflict.local]].map(([label,p])=>`<div><span>${t(label)}</span><b>${Number(p?.credits||0).toLocaleString()} ${t('credits')}</b><small>${Object.keys(p?.clears||{}).length} / 27</small></div>`).join('')}</div>${button('account-conflict','useCloud',false,'cloud')}${button('account-conflict','useLocal',false,'local')}`:`${button('account-sync','syncNow',account.status==='loading')}${button('account-retry','retry',account.status==='loading')}`}<label class="online-field">${t('nickname')}<input id="account-name" maxlength="24" value="${e(account.user.name)}" autocomplete="nickname"></label>${button('account-nickname','rename')}<span class="selection-label">${t('guestImport')}</span><p class="tiny-note">${t('importNote')}</p>${button('account-guest-import','guestImport',!guestAvailable||!!conflict)}${button('export-save','export')}<p class="tiny-note">${t('googleNote')}</p>${button('account-signout','signOut')}`;
}
export function coopPanel(account,session,{cloudUrl,signinUrl,choice={shipIndex:0,skin:0},busy=false}={}){
 if(!account.enabled)return `<p class="modal-note">${t('staticNote')}</p>${link(cloudUrl,'openCloud')}<p class="tiny-note">${t('rules')}</p>`;
 if(!account.user)return `<p class="modal-note">${t('loginRequired')}</p>${googleButton()}${button('account-retry','retry',account.status==='loading')}`;
 if(!session?.code)return `<p class="modal-note coop-rules">${t('rules')}</p><span class="selection-label">${t('chooseShip')}</span><div class="segmented">${SHIPS.map((ship,i)=>`<button data-action="coop-ship" data-value="${i}" class="${i===choice.shipIndex?'active':''}" ${busy?'disabled':''}>${e(ship.name)}</button>`).join('')}</div><span class="selection-label">${t('chooseSkin')}</span><div class="skin-grid">${SKINS.map((skin,i)=>`<button data-action="coop-skin" data-value="${i}" class="${i===choice.skin?'active':''}" ${busy?'disabled':''}>${e(skin)}</button>`).join('')}</div><button class="primary" data-action="coop-create" ${busy?'disabled':''}>${t(busy?'busy':'create')} ↗</button><label class="online-field">${t('code')}<input id="coop-code" maxlength="8" minlength="8" pattern="[A-HJ-NP-Z2-9]{8}" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="XXXXXXXX"></label>${button('coop-join',busy?'busy':'join',busy)}<p class="tiny-note">${t('connectingNote')}</p>`;
 const state=session.state,local=session.local,crew=session.game?.crew||[],room=session.room;
 const roster=['host','guest'].map(role=>{const member=room?.[role],pilot=crew.find(p=>p.role===role);return `<div class="coop-pilot"><span>${t(role==='host'?'host':'partner')}</span><strong>${member?e(member.name):t('waiting')}</strong><small>${pilot?t(pilot.alive?'alive':'fallen'):member?e(SHIPS[member.choice?.shipIndex??0]?.name):'—'}</small></div>`;}).join('');
 let body='';
 if(state==='waiting')body=`<p class="modal-note">${t('waiting')}</p>${session.role==='host'?button('coop-start','start',!room?.guest||busy):''}`;
 else if(state==='loading')body=`<p class="modal-note">${t('assetLoading')}</p>`;
 else if(state==='paused')body=`<p class="save-warning">${t(session.networkPaused?'reconnecting':'paused')}</p>${button('coop-resume','resume',!session.pauseFlags?.[session.role])}${!session.pauseFlags?.[session.role]?`<p class="tiny-note">${t('peerPaused')}</p>`:''}`;
 else if(state==='intermission')body=`<h3>${t('intermission')}</h3>${local?.alive?`<div class="wallet"><span>${t('points')} <b>${local.points}</b></span></div><div class="coop-upgrades">${['fire','shield','cooldown'].map(node=>`<button class="talent-card" data-action="coop-upgrade" data-value="${node}" ${!local.points||local.upgrades[node]>=8||local.ready?'disabled':''}><span>${local.upgrades[node]} / 8</span><b>${t(node)}</b></button>`).join('')}</div><p class="tiny-note">${t('upgradeCap')}</p>`:`<p class="save-warning">${t('fallen')}</p><p class="modal-note">${t('reviveNote')}</p>`}${button('coop-ready',local?.ready?'readyWait':local?.alive?'ready':'deadReady',local?.ready)}`;
 else if(state==='finished'||state==='failed')body=`<h3>${t(state==='finished'?'victory':session.failureReason==='both-down'?'bothDown':'ended')}</h3><p class="modal-note">${t('noRewards')}</p>`;
 else body=`<p class="modal-note">${t('relay')}</p>${!local?.alive?`<p class="save-warning">${t('deadHint')}</p>`:''}`;
 return `<div class="room-code"><small>${t('room')}</small><strong>${e(session.code)}</strong>${button('coop-copy','copy')}</div><div class="coop-roster">${roster}</div>${body}<p class="tiny-note">${t('soloSafe')}</p>${button('coop-leave','leave',busy)}`;
}
