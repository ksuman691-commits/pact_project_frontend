# CirclePact Frontend-Backend Integration Master Prompt for VS Code

Copy this entire prompt and paste it into your LLM (Claude, GPT, Deepseek, etc.) in VS Code to fix all 10 backend alignment issues.

---

## CONTEXT: CirclePact Project Status

**Current State:** Frontend is fully built with dummy data. Backend API exists but frontend doesn't connect to it.

**Goal:** Fix 10 critical frontend-backend misalignments and integrate live API calls.

**Tech Stack:** Next.js 14, React, TypeScript, Tailwind, Axios, Zustand

**Backend Base URL:** (you have this in your .env - it's in your axios instance)

---

## THE 10 ISSUES TO FIX (Execution Order)

### ISSUE #1: Mock Data Structure Mismatch (CRITICAL)
**Problem:** Frontend pact card shows `supportPool`, `believers`, `doubters`, `confidence` which don't exist in backend Pact model.

**Backend Reality:**
- Pact has: `id`, `creator_id`, `title`, `description`, `category`, `days`, `proof_url`, `status`
- Verification count comes from: `SELECT COUNT(*) FROM verifications WHERE pact_id = ? AND status = 'approved'`
- Confidence score is in: `verification.confidence_score` (0-100)
- Believers are: Users with approved verifications

**Files to Modify:**
1. `src/types/index.ts` - Update Pact interface
2. `src/components/CirclePactApp.tsx` - Update dummy pact data
3. `src/services/api.ts` - Add `getPactStats()` endpoint

**Fix:**
```typescript
// types/index.ts
export interface Pact {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: string;
  days: number;
  days_current: number;
  proof_url?: string;
  status: 'active' | 'completed' | 'failed';
  believers_count: number;        // ← NEW: fetched from DB
  confidence_score: number;       // ← NEW: average from verifications
  verification_count: number;     // ← NEW: total verifications
}

// api.ts - Add this new function
export const getPactStats = async (pactId: string) => {
  const response = await api.get(`/pacts/${pactId}/stats`);
  return response.data; // { believers_count, confidence_score, verification_count }
};

// CirclePactApp.tsx - In feed section, call on component mount
useEffect(() => {
  pacts.forEach(pact => {
    getPactStats(pact.id).then(stats => {
      // Update local state with real stats
    });
  });
}, []);
```

**Testing:** Check network tab - you should see GET `/pacts/{id}/stats` calls returning JSON with numbers.

---

### ISSUE #2: Vote UI ≠ Verification Flow (CRITICAL)
**Problem:** Clicking believe/doubt does nothing. Backend has 4-question verification flow with LLM scoring.

**Backend Reality:**
- POST `/verifications` creates a verification record
- Verification has 4 fields: `answer_1`, `answer_2`, `answer_3`, `answer_4`
- Backend runs LLM scoring: `(answer_match_score / 4) * 100 = confidence_score`
- Backend updates: `pact.confidence_score = AVG(all_verification.confidence_score)`

**Files to Modify:**
1. `src/components/CirclePactApp.tsx` - Replace fake vote handler
2. `src/services/api.ts` - Add verification endpoints
3. Create: `src/components/VerificationForm.tsx` - New modal with 4 questions

**Fix:**
```typescript
// api.ts - Add verification endpoints
export const createVerification = async (pactId: string, answers: {
  answer_1: string;
  answer_2: string;
  answer_3: string;
  answer_4: string;
}) => {
  const response = await api.post(`/verifications`, {
    pact_id: pactId,
    ...answers,
  });
  return response.data; // { id, confidence_score }
};

// CirclePactApp.tsx - Replace handleVote
const handleVote = async (pactId: number) => {
  // Open modal instead of fake vote
  setShowVerificationModal(true);
  setSelectedPactId(pactId);
};

// Inside modal submission:
const submitVerification = async (answers) => {
  try {
    const result = await createVerification(selectedPactId, answers);
    console.log('[v0] Verification confidence:', result.confidence_score);
    setShowVerificationModal(false);
    // Refresh pacts list
    fetchPacts();
  } catch (error) {
    console.error('[v0] Verification failed:', error);
  }
};
```

**Testing:** 
1. Click believe/doubt button → modal opens with 4 questions
2. Submit → network tab shows POST `/verifications` 
3. Response includes `confidence_score` (0-100)

---

### ISSUE #3: Proof Clips Structure Wrong (CRITICAL)
**Problem:** Frontend expects `proofClips[] = [{day, type, text}]` but backend has single `proof_url` + separate `Short` videos.

**Backend Reality:**
- Pact has: `proof_url` (single URL string, nullable)
- Shorts are separate model: `Short { id, pact_id, video_url, created_at, ...}`
- Upload endpoint: POST `/pacts/{pactId}/proof` → stores in `proof_url`
- Get proof clips: GET `/pacts/{pactId}/shorts` → returns array of Shorts

**Files to Modify:**
1. `src/types/index.ts` - Add Short interface
2. `src/components/CirclePactApp.tsx` - Update proof clips display
3. `src/services/api.ts` - Add uploadProof & getShorts

**Fix:**
```typescript
// types/index.ts
export interface Short {
  id: string;
  pact_id: string;
  video_url: string;
  created_at: string;
  size_mb?: number;
}

// api.ts
export const uploadProof = async (pactId: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`/pacts/${pactId}/proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data; // { proof_url }
};

