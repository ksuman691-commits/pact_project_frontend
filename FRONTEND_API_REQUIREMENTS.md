# CirclePact Frontend-to-Backend API Requirements

**Status:** Frontend ready for backend integration. All UI/UX complete. Ready for backend API implementation.

---

## COMPLETED FRONTEND FEATURES (100% Ready)

### ✅ Phase 1: Authentication Pages
**Status:** Complete UI + Mock endpoints
- Login page (email + password)
- Register page (username, email, password, avatar)
- Password reset flow (if needed)

**Backend APIs Required:**
```
POST /api/auth/register
  Request: { username, email, password, full_name }
  Response: { access_token, user: { id, username, email, full_name, avatar_url } }
  Error: 409 if user exists

POST /api/auth/login
  Request: { email, password }
  Response: { access_token, user: { id, username, email, full_name, avatar_url } }
  Error: 401 if invalid credentials

POST /api/auth/logout
  Response: { success: true }
```

---

### ✅ Phase 2: Home Feed & Social Engagement
**Status:** Complete UI + Mock infinite scroll pagination
- Pact card display with Believe/Doubt buttons
- Comment section with add/view comments
- Proof display (photos, videos, checklists)
- Like/Share buttons
- Infinite scroll pagination

**Backend APIs Required:**
```
GET /api/pacts/feed?page=0&limit=20
  Response: { data: [pact_objects], hasMore: bool, total: number }

POST /api/pacts/{pact_id}/believe
  Request: { believer_count: number }
  Response: { success: true, believe_count: number, doubt_count: number }

POST /api/pacts/{pact_id}/doubt
  Request: { doubter_count: number }
  Response: { success: true, believe_count: number, doubt_count: number }

GET /api/pacts/{pact_id}/comments?page=0&limit=20
  Response: { data: [comment_objects], hasMore: bool }

POST /api/pacts/{pact_id}/comments
  Request: { text: string, reply_to_id?: number }
  Response: { id, text, user_id, created_at, author: { username, avatar_url } }

DELETE /api/comments/{comment_id}
  Response: { success: true }

POST /api/pacts/{pact_id}/like
  Response: { success: true, like_count: number }

POST /api/pacts/{pact_id}/share
  Request: { share_to: "circle" | "public" | "friend" }
  Response: { success: true, share_count: number }
```

---

### ✅ Phase 3: Create Pact Wizard (5-Step Form)
**Status:** Complete UI with validation, feature flag support
- Step 1: Title, description, category emoji
- Step 2: Duration, stake amount, participants
- Step 3: Verification type (Video/Photo/Checklist), frequency
- Step 4: Visibility (Public/Private/Circle), circle selection
- Step 5: Review & create

**Backend API Required:**
```
POST /api/pacts
  Request: {
    title: string,
    description: string,
    category: string (emoji),
    duration_days: number,
    stake_amount: number (0 if features disabled),
    min_participants: number,
    max_participants: number,
    verification_type: "video" | "photo" | "checklist",
    verification_frequency: "daily" | "weekly" | "custom",
    max_proof_uploads: number,
    visibility: "public" | "private" | "circle_specific",
    circle_id?: number
  }
  Response: { id, title, created_at, ... full_pact_object }
  Error: 400 if validation fails, 401 if unauthorized
```

---

### ✅ Phase 4: Pact Details Page
**Status:** Complete UI with all sections
- Pact metadata (title, description, dates, creator)
- Creator profile card
- Proof display area (photos/videos/checklists)
- Verification status section
- Belief/Doubt voting section
- Comment section
- Upload proof button (for pact creator only)

**Backend APIs Required:**
```
GET /api/pacts/{pact_id}
  Response: {
    id, title, description, category, duration_days, stake_amount,
    verification_type, verification_frequency, max_proof_uploads,
    visibility, created_at, deadline,
    creator: { id, username, avatar_url, reputation_score },
    proofs: [{ id, type, url, timestamp, uploader: { username } }],
    believes: number, doubts: number, comments_count: number,
    current_user_vote: "believe" | "doubt" | null
  }

GET /api/pacts/{pact_id}/proofs
  Response: { data: [proof_objects], hasMore: bool }

GET /api/pacts/{pact_id}/verifications
  Response: {
    total_verifications: number,
    completed_verifications: number,
    confidence_score: number,
    individual_scores: {
      completion: number,
      authenticity: number,
      rule_adherence: number,
      reputation_confidence: number
    }
  }
```

