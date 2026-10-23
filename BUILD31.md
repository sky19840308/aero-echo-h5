# Build 31 — native desktop landscape

The desktop game now uses the complete browser viewport, including its actual aspect ratio. It is no longer a 450×800 portrait canvas surrounded by decorative columns.

- The landscape home screen has a large aircraft preview, pilot selection and a separate mode console. Stage selection, hangar, settings, story, results and local co-op dialogs use wide layouts.
- A desktop world is 800 units tall and as wide as the window's aspect ratio requires. Aircraft, hitboxes, bullets and effects use equal horizontal/vertical scale. A 1920×1080 window has a 1422×800 world, while 3440×1440 has a 1911×800 world.
- Player movement, both local pilots, enemy formations, collision checks, off-screen cleanup, Boss patrol, laser lanes, bullet walls and wingman positions use each world's dimensions.
- Resizing or entering/leaving fullscreen reflows coordinates and pauses active play. Lives, bombs, wingman charges, score and Boss damage are preserved.
- Network snapshots include world dimensions. Guests use the host's coordinates and retain proportional rendering when the two screens have different aspect ratios. Earlier snapshot formats retain their original 450×800 world.
- Portrait touch screens keep their prior fallback layout. All runtime imports and stylesheets use one new cache revision.

## Verification

Existing combat, lives, wingmen, talent, weapon, local co-op and Build 30 checks pass. New desktop checks cover five monitor sizes (1366×768, 1920×1080, 2560×1440, 1920×1200, 3440×1440), both outer movement edges, collision beyond x=450, wide formations and Boss walls, resize state preservation, co-op serialization, right-side guest input/projectiles, equal rendering scales and pointer mapping.

Nine standard-difficulty landscape chapter/Boss routes completed in controlled simulations using reference upgrades, invulnerability and automated aiming. These are completion/state checks, not human difficulty or measured device performance.

The browser preview was checked at 1363×936. The actual stage and HUD occupy that complete rectangle; the live battle canvas reports a 1165×800 world. The wide home screen, 1000-pixel local co-op dialog and two-aircraft battle were visually inspected. This cloud browser rejects native Fullscreen API requests; the existing failure notice remains available, and the game fills the browser window regardless.
