export const AUDIO_DEFAULTS={musicVolume:1,effectsVolume:.20};
export function audioVolume(settings,key){
 const value=settings?.[key];return typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(1,value)):AUDIO_DEFAULTS[key];
}
export function volumeSettingsHtml(settings){
 return `<div class="volume-settings">${[['musicVolume','背景音乐音量'],['effectsVolume','音效音量']].map(([key,label])=>{const percent=Math.round(audioVolume(settings,key)*100);return `<div class="volume-control"><div><label for="volume-${key}">${label}</label><output id="value-${key}" for="volume-${key}">${percent}%</output></div><input id="volume-${key}" data-volume="${key}" type="range" min="0" max="100" step="1" value="${percent}" aria-label="${label}" aria-valuetext="${percent}%" style="--volume:${percent}%"></div>`;}).join('')}<p class="tiny-note">独立调整音乐与音效，立即生效并自动保存。0% 为静音。</p></div>`;
}
