# AERO ECHO Build 16

The mobile lobby uses one responsive grid: account actions, account status, tools,
title, wallet, flight artwork, selected pilot, three aligned portraits, and six modes.
The duplicate current-mission launch card has been removed. Short portrait screens
use a compact title and controls; constrained viewports scroll within the lobby.

Game accounts now use Google Identity Services. The server verifies Google's RSA
signature, issuer, audience, expiry and one-time browser-bound nonce. Sessions use
Secure, HttpOnly cookies and hashed D1 session tokens. Hosting identity headers do
not authenticate game accounts. Cloud saves use the Google subject, never email.
Existing saves remain stored and guest progress is never automatically merged.

Set the runtime variable `GOOGLE_CLIENT_ID` to an OAuth Web client ID issued for
this game. Authorize `https://aero-echo-sky.spy-liver.chatgpt.site` as its JavaScript
origin. No client secret is needed for the GIS ID-token callback flow. Until the ID
is configured, the account panel clearly reports that Google login is unavailable,
and guest play remains available. Google login has not been tested with a real
production Google account because this project has no client ID configured yet.

Verified: real RSA token verification and D1 session/cloud/co-op isolation;
account caches and concurrent save conflicts; Chinese/Japanese/English DOM flows;
Worker production build. Mobile CSS has been inspected, not tested on a physical
phone or browser in this environment.
