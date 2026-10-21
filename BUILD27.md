# Build 27

## Bomb calligraphy

- Bomb scenes retain their attack titles and summoned-hero names. Each Japanese brush character reveals in sequence, with layered ink strokes, glow and a vermilion seal.
- Dawn-7 shows 「三段撃」 with 「織田信長」, Bastion-3 shows 「風林火山」 with 「武田信玄」, and Wraith-X shows 「忍術皆伝」 with 「服部半蔵」.
- Regular skills remain free of title text and calligraphy. The Yuji Syuku font subset includes every glyph used by the six bomb callouts.

## Talent tree

- Replaced the six old talents with 15 linked nodes across Offense, Mobility and Survival. Nodes have prerequisites, rank pips, branch progress and a luminous lit state.
- The three branches use six points each, for 18 points across the nine chapters. Existing saves get their old talent ranks refunded as spendable points and can redistribute them in the new tree.
- The same tree component is used in the main hangar and local co-op hangar. Node effects feed into combat damage, movement, graze energy, pickups, warnings, bomb power and starting bomb capacity.

## Complex difficulty and drops

- Complex starts each wave with roughly 34% more aircraft than Standard. Enemies have 1.9x Standard-base durability, 1.5x movement, and 1.2x projectile speed.
- Enemy volley density is lower and fire cadence is reduced to .88; Boss skill intervals are also longer. This keeps clear dodge lanes while more, faster aircraft pressure the player.
- Routine drops are much less frequent: coins every eight kills, standard power every 16, repair and Boss resources at less frequent milestones, and supply containers every 64 kills. Bomb capacity remains capped at five.

## Five-second respawn protection

- The post-hit crash animation completes first. If the pilot has a life remaining, the respawn shield and invulnerability both start at five seconds together.
- Solo and online co-op timers now preserve the full duration. A pilot at zero lives does not receive a respawn shield.

## Verification

- `tests/lives-bombs.mjs`: life recovery, bomb caps, difficulty movement and projectiles, and the reduced Complex firing cadence.
- `tests/build27-combat.mjs`: first skills do not show title toasts, bomb titles and hero names reveal glyph-by-glyph, enemy formations and dives, sparse drops, and crash behavior.
- `tests/talent-tree.mjs`: save migration, prerequisites, lit presentation, passive effects, Complex wave density, warning windows and five-second respawn immunity.
- `tests/weapon-phases.mjs`: native Canvas warning, impact and animation-atlas regressions.
- GitHub Pages verifies the full runtime against `runtime-build27.sha256` before deployment.