---

### ✅ Phase 5: Proof Upload & Verification
**Status:** Complete UI with 3 proof types + 4-point verification form
- ProofUploadModal: Upload photos, videos, checklist items
- ProofDisplay: Render each proof type with appropriate UI
- ProofVerificationModal: 4 Yes/No questions with conditional reason fields
- VerificationResults: Show confidence score and weighted calculation

**Backend APIs Required:**
```
POST /api/pacts/{pact_id}/proofs
  Request: FormData with { file, type: "photo" | "video" | "checklist", description }
  Response: { id, type, url, timestamp, uploader }
  Error: 413 if file too large, 415 if unsupported type

POST /api/pacts/{pact_id}/verifications
  Request: {
    completion_answer: "yes" | "no",
    completion_reason?: string,
    authenticity_answer: "yes" | "no",
    authenticity_reason?: string,
    rule_adherence_answer: "yes" | "no",
    rule_adherence_reason?: string,
    reputation_confidence_answer: "yes" | "no",
    reputation_confidence_reason?: string
  }
  Response: {
    id, verifier_id, confidence_score, created_at,
    verification_details: { ... all answers and reasons }
  }
```

---

### ✅ Phase 6: Wallet System
**Status:** Complete UI for balance, transactions, deposit, withdraw
- Wallet summary (available balance, locked funds, total earned, rewards)
- Deposit modal (card/UPI/bank methods)
- Withdraw modal (bank account, validation)
- Transaction history with filtering and pagination
- Balance updates on stake/completion/rewards

**Backend APIs Required:**
```
GET /api/wallet/balance
  Response: {
    available_balance: number,
    locked_balance: number,
    total_earned: number,
    rewards_balance: number
  }

POST /api/wallet/deposit
  Request: { amount: number, payment_method: "card" | "upi" | "bank" }
  Response: { transaction_id, status: "pending" | "completed", amount }

POST /api/wallet/withdraw
  Request: { amount: number, bank_account_id: number }
  Response: { transaction_id, status: "pending" | "completed", amount }

GET /api/wallet/transactions?page=0&limit=20&type=deposit|withdraw|stake|reward
  Response: {
    data: [
      { id, type, amount, status, created_at, description, pact_id? }
    ],
    hasMore: bool
  }

POST /api/wallet/lock-funds
  Request: { pact_id, amount }
  Response: { success: true, locked_balance }

POST /api/wallet/release-funds
  Request: { pact_id }
  Response: { success: true, available_balance }
```

---

### ✅ Phase 7: Circles/Communities System
**Status:** Complete UI for browsing, joining, managing
- Circle card display with member count, visibility badge
- Circle detail page with leaderboard
- Join circle button (public/private)
- Create circle modal (name, description, visibility)
- Invite members modal (email + shareable link)
- Pacts in circle section with infinite scroll

**Backend APIs Required:**
```
GET /api/circles?page=0&limit=20
  Response: { data: [circle_objects], hasMore: bool }

GET /api/circles/public?page=0&limit=20
  Response: { data: [circle_objects], hasMore: bool }

GET /api/circles/search?q=keyword&page=0&limit=20
  Response: { data: [circle_objects], hasMore: bool }

GET /api/circles/{circle_id}
  Response: {
    id, name, description, visibility, member_count,
    members: [{ id, username, avatar_url, role: "admin" | "member" }],
    created_by: { id, username },
    pacts: [pact_objects],
    is_member: bool
  }

POST /api/circles
  Request: {
    name: string,
    description: string,
    visibility: "public" | "private",
    avatar_url?: string
  }
  Response: { id, name, description, created_at, ... }

POST /api/circles/{circle_id}/join
  Response: { success: true, is_member: true }

POST /api/circles/{circle_id}/leave
  Response: { success: true }

GET /api/circles/{circle_id}/leaderboard?sort_by=reputation|wins|earnings
  Response: {
    data: [
      { rank, user: { id, username, avatar_url }, metric_value }
    ]
  }

POST /api/circles/{circle_id}/invite
  Request: { emails: [string] | shareable_link: bool }
  Response: { success: true, invitations_sent: number, shareable_link?: string }
```