export const getShorts = async (pactId: string) => {
  const response = await api.get(`/pacts/${pactId}/shorts`);
  return response.data; // Short[]
};

// CirclePactApp.tsx - Replace proof clips rendering
const [shorts, setShorts] = useState<Short[]>([]);

useEffect(() => {
  getShorts(pact.id).then(data => setShorts(data));
}, [pact.id]);

// In JSX:
<div className="proof-clips">
  {shorts.map((short, idx) => (
    <div key={short.id} className="proof-item">
      <video src={short.video_url} controls className="w-full h-32 object-cover rounded" />
      <p className="text-xs text-gray-500">Day {idx + 1}</p>
    </div>
  ))}
</div>
```

**Testing:** After uploading a file → network tab shows POST `/pacts/{id}/proof` → GET `/pacts/{id}/shorts` returns array with your video.

---

### ISSUE #4: No Role-Based Access Control (CRITICAL)
**Problem:** Anyone can upload proof or verify, but backend enforces: only pact creator can upload, only approved users can verify.

**Files to Modify:**
1. `src/services/api.ts` - Add error handling for 403
2. `src/components/CirclePactApp.tsx` - Check user permissions before showing buttons
3. `src/store/auth.ts` - Store user ID for comparison

**Fix:**
```typescript
// CirclePactApp.tsx - Disable upload if not creator
const isCreator = currentUser.id === pact.creator_id;

<button 
  onClick={() => handleUploadProof(pact.id)}
  disabled={!isCreator}
  className={isCreator ? 'bg-blue-500' : 'bg-gray-300 cursor-not-allowed'}
>
  {isCreator ? 'Upload Proof' : 'Only creator can upload'}
</button>

// api.ts - Global error handler for 403
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      console.error('[v0] Permission denied:', error.response.data.message);
      toast.error('You do not have permission for this action');
    }
    return Promise.reject(error);
  }
);
```

**Testing:** 
- Log in as creator → upload button enabled
- Log in as different user → button disabled with tooltip

---

### ISSUE #5: Reputation/Streak Hardcoded (IMPORTANT)
**Problem:** Dashboard shows hardcoded `14` and `92` instead of fetching from API.

**Backend Reality:**
- User has fields: `reputation_score`, `current_streak`, `longest_streak`
- Streak is calculated from: consecutive daily proof uploads
- Reputation increases on: verified belief, completed pacts

**Files to Modify:**
1. `src/store/auth.ts` - Add user stats fields
2. `src/services/api.ts` - Add getUserStats
3. `src/components/CirclePactApp.tsx` - Fetch and display real stats

**Fix:**
```typescript
// api.ts
export const getUserStats = async () => {
  const response = await api.get('/users/me/stats');
  return response.data; // { reputation_score, current_streak, longest_streak }
};

// CirclePactApp.tsx - On component mount
useEffect(() => {
  getUserStats().then(stats => {
    setUserStats({
      reputation: stats.reputation_score,
      currentStreak: stats.current_streak,
      longestStreak: stats.longest_streak
    });
  });
}, []);

