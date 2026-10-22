# Build 28

## Allied squadron support

- Each chapter grants three squadron calls. The remaining calls persist through its three campaign missions and refill after the chapter's final mission is cleared.
- A call gives the player's ship five seconds of invulnerability while ten matching wingmen assemble. The squadron then attacks for fifteen seconds, with light evasive movement and two hit points per aircraft. A second hit starts a falling, spinning crash and explosion.
- Dawn7 wingmen fire quick triple lances, Bastion3 wingmen use short range impact pulses, and WraithX wingmen launch homing phase glaives. Each ship also has its own standard wingman shot.
- Transparent SVG aircraft, engine trails, hit flashes, health marks and crash effects render in battle. The HUD shows the selected player ship beside remaining lives and three animated flames for remaining calls. The support button and `R` key activate the squadron.
- Local co-op carries remaining calls across chapter missions, replenishes them at the next chapter, and includes wingmen, their projectiles and crash state in snapshots.

## Verification

- `tests/wingmen.mjs`: per-chapter charges, invulnerability, muster and sortie timing, hero-specific attacks, friendly damage, crashes, profile migration and co-op snapshots.
- `tests/build27-combat.mjs`: native Canvas renders the transparent wingman SVG fleet and call-up shield.
- `tests/lives-bombs.mjs`, `tests/talent-tree.mjs` and `tests/weapon-phases.mjs`: existing combat, progression and Canvas regressions.
- GitHub Pages rebuilds the runtime from the verified Build 13 media bundle and verifies every deployed file against `runtime-build28.sha256`.
