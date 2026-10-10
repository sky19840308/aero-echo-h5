# AERO ECHO Build 18

- Mobile Google sign-in uses same-tab navigation and automatically returns to GitHub, without relying on an outer popup or window.opener.
- Tab sessionStorage retains CSRF state, validated before exchanging a 60-second one-use handoff. The return fragment is immediately removed. URLs never contain a Google ID token or game session bearer.
- A verified first-party Google session can return directly to GitHub. Guest and account saves remain separate.
- Localized errors identify configuration, network, SDK, verification and return failures, with retry/return controls.
- GitHub Pages remains the frontend; the existing Site remains the authenticated backend. No new client secret or billing service is required.

Verification includes simulated missing-opener/reload cases, successful same-tab return and rejection of unsolicited, malformed, expired and replayed returns, backend authorization/CORS and game regressions. Physical iPhone and actual Google account selection require the player's browser and are not represented as automated tests.
