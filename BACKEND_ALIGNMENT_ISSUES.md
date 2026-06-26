# CirclePact Frontend-Backend Alignment Analysis

**Date:** June 27, 2026  
**Status:** Pre-Integration Audit  
**Note:** Identified before connecting live API. Backend uses different LLM models for verification logic.

---

## Top 10 Frontend-Backend Misalignments

### 1. **Mock Data Structure vs. Real Backend Response**
**Issue:** Frontend uses hard-coded pact data with properties like `supportPool`, `believers`, `doubters`, `confidence` that don't exist in backend type definitions.

**Frontend (CirclePactApp.tsx, lines 9-80):**
```javascript
{
  id: 1,
  creator: 'Aniket',
  title: 'Ship MVP in 7 days',
  supportPool: 42000,        // ❌ NOT in backend Pact model
  confidence: 73,            // ❌ NOT in backend Pact model
  believers: 3420,           // ❌ NOT in backend Pact model
  doubters: 1250,            // ❌ NOT in backend Pact model
  progressPercentage: 28,    // ❌ NOT in backend Pact model
}
```

**Backend (types/index.ts):**
- Pact model has: `id`, `pact_uuid`, `creator_id`, `circle_id`, `title`, `description`, `stake_amount`, `deadline`, `status`, `verification_type`, `proof_url`, `required_approvers`, `is_public`, `created_at`, `updated_at`
- Short model has: `id`, `pact_id`, `video_url`, `view_count`, `support_count`, `challenge_count`, `confidence_score`
- Verification model has: `confidence_score` (from Q1-Q4 answers)

**Impact:** 
- Rendering will show undefined/null values for stats
- Cannot calculate "believers/doubters" without Verification data
- Need to fetch `Short` objects separately for `confidence_score`

**Fix Required:**
- Frontend needs to fetch `Verification` list for a pact to derive confidence
- Fetch `Short` objects to get public reactions (support_count vs challenge_count)
- Calculate progress from `created_at` vs `deadline`

---

### 2. **No Proof Clip Metadata Structure**
**Issue:** Frontend displays `proofClips` array with `day`, `type`, `text` fields, but backend only stores `proof_url` (single string) per pact.

**Frontend Assumption (CirclePactApp.tsx, lines 24-26):**
```javascript
proofClips: [
  { day: 1, type: 'coding', text: 'Started backend setup' },
  { day: 2, type: 'checkpoint', text: 'API endpoints complete' },
]
```

**Backend Reality:**
- `Pact.proof_url`: Single string URL
- `Short`: Stores `video_url` per pact with metadata

**Impact:**
- Cannot display multiple proof clips in sequence
- No "day" metadata associated with proofs
- No proof type classification system

**Fix Required:**
- Either modify backend to support proof metadata (day, type, caption)
- Or fetch all `Short` videos for a pact and derive timeline from `created_at`
- Map `Short.view_count` → proof legitimacy

---

### 3. **Comments System Not Implemented**
**Issue:** Frontend displays comments with user reactions (`user`, `text`, `likes`), but no comment service exists in API.

**Frontend (CirclePactApp.tsx, lines 28-30):**
```javascript
comments: [
  { user: 'dev_pro', text: 'Always delivers 🔥', likes: 234 },
]
```

**Backend:** No `CommentService` or comment endpoints defined.

**Impact:**
- Comments UI will render dummy data only
- No ability to submit or fetch real comments
- No engagement tracking

**Fix Required:**
- Add backend comment service: `GET /api/pacts/{id}/comments`, `POST /api/pacts/{id}/comments`
- Create Comment model with: `id`, `pact_id`, `user_id`, `text`, `likes_count`, `created_at`
- Implement likes functionality

---

### 4. **Voting System (Believe/Doubt) Mismatch**
**Issue:** Frontend has UI for voting ("Believe"/"Doubt") with state management, but backend voting is tied to `Verification` model with Q1-Q4 answers, not binary votes.

**Frontend (CirclePactApp.tsx, line 32):**
```javascript
userVote: null  // binary: 'believe' or 'doubt'
```

**Backend Reality:**
```typescript
Verification {
  q1_answer: string,
  q2_answer: string,
  q3_answer: string,
  q4_answer: string,
  confidence_score: number,  // derived from LLM evaluation of answers
}
```

**Impact:**
- Voting UI doesn't match verification flow
- Cannot derive "believers" count from binary votes
- Confidence score comes from LLM analysis, not vote count

**Fix Required:**
- Frontend voting should trigger verification flow (4 questions)
- "Believe" = Submit verification answers
- Display `confidence_score` from verified responses
- Count `Verification` records → "believers"
- Invert to get "doubters" (non-believers or challenge votes)

---

### 5. **No PactParticipant Role Management**
**Issue:** Frontend treats users as "believers/doubters" but backend distinguishes roles: `creator`, `participant`, `verifier` with statuses.

**Backend (types/index.ts):**
```typescript
PactParticipant {
  role: 'creator' | 'participant' | 'verifier',
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn',
}
```

**Frontend:** No role-based visibility or action control.

**Impact:**
- Cannot restrict actions (only creator can upload proof, verifiers can verify)
- No pending join request UI
- Cannot show participant list with roles

**Fix Required:**
- Frontend needs to check `PactParticipant` status before allowing proof upload
- Only show verification interface to users with role='verifier'
- Display join requests that have status='pending'

---

### 6. **Missing Streak/Reputation Calculation**
**Issue:** Frontend hardcodes `reputation: 92`, `streak: 14`, but backend has `User.reputation_score` field with no calculation logic exposed.

