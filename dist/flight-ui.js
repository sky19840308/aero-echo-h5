const copy={
 zh:{setup:'两名玩家在同一画面合作，主炮自动开火。两架飞机各有三条命，并各自使用技能、爆弹、大招与联军。',host:'主机',guest:'副机',move:'移动',skill:'主动技',bomb:'爆弹',wing:'联军',ult:'终极技',pause:'暂停',ship:'副机战机',start:'开始同屏合作',restart:'重新开始同屏合作',solo:'恢复单人 · 返回基地',note:'沿用当前航线、难度与机库升级。联军次数分别保存，重开不恢复；完成大关后恢复。',keyboard:'电脑操作',together:'同屏合作',auto:'主炮自动开火 · 支持拖拽',lives:'命数',ready:'就绪',down:'已击坠 · 队友可继续作战',right:'右',space:'空格',numpad:'小键盘',alternate:'无小键盘：右 Shift / 右 Ctrl / 右 Alt / Enter'},
 ja:{setup:'同じ画面で協力プレイ。主砲は自動発射。各機が3つの残機と、独立したスキル・ボム・必殺技・援軍を持ちます。',host:'1P',guest:'2P',move:'移動',skill:'スキル',bomb:'ボム',wing:'援軍',ult:'必殺技',pause:'一時停止',ship:'2Pの機体',start:'同画面協力を開始',restart:'同画面協力を再開',solo:'1人プレイに戻る',note:'現在の航路・難易度・格納庫の強化を使用。援軍の使用回数は個別に保存され、章クリアで回復します。',keyboard:'キーボード',together:'同画面協力',auto:'主砲は自動発射・ドラッグ移動対応',lives:'残機',ready:'準備OK',down:'撃墜・仲間は戦闘を続行できます',right:'右',space:'Space',numpad:'テンキー',alternate:'テンキーなし：右 Shift / 右 Ctrl / 右 Alt / Enter'},
 en:{setup:'Cooperate on one screen with automatic fire. Each pilot has three lives and separate skills, bombs, ultimate energy and wingmen.',host:'Pilot 1',guest:'Pilot 2',move:'Move',skill:'Skill',bomb:'Bomb',wing:'Wingmen',ult:'Ultimate',pause:'Pause',ship:'Pilot 2 aircraft',start:'Start local co-op',restart:'Restart local co-op',solo:'Return to solo lobby',note:'Use the selected route, difficulty and hangar upgrades. Each pilot’s wingman budget is saved across retries and restored after a chapter clear.',keyboard:'Keyboard controls',together:'Local co-op',auto:'Automatic fire · drag to move',lives:'Lives',ready:'Ready',down:'Down · your teammate can keep fighting',right:'Right ',space:'Space',numpad:'Numpad',alternate:'No numpad: right Shift / right Ctrl / right Alt / Enter'}
};
const t=locale=>copy[locale]||copy.zh;
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const key=value=>'<kbd>'+escape(value)+'</kbd>';

export function flightControlsHtml(duo=false,locale='zh'){
 const c=t(locale),actions=[c.skill,c.bomb,c.wing,c.ult];
 const pilot=(role,keys,movement)=>`<section class="control-pilot" data-role="${role}">${duo?`<b>${role==='host'?'P1 · '+c.host:'P2 · '+c.guest}</b>`:''}<p>${movement} · ${c.move}</p><dl>${keys.map((value,index)=>`<div><dt>${key(value)}</dt><dd>${actions[index]}</dd></div>`).join('')}</dl></section>`;
 return `<span class="eyebrow">${duo?c.together:c.keyboard}</span>${pilot('host',['Q','E','R',c.space],duo?'W A S D':'W A S D / ↑ ↓ ← →')}${duo?pilot('guest',['1','2','3','0'],'↑ ↓ ← → · '+c.numpad)+`<p class="control-alternate">${c.alternate}</p>`:''}<p class="control-footer">${key('P / Esc')} ${c.pause}${duo?'':`<br>${c.auto}`}</p>`;
}

export function duoSetupHtml({ships,hostShip,guestShip,enabled,locale='zh'}){
 const c=t(locale);
 return `<p>${c.setup}</p><p class="duo-host">P1 · ${c.host}: ${escape(ships[hostShip].name)}</p><label class="selection-label" for="local-duo-ship">${c.ship}</label><select id="local-duo-ship">${ships.map((ship,index)=>`<option value="${index}" ${index===guestShip?'selected':''}>${escape(ship.name)} · ${escape(ship.role)}</option>`).join('')}</select><div class="duo-controls">${flightControlsHtml(true,locale)}</div><button class="primary" data-action="local-duo-start">${enabled?c.restart:c.start}</button>${enabled?`<button class="secondary" data-action="local-duo-disable">${c.solo}</button>`:''}<p class="tiny-note">${c.note}</p>`;
}

export function duoStatusHtml(game,locale='zh'){
 const c=t(locale);
 return game.crew.map(pilot=>{
  const p=pilot.player,alive=pilot.alive&&p.lives>0;
  return `<section data-role="${pilot.role}" class="duo-pilot${alive?'':' fallen'}"><strong>${pilot.role==='host'?'P1':'P2'} · ${escape(pilot.ship.name)}</strong><span>${c.lives} <b>${Math.max(0,p.lives||0)}</b> · ${c.bomb} <b>${p.bombs||0}</b> · ${c.wing} <b>${p.wingmanCharges||0}</b></span><small>${alive?`${c.skill} ${p.skillCd>0?Math.ceil(p.skillCd)+'s':c.ready} · ${c.ult} ${Math.floor(p.energy/10)}%`:c.down}</small></section>`;
 }).join('');
}
