// Text remains live, translated HTML. These decorations never gate an action.
export const TALENT_ICONS={fire:'fire_control',energy:'energy',shield:'shield',repair:'repair',bomb:'bomb',cooldown:'cooldown'};
export const SHIP_ICONS={
 Dawn7:{weapon:'autocannon',secondary:'missile',skill:'overclock',ultimate:'laser',passive:'accuracy'},
 Bastion3:{weapon:'autocannon',secondary:'drone',skill:'dome',ultimate:'gravity',passive:'armor'},
 WraithX:{weapon:'laser',secondary:'charge',skill:'phase',ultimate:'singularity',passive:'accuracy'}
};
export const RESEARCH_ICONS={charge:'charge',supply:'repair',magnet:'gravity'};
export function gameIcon(manifest,name,extra=''){
 const meta=manifest?.menuArt?.icons?.[name]||manifest?.menuArt?.ui?.[name];
 return meta?`<img class="game-icon ${extra}" src="${meta.src}" data-fallback="${meta.fallback}" alt="" aria-hidden="true" decoding="async" loading="lazy">`:'';
}
