# AERO ECHO Build 17 — GitHub frontend + Site backend

Official player entry: https://sky19840308.github.io/aero-echo-h5/

- Enables cloud accounts and two-player co-op from GitHub Pages.
- Retains the existing Site/D1 backend and all Google account saves.
- Google login uses a first-party secure popup on the already-authorized Site origin.
  No additional JavaScript origin is needed for this flow.
- The popup transfers only a 60-second, one-use handoff code, bound to a random
  frontend state and the exact GitHub origin. An atomic exchange issues a revocable
  seven-day session, kept in the current tab's sessionStorage (not localStorage).
- Cross-origin APIs use explicit bearer authentication with credentials omitted.
  Only https://sky19840308.github.io is allowed; wildcard CORS is never used.
- Existing same-origin HttpOnly Google cookies continue to work on the Site.
- Account assertions, independent cloud saves and compare-and-swap conflicts remain
  enforced. Unauthenticated headers and client-provided account IDs cannot sign in.
- Preserves Build 16 mobile menu layout and Build 15 skins, music and three-language
  ending sequence.

Verification: actual RSA Google JWT verification tests; SQLite/D1 account and
co-op tests; one-use exchange, expiry, origin, replay, logout and isolation tests;
popup script and frontend message validation; three-language main-app flows.
Live Google consent on a physical device still requires player testing.
