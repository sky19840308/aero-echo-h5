# AERO ECHO Build 21

Adds **Local Two-player Co-op** in the main menu, alongside the existing Google-account online mode.

Both devices open https://sky19840308.github.io/aero-echo-h5/?build=21 on the same Wi-Fi. One creates a room and the other enters its eight-character code. No sign-in is required. Keep both tabs in front. Internet is required to load the game and pair; active battle data travels directly over LAN-only WebRTC data channels. Guest Wi-Fi/AP isolation or firewalls may prevent a connection. No TURN relay or HTTP gameplay fallback is used in local mode. Start is disabled until direct channels and both loadouts are ready.

Local movement is predicted immediately. Guest input sends at 60 Hz; authoritative world snapshots target 30 Hz with bounded unordered delivery, compression, chunking, backpressure and frame sequence checks. Host simulation runs at 60 Hz. Actual latency and FPS depend on hardware and network conditions; this is not an absolute-zero-latency guarantee.

Local co-op initially copies this device’s guest profile, then maintains its own `aero-echo.lan.v1` save. All three aircraft, four skins each, hull levels/training, weapon quality, six permanent talents and three research branches are retained. Both devices settle mission rewards independently with replay protection. The full workshop opens before matchmaking and between chapters. Upgrades apply next sortie and synchronize before readiness. Death preserves permanent equipment; revival occurs at the next chapter.

Anonymous room capabilities only authorize pairing metadata. They never authorize Google accounts, cloud saves, or regular online rooms. Capability hashes are stored server-side, pairing has bounded payloads and creation/join rate limits, and origin allowlisting remains enforced. Existing account saves and online co-op rules are preserved.

Validation uses real SQLite migrations, the actual game engine/codec and native Canvas. RTC API doubles exercise anonymous pairing, blocked WAN during battle, local input, all 27 rewards, gear synchronization, death/revival, pause and leave. Main-app UI tests cover all three languages and the full workshop. These are automated functional checks, not measurements from two physical phones or all router configurations.
