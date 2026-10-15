# AERO ECHO Build 22

Fixes a browser-only failure affecting both anonymous LAN room creation and joining. The LAN client previously invoked native `fetch` as a method of the client instance, giving it the wrong receiver. Bind it to the browser global before use. The previous Node fetch and arrow-function fixtures did not enforce browser receiver requirements.

Also protects browser-storage property access, keeps initialization inside the UI error boundary, restores room buttons after any failure, shows persistent localized connection errors and normalizes pasted room codes. Pairing requests now allow 20 seconds instead of six; live combat still uses direct data channels without HTTP gameplay requests.

Public checks measured creation at 8.5 seconds and joining at 6.9 seconds, both beyond the previous six-second deadline. A repeated create request now recovers the caller's unused waiting room, including rooms whose successful response was lost, instead of exhausting the three-room limit. Slow signaling is allowed to finish before the lobby labels it unavailable.

Regression checks enforce browser fetch receiver rules, prove the previous source fails before sending a request, exercise blocked storage and timeout/error paths, and use the actual main-app Create AND Join buttons in Chinese, Japanese and English. Public checks use the corrected frontend client against the production anonymous pairing API. RTC functional checks use an API double; this release does not claim physical two-phone testing.
