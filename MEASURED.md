# Classic redesign measured review

| Surface | Viewport | Route | Status | Notes |
|---|---:|---|---|---|
| Login | 870×641 | `/auth/login` | Verified | Cream form panel reaches the viewport bottom with safe-area padding. |
| Pacts list | 870×641 | `/pacts` | Verified | Flat V2 list shell and blue controls render correctly. |
| Pacts detail | 390×844 | `/pacts/89` | Verified | Hero contrast, circle chip and current-day counter corrected. |
| Circles list | 870×641 | `/circles` | Pending authenticated capture | Query is now gated on auth readiness to prevent the loading race. |
| Circle detail | 870×641 | `/circles/62` | Pending authenticated capture | Requires a logged-in preview session. |
| Dares list | 870×641 | `/dares` | Pending authenticated capture | V2 header and empty-card treatment corrected. |
| Home feed | 870×641 | `/feed` | Pending authenticated capture | Requires a logged-in preview session. |
| QR sheet / public wall | 870×641 | circle routes | Pending authenticated capture | Requires a logged-in preview session. |

`tsc --noEmit` and `git diff --check` pass for this pass. Screenshots requiring authenticated data should be re-shot from a session with valid credentials rather than recording the login redirect as page content.