---

### ✅ Phase 8: User Profiles & Achievements
**Status:** Complete UI for viewing, editing, following
- Profile hero (avatar, name, bio, reputation score, badges)
- Profile stats (6-card grid: created, completed, win rate, streak, earned, reputation)
- Profile tabs (Pacts, Achievements, Followers, Following, Circles)
- Achievements badges (unlocked/locked, rarity tiers)
- Follow/unfollow buttons
- Edit profile form (avatar upload, name, bio)

**Backend APIs Required:**
```
GET /api/users/{user_id}
  Response: {
    id, username, email, full_name, avatar_url, bio,
    reputation_score, created_at,
    stats: {
      pacts_created: number,
      pacts_completed: number,
      win_rate: number,
      current_streak: number,
      total_earned: number
    },
    is_following: bool (current user's follow status),
    followers_count: number,
    following_count: number
  }

GET /api/users/{user_id}/pacts?page=0&limit=20
  Response: { data: [pact_objects], hasMore: bool }

GET /api/users/{user_id}/achievements
  Response: {
    data: [
      {
        id, name, description, icon, rarity: "common" | "rare" | "epic" | "legendary",
        unlocked: bool, progress: number, progress_max: number
      }
    ]
  }

GET /api/users/{user_id}/followers?page=0&limit=20
  Response: { data: [user_objects], hasMore: bool }

GET /api/users/{user_id}/following?page=0&limit=20
  Response: { data: [user_objects], hasMore: bool }

GET /api/users/{user_id}/circles
  Response: { data: [circle_objects], hasMore: bool }

POST /api/users/{user_id}/follow
  Response: { success: true, is_following: true }

POST /api/users/{user_id}/unfollow
  Response: { success: true, is_following: false }

PUT /api/users/me
  Request: { full_name?: string, bio?: string, avatar_url?: string }
  Response: { success: true, user: { ... updated_user } }
```

---

### ✅ Phase 9: Explore/Discover Pages (Optional)
**Status:** Mockups created, awaiting backend
- Explore pacts (trending, new, by category)
- Explore circles (trending, new)
- Search across pacts and circles
- Filter by status (active, completed, expired)

**Backend APIs Required:**
```
GET /api/pacts/explore?sort_by=trending|new|popular&category=emoji&page=0&limit=20
  Response: { data: [pact_objects], hasMore: bool }

GET /api/circles/explore?sort_by=trending|new|active&page=0&limit=20
  Response: { data: [circle_objects], hasMore: bool }

GET /api/search?q=query&type=pacts|circles|users&page=0&limit=20
  Response: {
    pacts: [pact_objects],
    circles: [circle_objects],
    users: [user_objects]
  }
```

---

## MISSING FEATURES (Not Yet Built - Need Frontend + Backend)

### ❌ Direct Messaging System
**Frontend needed:** Chat UI, message list, compose modal
**Backend APIs needed:**
```
POST /api/messages
  Request: { recipient_id, text }
  Response: { id, sender_id, recipient_id, text, created_at }

GET /api/messages/conversations
  Response: { data: [{ user, last_message, unread_count }] }

GET /api/messages/with/{user_id}?page=0&limit=50
  Response: { data: [message_objects], hasMore: bool }
```

### ❌ Notifications System
**Frontend needed:** Notification bell icon, notification center modal
**Backend APIs needed:**
```
GET /api/notifications?page=0&limit=20&unread=true
  Response: {
    data: [
      {
        id, type: "believe" | "doubt" | "comment" | "follow" | "circle_invite",
        actor: { id, username, avatar_url },
        text, related_id, created_at, read: bool
      }
    ],
    unread_count: number
  }

POST /api/notifications/{notification_id}/read
  Response: { success: true }

POST /api/notifications/read-all
  Response: { success: true }
```