**Frontend (dashboard-data.ts, lines 42-43):**
```javascript
reputation: 92,
streak: 14,
```

**Backend:** 
- `User.reputation_score`: Integer field, but derivation logic in backend only
- No `/api/users/{id}/stats` endpoint to fetch calculated stats

**Impact:**
- Cannot display real reputation
- Streak calculation algorithm unknown
- Must request new endpoint or expose via user profile

**Fix Required:**
- Add `GET /api/users/{id}/stats` endpoint returning `{ streak, reputation, verified_count, total_pacts }`
- Or fetch from `User` object directly (ensure backend populates it)

---

### 7. **No Join Request Workflow Visibility**
**Issue:** Backend has full join request system (`PactJoinRequest`, `CircleJoinRequest`), but frontend has no UI for managing pending requests.

**Backend (types/index.ts):**
```typescript
PactJoinRequest {
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn',
  request_message?: string,
  response_message?: string,
}
CircleJoinRequest { /* similar */ }
```

**Frontend:** No request notifications or approval UI in dashboard.

**Impact:**
- Circle owners cannot see/approve join requests
- No pending request badge or notifications
- Pact participant flow broken

**Fix Required:**
- Add "Requests" section to Circles and Pacts tabs
- Show pending requests with approve/reject buttons
- Trigger notifications via WebSocket or polling

---

### 8. **Hardcoded Category System**
**Issue:** Frontend uses freeform categories (`'Startup'`, `'Fitness'`, `'Coding'`), but backend likely needs category enum or model.

**Frontend (CirclePactApp.tsx, lines 14-15):**
```javascript
category: 'Startup',
```

**Backend:** No Category model or enum in types file.

**Impact:**
- Cannot filter pacts by category
- Category not validated
- May cause backend errors if expects specific values

**Fix Required:**
- Define category enum in backend: `['fitness', 'startup', 'learning', 'health', 'financial', 'other']`
- Add category to Pact creation validation
- Frontend dropdown should fetch categories from backend

---

### 9. **No Wallet/Stake Amount Display Logic**
**Issue:** Frontend shows `supportPool` as visual stat, but backend uses `Pact.stake_amount` and `Wallet.balance` / `Wallet.escrow_locked` separately.

**Frontend (CirclePactApp.tsx, line 18):**
```javascript
supportPool: 42000,
```

**Backend:**
```typescript
Pact { stake_amount: number }
Wallet { 
  balance: number,
  escrow_locked: number,
  rewards_earned: number,
}
```

**Impact:**
- No visual representation of stake
- No wallet balance checks before pact creation
- No escrow flow visualization

**Fix Required:**
- Fetch `Wallet` before showing pact creation
- Display `stake_amount` in pact cards
- Show `escrow_locked` vs `balance` in wallet UI
- Implement wallet deposit flow before pact creation

---

### 10. **Shorts Feed Not Integrated with Pacts**
**Issue:** Backend has `shortsService` with independent Shorts feed, but frontend treats proof clips as part of Pact, not as Shorts.

**Backend (api.ts, lines 141-150):**
```typescript
shortsService {
  getFeed(skip?, limit?),
  react(shortId, reactionType),
  recordView(shortId),
  getById(shortId),
}
```

**Backend (types/index.ts):**
```typescript
Short {
  id: number,
  pact_id: number,
  video_url: string,
  support_count: number,
  challenge_count: number,
  confidence_score: number,
}
```

**Frontend:** No separate Shorts feed, treats videos as inline proof clips.

**Impact:**
- Shorts feed page in bottom nav has no implementation
- Missing engagement tracking per Short
- Cannot separate watch history from pact-specific proofs
- Reactions (support/challenge) not hooked up

**Fix Required:**
- Implement Shorts tab to show `shortsService.getFeed()`
- Add react/view tracking buttons
- Link Shorts back to parent Pact
- Show `confidence_score` evolution from viewer reactions

---

## Summary Table

| # | Issue | Frontend | Backend | Severity |
|---|-------|----------|---------|----------|
| 1 | Mock data mismatch | supportPool, believers, doubters | Pact, Verification, Short | 🔴 High |
| 2 | Proof clips structure | Array with metadata | Single proof_url + Shorts | 🔴 High |
| 3 | Comments system | Hardcoded comments | No endpoint | 🔴 High |
| 4 | Voting vs Verification | Binary vote UI | 4Q verification + LLM | 🔴 High |
| 5 | Role management | No role checks | PactParticipant roles | 🟠 Medium |
| 6 | Streak/Reputation | Hardcoded | User.reputation_score | 🟠 Medium |
| 7 | Join requests | No UI | Full workflow exists | 🟠 Medium |
| 8 | Category system | Freeform string | Need enum | 🟠 Medium |
| 9 | Wallet integration | supportPool stat | Pact.stake_amount + Wallet | 🟠 Medium |
| 10 | Shorts feed | Inline proof clips | Separate feed API | 🟡 Low |

---

## Integration Strategy

**Phase 1 (Auth):** Get login/register working → fetch User profile  
**Phase 2 (Core Pacts):** Fetch pact list → wire up Verification flow → show real confidence  
**Phase 3 (Circles):** Manage circles → handle join requests → show members  
**Phase 4 (Advanced):** Wallet → Shorts feed → Comments → Leaderboard

---

## Notes on LLM Integration

Since backend uses different LLM models for verification:
- Confidence score is **not** a simple vote count—it's derived from LLM evaluation of Q1-Q4 answers
- Believers/Doubters should be calculated from `Verification` records, not binary votes
- Consider caching `confidence_score` on Short for performance
- May need to re-verify if LLM model changes (backend should handle versioning)

