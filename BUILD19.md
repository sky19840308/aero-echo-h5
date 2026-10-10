# AERO ECHO Build 19

Joining players could barely move because repeated delayed snapshots placed their local pilot in the remote interpolation path once the position gap exceeded 100 pixels. Keyboard target coordinates were also overwritten by old snapshots, and projectile prediction stopped after 300 milliseconds. The host never used this guest-only path.

- Preserve local movement at display frame rate while retaining host authority over health, damage, death, skills, drops and progression. Apply the same hazard movement slowdown locally.
- Smooth projectile, enemy, boss and remote pilot motion between packets, account for measured packet age, and bound extrapolation at 1.25 seconds. Expire cosmetic effects and off-screen projectiles.
- Negotiate schema tables/string dictionaries. All 1,280 projectiles, homing targets and boss parts remain present. Only visual position/velocity coordinates are rounded to 0.1 pixels and visual ages to 1 ms.
- Suppress downloads of unchanged snapshots and retransmission of acknowledged event history. Coalesce new guest inputs at most every 100 ms without overlapping requests. The existing full-frame format remains available for older clients.
- GitHub frontend and Site backend remain in place; Google authentication and isolated campaign/cloud saves are unchanged.

Validation compares the exact released Build 18 prediction code against the fix, simulates 150/450/800 ms latency plus jitter and 25% packet loss, and uses real SQLite API fixtures. In the stale-pose reproduction, Build 18 traveled about 49 px in two seconds while the fixed guest reached its target 536 px away. A complete 1,280-projectile/homing/boss fixture shrank from 320,679 to 89,659 bytes (72%). Tests verify movement continuity, host-authoritative damage/death, compact decoding, unchanged-frame suppression, event acknowledgements, reconnect and legacy compatibility. These figures are fixture measurements, not a physical two-phone network benchmark.