// In JSX - Replace hardcoded values
<span className="text-4xl font-black">{userStats.currentStreak}</span>
```

**Testing:** Refresh page → streak number updates from backend, not hardcoded 14.

---

### ISSUE #6: Comments System Not Implemented (IMPORTANT)
**Problem:** UI shows comment section but backend has zero comment endpoints.

**Backend Reality:**
- No comment model exists yet - or backend team needs to confirm
- This is a nice-to-have feature

**Action:**
1. **BEFORE CODING:** Ask your backend team: "Do we have a comments/discussion API?"
2. If YES → Get endpoint docs and implement
3. If NO → Remove comment UI from `CirclePactApp.tsx` for now

**Files to Modify:** `src/components/CirclePactApp.tsx` - Remove comment input/display

```typescript
// TEMPORARY: Hide comments section
<div className="comments hidden">
  {/* Comment UI - restore after backend implements */}
</div>
```

**Testing:** Backend confirms endpoint exists and working → wire it up. Otherwise skip for MVP.

---

### ISSUE #7: Join Requests Have No UI (IMPORTANT)
**Problem:** Backend has full `PactJoinRequest` workflow but frontend doesn't show it.

**Backend Reality:**
- Endpoint: GET `/circles/{id}/join-requests` → pending requests
- Endpoint: POST `/join-requests/{id}/approve` → creator approves
- Endpoint: POST `/join-requests/{id}/reject` → creator rejects

**Files to Modify:**
1. Create: `src/components/JoinRequestsModal.tsx` - Modal for viewing/approving
2. `src/components/CirclePactApp.tsx` - Add button in Circles tab

**Fix:**
```typescript
// api.ts
export const getJoinRequests = async (circleId: string) => {
  const response = await api.get(`/circles/${circleId}/join-requests`);
  return response.data; // JoinRequest[]
};

export const approveJoinRequest = async (requestId: string) => {
  const response = await api.post(`/join-requests/${requestId}/approve`);
  return response.data;
};

// JoinRequestsModal.tsx - New component
export function JoinRequestsModal({ circleId, onClose }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    getJoinRequests(circleId).then(setRequests);
  }, [circleId]);

  return (
    <div className="modal">
      <h2>Pending Join Requests</h2>
      {requests.map(req => (
        <div key={req.id} className="request-card">
          <p>{req.user_name} wants to join</p>
          <button onClick={() => approveJoinRequest(req.id)}>Approve</button>
        </div>
      ))}
    </div>
  );
}

// CirclePactApp.tsx - In Circles tab
<button onClick={() => setShowJoinRequests(true)}>
  Pending Requests ({pendingCount})
</button>
```

**Testing:** 
1. Create circle as User A
2. Request to join as User B
3. User A sees "Pending Requests (1)"
4. Click → modal shows request
5. Approve → User B is added to circle

---

### ISSUE #8: Category System Undefined (IMPORTANT)
**Problem:** Frontend uses freeform strings; backend likely has predefined categories.

**Backend Reality:**
- Check your backend for: `enum PactCategory` or `pact_categories` table
- Common categories: fitness, learning, finance, productivity, health

**Files to Modify:**
1. `src/types/index.ts` - Add category enum
2. `src/components/CirclePactApp.tsx` - Use dropdown instead of freetext

**Fix:**
```typescript
// types/index.ts
export enum PactCategory {
  FITNESS = 'fitness',
  LEARNING = 'learning',
  FINANCE = 'finance',
  PRODUCTIVITY = 'productivity',
  HEALTH = 'health',
  CUSTOM = 'custom'
}

// CirclePactApp.tsx - Replace freetext input
<select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)}>
  <option value="">Select category</option>
  {Object.values(PactCategory).map(cat => (
    <option key={cat} value={cat}>{cat}</option>
  ))}
