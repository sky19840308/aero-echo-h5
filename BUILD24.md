# Build 24

Build 24 replaces the pilot HP and shield pools with three lives per sortie. A hit removes one life and grants brief hit recovery. Repair pickups restore a life, up to three; shield pickups now clear enemy bullets and add ultimate energy.

Each pilot has a four-frame animated bomb scene and a matching full-screen strike. The strike clears enemy bullets and regular enemies, damages but cannot defeat a Boss, and returns the fighter with five seconds of invulnerability. Harder difficulties keep enemy counts, bullet counts and Boss health fixed; they increase enemy movement and aim while raising damage modestly. Enemy and Boss projectile speeds are lower overall.

The HUD and hangar display lives in place of player health bars. Co-op pilots track lives independently and become spectators at zero lives; a fallen pilot can return at the start of the next chapter.

## Verification

- `tests/lives-bombs.mjs` checks life loss and recovery, co-op snapshots, fixed enemy and Boss health/counts across difficulty levels, projectile speed scaling, and each pilot's bomb behavior.
- `tests/weapon-phases.mjs` checks warning and impact transitions in native Canvas, existing effect sheets, and all four cropped animation frames for each new hero bomb sheet.
- The Pages workflow restores the verified Build 13 media bundle, overlays Build 24, reconstructs the skin manifest, and validates every deployed runtime file against `runtime-build24.sha256`.
