# Build 30 — quality and visual repair

## Confirmed defects repaired

- Mixed `v=28` / `v=29` module imports created separate locale and data instances. Every runtime JavaScript import now uses the same version.
- Local co-op now inherits both pilots' hangar upgrades and talents. Each pilot's chapter wingman budget survives retries, stage changes, export and reload. A chapter clear restores that chapter's budget.
- Local co-op collects Boss loot before producing exactly one campaign result. Switching back to solo returns to the lobby safely.
- Held pause keys no longer repeatedly pause/resume. Typing in a form does not trigger flight abilities. Space/Enter activation of a focused button does not also trigger an ultimate. Modal and language selection focus is contained.
- Enemy rounds use a swept hit check in solo and co-op. Fast rounds that cross the player between frames cannot skip the hitbox.
- Guest prediction advances both hero summons and wingmen between host frames without changing authoritative lives, resources or damage.
- The entry manifest is 161,199 bytes, down from 7,957,753 bytes after skin assembly. All 171 embedded image references are retained as 162 deduplicated, individually loaded fallback images.

## Visual and flow refinement

- Lobby mode hierarchy is reorganized; the repeated desktop navigation is hidden. Empty Continue is disabled. Connected modes sit below flight modes.
- A proportional 9:16 playfield is retained across desktop and mobile layouts. Short laptop side panels can scroll. The viewport no longer forbids browser zoom.
- The three ability frames are clean scalable metal borders. This removes visible fragments from neighboring raster atlas cells.
- Enemy rounds have a solid outline/core and draw above friendly effects. The player core and P1/P2 identification remain visible. Terrain shading provides additional separation.
- Both pilots have separate lives, bombs, skill, ultimate and wingman readouts. Simultaneous hero summons use separate presentation space.
- “LOCAL DUEL” is corrected to “LOCAL CO-OP”. Local co-op instructions and state panels are provided in Chinese, Japanese and English.
- The compact Yuji Syuku callout font is bundled and preloaded. Its SIL Open Font License is in `dist/assets/fonts/OFL.txt`.
- All 27 routes have distinct repeatable formation/timing signatures while retaining their three permitted enemy types. Mission goals are explicit; the opening mission teaches movement, core awareness, skill, support, bomb and ultimate during the first 42 seconds.
- Bastion primary fire focuses during Boss fights. In the same controlled reference-loadout test, standard chapter 3/6/9 Boss durations changed from 175/165/138 to 134/130/110 seconds. Boss HP was unchanged.

## Evidence and limits

- Existing lives/bombs, combat, wingmen, talents, weapon-phase and co-op tests pass.
- New checks cover module identity/localization, keyboard dispatch, local co-op loadouts, persistent budgets, settlement, swept collision, guest animation, resource existence and atlas bounds.
- 81 controlled combat runs cover 27 missions at all three difficulties, using chapter reference upgrades, invulnerability and automated weakpoint aim. All completed; the largest observed live projectile count was 202. These runs establish completion and state stability, not human difficulty or device frame rate.
- 488 distinct local image references and 221 atlas cell definitions were checked. All 12 aircraft skin corners retain transparency. Nine chapter views and simultaneous hero summons were rendered with the real runtime and inspected.
- The public browser flow is checked after Pages deployment. Real iOS/Android hardware, sustained low-end-device FPS, audio listening quality, Google account credentials and a two-device public multiplayer session are not represented by these automated results.
- Public browser checks confirmed startup, chapter assets, local co-op, P1 skill / independent P2 bomb consumption, pause and return to lobby. The local co-op setup translates to English consistently; a stale account badge, partial help-link translation, duplicated controls heading and missing primary-launch frame found during this pass were repaired.

The build restores the immutable, SHA-verified base media, applies source changes, merges skins, prepares the compact manifest, and verifies every published file against `runtime-build30.sha256` before deployment.