</select>
```

**Testing:** Dropdown shows predefined categories, not freetext input.

---

### ISSUE #9: Wallet Integration Missing (IMPORTANT)
**Problem:** No balance checks before pact creation, stake amounts not displayed.

**Backend Reality:**
- User might have: `wallet_balance`
- Pacts might require: `stake_amount` to participate
- Endpoint: GET `/users/me/wallet` → { balance }
- Endpoint: POST `/pacts/{id}/join-with-stake` → deducts stake

**Action:**
1. Ask backend: "Do pacts require a stake? Do we have wallet model?"
2. If YES → implement balance checking and stake deduction
3. If NO → skip for MVP

**Files to Modify:** `src/services/api.ts`, `src/components/CirclePactApp.tsx`

**Fix (if stakes required):**
```typescript
// api.ts
export const getWallet = async () => {
  const response = await api.get('/users/me/wallet');
  return response.data; // { balance }
};

// CirclePactApp.tsx
const [walletBalance, setWalletBalance] = useState(0);

useEffect(() => {
  getWallet().then(w => setWalletBalance(w.balance));
}, []);

// Before showing "Create Pact" button
{walletBalance >= minStake ? (
  <button>Create Pact</button>
) : (
  <p className="text-red-500">Insufficient balance. Need ${minStake}</p>
)}
```

**Testing:** Balance displays correctly; can't create pact if insufficient funds.

---

### ISSUE #10: Shorts Feed Not Wired (NICE-TO-HAVE)
**Problem:** Leaderboard tab is empty even though API endpoint exists.

**Backend Reality:**
- Endpoint: GET `/shorts` or GET `/shorts/trending` → returns recent Shorts
- Can filter by: category, creator, date range

**Files to Modify:**
1. `src/components/CirclePactApp.tsx` - Leaderboard tab section
2. `src/services/api.ts` - Add getShortsFeed

**Fix:**
```typescript
// api.ts
export const getShortsFeed = async (limit = 20) => {
  const response = await api.get('/shorts', { params: { limit } });
  return response.data; // Short[]
};

