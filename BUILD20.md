# AERO ECHO Build 20

The previous release reduced relay payloads but still depended on serialized HTTP round trips for actual co-op state. This release adds room-authenticated WebRTC data channels so guest inputs and live frames can bypass that path when a direct connection is available.

- Reliable control/input channel and unordered world-frame channel with a 150 ms packet lifetime, bounded buffers, frame chunking, optional negotiated gzip, connection-key/room validation and out-of-order rejection.
- Up to 15 authoritative world updates per second and 20 periodic guest inputs per second, plus immediate changed targets. The host retains damage, death and progression authority. HTTP continues to provide authenticated signaling, periodic checkpoints and fallback.
- Guest player/projectile objects are reused instead of repeatedly replaced. HUD shows Direct Link / Network Relay, measured RTT and local frame rate, allowing actual device issues to be distinguished from server processing time.
- Existing metal skins now cover both top buttons. Main-interface decorative arrows are removed; pilot portraits retain selection access.
- Bomb detonation produces a stronger decaying camera shake, slight rotational sway and optional haptics, while respecting shake and reduced-motion settings.
- All nine Boss introduction dialogues use transparent, non-blocking subtitles; they no longer open a modal or pause gameplay. Combat warnings remain separate from narrative captions.

The public Cloudflare STUN service is used without a new account or paid credential. STUN cannot guarantee connectivity through every NAT/firewall. If direct ICE negotiation fails, the existing HTTP relay remains available; a TURN service would require separate configuration. No paid TURN account was silently provisioned.

Validation covers real SQLite room authorization/signaling, gameplay/codec logic, a deterministic RTC API double, congestion and message bounds, direct updates while HTTP is blocked, independent fallback cursors, the full campaign, all nine Boss subtitle flows in three languages and native Canvas bomb-camera transforms. These checks do not constitute a physical two-phone/public-network ICE test or a guarantee of frame rate on every device.
