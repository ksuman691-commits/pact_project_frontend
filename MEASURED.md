# Classic redesign measured review

Captured while signed in as a seeded test user (`maya.chen`, one circle "Morning Grind", one pact). Screenshots are in `design-review/`.

| Surface | Viewport | Route | Status | Notes |
|---|---:|---|---|---|
| Login | 870×641 | `/auth/login` | Verified | Cream form panel reaches the viewport bottom with safe-area padding. |
| Pacts list | 870×641 | `/pacts` | Verified | Flat V2 list shell and blue controls render correctly. |
| Pact detail | 390×844 | `/pacts/89` | Verified | Hero title and circle name readable on the dark hero; counter reads "Day 11 of 21". |
| Circles list | 390×844 | `/circles` | Verified | Loads for a signed-in user. Owner seat plus "Nobody has sent proof this week"; legend rows appear only because seats exist. Multi-member seats, "+N" overflow and a ticked seat not checked (test circle has one member). |
| Circle detail | 390×844 | `/circles/62` | Verified | Ring, "This week" member row, "A tick means they sent proof for a pact this week." and the pact row render. |
| Dares list | 390×844 | `/dares` | Verified (empty state) | H1 "Dares", factual line, 3-cell stat row, tabs, New Dare pill, 14px-radius empty card. Test user has no dares, so a created dare was not re-checked here. |
| Home feed | 390×844 | `/feed` | Not verified | "Your record" stats and circles rail load. The feed list below stays on skeleton cards after 45s and no personalised-feed request completed; cause not yet found. `home-feed.png` shows this state. |
| QR sheet | 390×844 | `/circles/62` (Share circle) | Verified | Title, QR, link `/circles/62/wall`, Share link / Save image / Copy link. |
| Public wall | 390×844 | `/circles/62/wall` | Verified | "1 member · open to join", "No public proofs yet." and the opt-in note. |

Open issue: the home feed list never leaves its loading state for this user.
