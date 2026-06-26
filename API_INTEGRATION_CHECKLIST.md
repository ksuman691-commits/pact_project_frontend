# CirclePact API Integration Checklist

## Before You Start

- [ ] Backend API running on `NEXT_PUBLIC_API_URL` (check `.env.development.local`)
- [ ] Verify backend has these tables/models: Users, Circles, Pacts, PactParticipants, Verifications, Shorts, Wallets
- [ ] Get backend documentation on:
  - [ ] LLM verification scoring logic (Q1-Q4 question structure)
  - [ ] Category enum values
  - [ ] Proof upload format (URL vs file)
  - [ ] Notification strategy (WebSocket, polling, or webhook)

---

## Phase 1: Authentication ✅ (Likely Working)

### Endpoints to Test
- [x] `POST /api/auth/register` 
- [x] `POST /api/auth/login`
- [x] `GET /api/auth/me`
- [x] `POST /api/auth/logout`

### Frontend Status
- [x] `src/store/auth.ts` - Auth store implemented
- [x] `src/components/AuthInitializer.tsx` - Auto-init on mount
- [x] Token interceptor in `src/services/api.ts`

### What's Done
- Token stored in localStorage
- Bearer auth on all requests
- Auto-logout on 401

### What's Missing
- [ ] OAuth (Google/GitHub) - Not started
- [ ] Email verification flow
- [ ] Password reset flow

---

## Phase 2: Dashboard & Pacts (🔴 NEEDS FIX)

### 2.1 Fetch User Stats
**Endpoint:** `GET /api/auth/me` (already exists)

**Frontend File:** `src/app/page.tsx`

**Current Issue:** 
```javascript
// HARDCODED:
const name = user?.full_name?.split(' ')[0] || currentUser.name
const initials = ... // works from user
const reputation = user?.reputation_score ? ... : currentUser.reputation  // May not populate
```

**Action Items:**
- [ ] Verify `User.reputation_score` returns actual value
- [ ] If null/undefined, create backend endpoint `GET /api/users/{id}/stats`
- [ ] Store reputation in auth store alongside user
- [ ] Update header to use `authStore.user.reputation_score`