// CirclePactApp.tsx - Leaderboard tab
if (currentTab === 'leaderboard') {
  return (
    <div className="pb-24">
      <h1 className="text-2xl font-bold p-4">Trending Proofs</h1>
      <div className="grid grid-cols-2 gap-4 p-4">
        {shorts.map(short => (
          <div key={short.id} className="aspect-video bg-gray-200 rounded">
            <video src={short.video_url} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

useEffect(() => {
  if (currentTab === 'leaderboard') {
    getShortsFeed().then(setShorts);
  }
}, [currentTab]);
```

**Testing:** Leaderboard tab shows grid of recent videos.

---

## INTEGRATION EXECUTION CHECKLIST

### Before You Start
- [ ] Confirm backend base URL in `.env` (it's in your axios instance)
- [ ] Backend team confirms all 10 endpoints are implemented
- [ ] You have test user credentials
- [ ] Backend CORS is enabled for frontend domain

### Phase 1 (Day 1): Fix Issues #1, #2, #4
**Time: 4-6 hours**
- [ ] Update `src/types/index.ts` with Pact interface
- [ ] Update `src/services/api.ts` with new endpoints
- [ ] Update `src/components/CirclePactApp.tsx` to call APIs
- [ ] Test in browser → network tab shows real API calls
- [ ] Commit: "Phase 1: Wire pact stats, verification flow, RBAC"

### Phase 2 (Day 2): Fix Issues #3, #5, #7
**Time: 4-6 hours**
- [ ] Create upload handler for proof clips
- [ ] Fetch user stats (streak, reputation)
- [ ] Build join requests modal
- [ ] Test: upload file → see network request → GET shorts returns it
- [ ] Commit: "Phase 2: Proof uploads, user stats, join requests"

### Phase 3 (Later): Fix Issues #6, #8, #9, #10
**Time: 4h each**
- [ ] Confirm backend comment endpoints exist (ask team)
- [ ] Add category dropdown
- [ ] Add wallet balance check
- [ ] Wire leaderboard feed
- [ ] Commit: "Phase 3: Comments, categories, wallet, leaderboard"

---

## DEBUGGING TIPS

### API Call Not Showing in Network Tab?
1. Check `src/services/api.ts` - is the endpoint URL correct?
2. Check browser console for errors: `console.error('[v0]', error)`
3. Check .env - is `NEXT_PUBLIC_API_BASE_URL` set?

### "404 Not Found" Error?
1. Verify endpoint path matches backend exactly (case-sensitive!)
2. Verify pact ID is being passed: `console.log('[v0] Pact ID:', pactId)`
3. Test endpoint with Postman/Insomnia first

### "401 Unauthorized"?
1. Check auth token is being sent: in api.ts, is `Authorization` header set?
2. Check token isn't expired: `useAuthStore((s) => s.token)`

### UI Not Updating After API Call?
1. Verify state is being set: `setUserStats(data)` inside `.then()`
2. Verify component re-renders: add `console.log('[v0] UserStats:', userStats)` in JSX
3. Check React DevTools → see component state changing

---

## FILE LOCATIONS REFERENCE

| Issue | Main File | Secondary Files |
|-------|-----------|-----------------|
| #1 Pact Stats | `CirclePactApp.tsx` | `types/index.ts`, `api.ts` |
| #2 Verification | `CirclePactApp.tsx` | `VerificationForm.tsx` (new) |
| #3 Proof Clips | `CirclePactApp.tsx` | `types/index.ts`, `api.ts` |
| #4 RBAC | `CirclePactApp.tsx` | `api.ts` |
| #5 Streak/Rep | `CirclePactApp.tsx` | `api.ts`, `auth.ts` |
| #6 Comments | `CirclePactApp.tsx` | Ask backend team |
| #7 Join Requests | `JoinRequestsModal.tsx` (new) | `CirclePactApp.tsx`, `api.ts` |
| #8 Categories | `CirclePactApp.tsx` | `types/index.ts` |
| #9 Wallet | `CirclePactApp.tsx` | `api.ts` |
| #10 Shorts Feed | `CirclePactApp.tsx` | `api.ts` |

---

## QUESTIONS TO ASK YOUR BACKEND TEAM

Before you code, get answers to these:

1. **Issue #1:** How do I fetch believer count and confidence score for a pact?
   - Endpoint: `GET /pacts/{id}/stats`?
   - Response shape: `{ believers_count, confidence_score }`?

2. **Issue #2:** What's the verification endpoint and scoring formula?
   - Endpoint: `POST /verifications`?
   - Input: 4 answers + pact_id?
   - Output: confidence_score (0-100)?

3. **Issue #3:** Where are proof clips stored?
   - Single file in pact.proof_url?
   - Multiple in Shorts table?
   - Endpoint for upload: `POST /pacts/{id}/proof`?

4. **Issue #5:** Where's the user stats endpoint?
   - `GET /users/me/stats`?
   - Fields: `reputation_score`, `current_streak`?

5. **Issue #6:** Do we have a comments API yet?
   - Yes → give me endpoint docs
   - No → we'll skip for MVP

6. **Issue #7:** Join requests flow confirmed?
   - `GET /circles/{id}/join-requests`?
   - `POST /join-requests/{id}/approve`?

7. **Issue #8:** What categories are supported?
   - Enum in backend?
   - Or open-ended strings?

8. **Issue #9:** Are pacts stakeable? Do users have wallets?
   - Yes → give me wallet endpoints
   - No → we'll skip

9. **Issue #10:** Shorts endpoint ready?
   - `GET /shorts` for feed?
   - Supports pagination/filtering?

10. **General:** What's the error response format?
    - Always `{ message, code }`?
    - HTTP status codes meaningful?

---

## SUCCESS CRITERIA

After implementing ALL 10 fixes, you should see:

✅ Network tab: Real API calls (not dummy data)
✅ Dashboard: Real streak number, real reputation score
✅ Pact cards: Real believer count, real confidence scores
✅ Upload: Can upload proof → see in Shorts
✅ Vote: Clicking believe → opens 4-question form → submits to API
✅ Auth: Creator buttons enabled, non-creator buttons disabled
✅ Circles: "Pending Requests" button shows count → modal with approvals
✅ Leaderboard: Recent Shorts display in grid
✅ Categories: Dropdown with predefined options
✅ Wallet (if applicable): Balance displays, can't create if insufficient funds

---

## FINAL NOTES

- **Start with Phase 1** (issues #1, #2, #4) — these are your foundation
- **Test each fix** with browser DevTools → Network tab before moving to next
- **Remove console.log statements** after debugging
- **Commit after each issue** with clear messages
- **Ask backend team questions BEFORE coding** to avoid rework

Good luck! You've got this. 🚀