### ❌ Leaderboards (Global)
**Frontend needed:** Leaderboard pages with filters and sorting
**Backend APIs needed:**
```
GET /api/leaderboards/global?sort_by=reputation|earnings|wins&page=0&limit=50
  Response: {
    data: [
      {
        rank, user: { id, username, avatar_url },
        reputation_score, earnings, win_rate
      }
    ]
  }

GET /api/leaderboards/streaks?page=0&limit=50
  Response: { data: [{ rank, user, current_streak }] }
```

### ❌ Statistics & Analytics (User Dashboard)
**Frontend needed:** Stats page showing personal metrics
**Backend APIs needed:**
```
GET /api/stats/me
  Response: {
    pacts_created, pacts_completed, win_rate, current_streak,
    total_staked, total_earned, reputation_score,
    verification_accuracy, most_verified_by
  }

GET /api/stats/me/history?period=week|month|year
  Response: {
    data: [
      { date, pacts_completed, earnings, believes, doubts }
    ]
  }
```

---

## KNOWN BACKEND ISSUES (From Previous Documentation)

1. **Auth endpoints return HTML redirects instead of JSON**
   - Fix: Return JSON responses from /api/auth/login and /api/auth/register

2. **Missing pagination on list endpoints**
   - Fix: Add page/skip, limit parameters to all GET endpoints that return arrays

3. **Missing error handling for validation**
   - Fix: Return 400 status with error messages for invalid requests

4. **File uploads not handling different file types**
   - Fix: Validate file type and size for proof uploads

5. **Missing cascade deletes for related data**
   - Fix: When pact is deleted, delete proofs, verifications, comments, etc.

---

## DATABASE SCHEMA REQUIREMENTS

**Tables needed (minimum):**
- users (id, username, email, password_hash, avatar_url, bio, reputation_score, created_at)
- pacts (id, creator_id, title, description, category, stake_amount, deadline, verification_type, status, created_at)
- proofs (id, pact_id, uploader_id, type, url, description, created_at)
- verifications (id, proof_id, verifier_id, completion_answer, authenticity_answer, rule_adherence_answer, reputation_confidence_answer, reasons, confidence_score, created_at)
- believes (id, pact_id, user_id, created_at) - for Believe votes
- doubts (id, pact_id, user_id, created_at) - for Doubt votes
- comments (id, pact_id, user_id, text, reply_to_id, created_at)
- circles (id, creator_id, name, description, visibility, avatar_url, created_at)
- circle_members (id, circle_id, user_id, role, created_at)
- transactions (id, user_id, type, amount, status, description, pact_id, created_at)
- follows (id, follower_id, following_id, created_at)

---

## IMPLEMENTATION PRIORITY

### Week 1: Core MVP
1. Auth APIs (login, register, logout)
2. Pact CRUD (create, get, list, delete)
3. Wallet balance endpoints
4. Circles list and join

### Week 2: Engagement Features
1. Believe/Doubt voting
2. Comments (create, list, delete)
3. Proofs upload and list
4. Verification submission

### Week 3: Social & Polish
1. User profiles and follow
2. Achievements/badges
3. Leaderboards
4. Notifications (optional)
5. Direct messaging (optional)

---

## TESTING CHECKLIST

- [ ] All endpoints return proper JSON (not HTML)
- [ ] All endpoints include proper error messages and status codes
- [ ] All list endpoints support pagination (page/limit parameters)
- [ ] All create endpoints validate input and return 400 on invalid data
- [ ] All auth endpoints return 401 on unauthorized requests
- [ ] File uploads properly handle size and type validation
- [ ] Wallet balance updates correctly after transactions
- [ ] Cascade deletes work (delete pact → delete proofs, comments, etc.)
- [ ] Current user's follow/believe/doubt status is included in responses
- [ ] Timestamps are consistent (ISO 8601 format, UTC timezone)

---

**Ready for Backend Implementation:** ✅ All frontend pages, components, and UI complete. Just needs backend API endpoints to connect.
