# AERO ECHO Build 23

Fixes several verified gaps between the anonymous LAN lobby and battle startup. Room creation is not treated as proof that a WebRTC connection is ready.

- Exchange ICE candidates as they become available instead of sending only one SDP after a four-second wait. Keep accepting late candidates for the current offer, deduplicate them, retry failed signaling writes and bound candidate sizes.
- Bind answers to the active offer and room member. Permit STUN address discovery for direct connections, but reject TURN relay candidates. Gameplay still has no HTTP/server relay in local mode.
- Handle incoming data channels that are already open when delivered. Exchange and acknowledge both pilots' complete equipment before enabling Start.
- Add host-side reconnection with a fresh offer; the guest rebuilds its connection for that offer. Show connection/configuration status and copyable diagnostics without capabilities, SDP or IP addresses.
- Send Start through the established reliable data channel. Update public room metadata in the background, so a slow public request cannot block local battle entry. Both clients must still finish asset loading before the host advances the simulation.
- Preserve all local talents, hull levels, weapon forging, research, mission rewards, direct guest movement and no-login play. Diagnostic text wraps on narrow screens.

Verification covers the real SQLite/capability API, all 27 local mission transitions and upgrades, the actual main-app LAN Create/Join/start flows in three languages, legacy online regressions and a strict delayed-candidate/already-open-channel fixture. The latter withholds connectivity until both sides receive late candidates, exercises retry and reaches playing on both sides while the public Start request is deliberately stalled.

The native libwebrtc diagnostic could not run here: the host denies network-interface enumeration required for ICE. Protocol fixtures are not real Wi-Fi tests; physical iPhones and router-specific direct connectivity remain unverified. No zero-latency guarantee is made.