**Testing:**
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/auth/me
# Should return: { ..., reputation_score: 92, ... }
```

---

### 2.2 Fetch Active Pacts
**Endpoint:** `GET /api/pacts` with filters

**Frontend File:** `src/components/CirclePactApp.tsx`

**Current Issue:**
```javascript
// Lines 9-80: HARDCODED pact array
// Uses: supportPool, believers, doubters, confidence, progressPercentage, proofClips[]
```

**Action Items:**
- [ ] Call `pactService.list()` in useEffect
- [ ] Map backend `Pact` to frontend display format
- [ ] Fetch `Verification` list for each pact → calculate `believers` count
- [ ] Fetch `Short` list for each pact → get `support_count`, `challenge_count`, `confidence_score`
- [ ] Calculate `progressPercentage` from `created_at` vs `deadline`

**Mapping Function Needed:**
```typescript
// src/lib/pact-transformers.ts
export const transformPactForDisplay = (
  pact: Pact, 
  verifications: Verification[], 
  shorts: Short[]
): DisplayPact => {
  const confidence = shorts[0]?.confidence_score || 0;
  const believers = verifications.length;
  const doubters = shorts.reduce((sum, s) => sum + s.challenge_count, 0);
  const progress = calculateProgress(pact.created_at, pact.deadline);
  
  return {
    ...pact,
    confidence,
    believers,
    doubters,
    progressPercentage: progress,
    supportPool: pact.stake_amount,
    proofClips: shorts.map(s => ({
      day: daysSince(pact.created_at, s.created_at),
      type: 'proof',
      text: s.video_url,
    })),
  };
};
```

**Testing:**
```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/pacts
# Should return pacts with actual data
```

---

### 2.3 Verification Flow (THE BIG ONE)
**Endpoint:** `POST /api/verifications/{pact_id}`

**Frontend File:** `src/components/CirclePactApp.tsx`

**Current Issue:**
```javascript
// Lines 82-85: handleVote() just toggles local state
// No API call, no verification answers
userVote: null  // Should trigger Q1-Q4 form instead
```

**Major Refactor Needed:**

1. **Replace Vote UI with Verification Form**
   - Show 4 verification questions (backend must provide)
   - Input fields for Q1-Q4 answers
   - Submit answers via `verificationService.create(pactId, answers)`
   - Display returned `confidence_score` (from LLM)

2. **Questions to Ask Backend:**
   - What are the 4 verification questions?
   - Are they hardcoded or dynamic per pact?
   - How is `confidence_score` calculated? (0-100 scale?)
   - Example verification response?

3. **Frontend Implementation:**
   ```typescript
   // src/components/VerificationModal.tsx
   const handleSubmitVerification = async (pactId: number, answers: VerificationAnswers) => {
     const response = await verificationService.create(pactId, answers);
     // response.data: { confidence_score, ... }
     
     // Update pact view with new confidence
     setPacts(pacts.map(p => 
       p.id === pactId 
         ? { ...p, confidence: response.data.confidence_score }
         : p
     ));
   };
   ```

**Testing:**
```bash
curl -X POST http://localhost:8000/api/verifications/1 \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"q1_answer": "...", "q2_answer": "...", ...}'
```

---

## Phase 3: Circles & Join Requests (🟠 NEEDS UI)

### 3.1 Fetch User's Circles
**Endpoint:** `GET /api/circles`

**Frontend File:** `src/components/CirclePactApp.tsx` (Circles tab)

**Current Issue:** 
No Circles tab implementation in current component

**Action Items:**
- [ ] Add Circles tab content
- [ ] Call `circleService.list()`
- [ ] Display user's circles with owner badge
- [ ] Show pending join requests badge
- [ ] Add "Browse Circles" section for public circles

**Code:**
```typescript
// In CirclePact component
if (currentTab === 'circles') {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [publicCircles, setPublicCircles] = useState<Circle[]>([]);
  const [joinRequests, setJoinRequests] = useState<CircleJoinRequest[]>([]);

  useEffect(() => {
    circleService.list().then(res => setCircles(res.data));
    // TODO: Need endpoint for public circles browse
    // joinRequestService for pending requests
  }, []);

  return (
    <div className="space-y-4">
      <section>Your Circles</section>
      <section>Join Requests (badge: {joinRequests.length})</section>
      <section>Browse Circles</section>
    </div>
  );
}
```

---

### 3.2 Approve/Reject Join Requests
**Endpoints:**
- `POST /api/circles/{id}/join-requests/{requestId}/approve`
- `POST /api/circles/{id}/join-requests/{requestId}/reject`

**Frontend:** 
- [ ] Build request approval UI
- [ ] Call `circleJoinRequestService.approve()` or `.reject()`
- [ ] Show toast notification on success
- [ ] Refresh requests list

---

## Phase 4: Proof Uploads & Shorts (🟠 NEEDS REFACTOR)

### 4.1 Upload Proof for Pact
**Endpoint:** `POST /api/pacts/{id}/upload-proof`

**Frontend File:** `src/components/CirclePactApp.tsx`

**Current Issue:**
```javascript
// Lines 88-89: handleUploadProof() just shows alert()
const handleUploadProof = (pactId: number) => {
  alert(`Upload proof for pact ${pactId}`);
};
```

**Action Items:**
- [ ] Add file input (image/video)
- [ ] Check user is PactParticipant with role='participant' or 'creator'
- [ ] Call `pactService.uploadProofFile(pactId, file)`
- [ ] Create Short record on backend (should be automatic)
- [ ] Refresh pacts list to show new proof clip

**Code:**
```typescript
const handleUploadProof = async (pactId: number, file: File) => {
  try {
    const response = await pactService.uploadProofFile(pactId, file);
    // Should return: { short_id, video_url, confidence_score, ... }
    
    // Refresh shorts for this pact
    const shorts = await shortsService.getById(response.data.short_id);
    
    // Re-render pact with new proof clip
    showToast.success('Proof uploaded!');
  } catch (err) {
    showToast.error('Upload failed');
  }
};
```

---

### 4.2 Implement Shorts Feed
**Endpoint:** `GET /api/shorts/feed`

**Frontend File:** Create `src/components/CirclePactApp.tsx` → Leaderboard tab for now, then separate Shorts page

**Current Issue:**
Leaderboard and Shorts tabs have no implementation

**Action Items:**
- [ ] Call `shortsService.getFeed()` on tab switch
- [ ] Display shorts cards with pact context
- [ ] Add reaction buttons (support/challenge)
- [ ] Track views via `shortsService.recordView()`
- [ ] Show `confidence_score` badge

**Code:**
```typescript
if (currentTab === 'leaderboard') {
  const [shorts, setShorts] = useState<Short[]>([]);

  useEffect(() => {
    shortsService.getFeed(0, 20).then(res => setShorts(res.data));
  }, []);

  return shorts.map(short => (
    <div key={short.id}>
      <video src={short.video_url} />
      <div>
        <button onClick={() => shortsService.react(short.id, 'support')}>
          👍 {short.support_count}
        </button>
        <button onClick={() => shortsService.react(short.id, 'challenge')}>
          🤔 {short.challenge_count}
        </button>
        <span>Confidence: {short.confidence_score}%</span>
      </div>
    </div>
  ));
}
```

---

## Phase 5: Wallet & Payments (🟡 OPTIONAL)

### 5.1 Fetch Wallet
**Endpoint:** `GET /api/wallet`

**Frontend File:** `src/components/CirclePactApp.tsx` (Profile tab)

**Action Items:**
- [ ] Fetch wallet before pact creation
- [ ] Show balance vs escrow_locked vs rewards_earned
- [ ] Block pact creation if balance < stake_amount
- [ ] Add deposit UI

---

## Phase 6: Comments (🟡 OPTIONAL - NOT IN BACKEND YET)

**Status:** ❌ Not implemented in backend

**Action Items:**
- [ ] Verify if backend has comment endpoints
- [ ] If not, either:
  - [ ] Build on backend first
  - [ ] Remove from frontend UI
  - [ ] Use reactions instead of comments

---

## Testing Checklist

- [ ] `NEXT_PUBLIC_API_URL` environment variable set correctly
- [ ] Backend API is running and accessible
- [ ] Auth flow works: register → login → token saved
- [ ] Can fetch user profile with reputation
- [ ] Can fetch pacts list
- [ ] Can submit verification and get confidence_score
- [ ] Can upload proof file
- [ ] Can fetch shorts feed
- [ ] Can join/leave circle
- [ ] Can approve/reject requests

---

## Common Errors & Fixes

### 404 Not Found
- [ ] Check endpoint URL matches backend routes
- [ ] Verify `NEXT_PUBLIC_API_URL` doesn't have trailing slash

### 401 Unauthorized
- [ ] Token expired → call logout and redirect to login
- [ ] Token not being sent → check interceptor in `api.ts`

### 422 Unprocessable Entity
- [ ] Request body doesn't match backend schema
- [ ] Check backend error message for field mismatches

### Confidence Score is null/0
- [ ] Verifications list is empty (no one verified yet)
- [ ] LLM model not responding — check backend logs
- [ ] Scale is 0-100, not 0-1

### Images/Videos not displaying
- [ ] proof_url is relative path, not absolute URL
- [ ] CORS issue with media server
- [ ] Media file doesn't exist on backend storage

---

## Next Steps

1. **Run Phase 1 Tests:** Ensure auth works
2. **Fix Issue #1:** Transform mock data to real Pact responses
3. **Fix Issue #4:** Replace vote UI with verification form
4. **Wire Circles:** Get join requests UI working
5. **Implement Shorts:** Show feed with reactions
6. **Polish:** Comments, notifications, edge cases

