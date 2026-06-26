# CirclePact Frontend-Backend Misalignment: Quick Summary

## 🔴 CRITICAL (Fix Before Integration)

### Issue #1: Mock Data Structure Mismatch
```
Frontend Shows              Backend Has                 Solution
─────────────────────────────────────────────────────────────────
supportPool: 42000    →  Pact.stake_amount           Map supportPool to stake_amount
confidence: 73        →  Short.confidence_score      Fetch Short for each Pact
believers: 3420       →  Verification.count          Count Verification records
doubters: 1250        →  Short.challenge_count       Sum challenge_count from Shorts
progressPercentage    →  Not in DB                   Calculate from created_at/deadline
```
**What breaks:** Stats show undefined, no confidence score, wrong believer count  
**Fix Priority:** 🔴 HIGH - Do this first

---

### Issue #4: Vote UI ≠ Verification Flow
```
Frontend: Click "Believe" → local state toggle → show vote count
Backend:  Submit answers → LLM evaluation → confidence_score returned

Current Code (WRONG):
  handleVote(pactId, vote) { 
    setPacts(...) // just changes UI state, no API call
  }

Should Be:
  handleVerify(pactId, answers) {
    verificationService.create(pactId, answers)
    // Returns: { confidence_score: 73, ... }
  }
```
**What breaks:** No real verification happens, confidence is fake  
**Fix Priority:** 🔴 HIGH - Core feature

---

### Issue #2: Proof Clips Structure Wrong
```
Frontend expects:        Backend provides:
proofClips: [           Pact.proof_url: (single)
  { day: 1, type: '...', text: '...' },  Short.video_url: (one per proof)
  { day: 2, type: '...', text: '...' },  Short.created_at: (timestamp)
]
```
**What breaks:** Can't display proof timeline, no per-proof metadata  
**Fix Priority:** 🔴 HIGH - UX issue

---

### Issue #3: Comments System Missing
```
Frontend UI:                 Backend API:
- Show comments list         ❌ No comment endpoints
- Comment counts             ❌ No Comment model
- Like/unlike buttons        ❌ No like system
```
**What breaks:** Comments show dummy data only, no engagement  
**Fix Priority:** 🔴 HIGH - Choose: build backend or remove from frontend

---

## 🟠 IMPORTANT (Fix During Phase 2-3)

### Issue #5: Role-Based Access Control Missing
```
Backend checks PactParticipant.role but frontend doesn't:
- Only creator should upload proof
- Only verifier should answer questions
- Only circle owner should approve requests

Frontend currently: No role checks, anyone can do anything
```
**What breaks:** Security issue, wrong users can take actions  
**Fix Priority:** 🟠 MEDIUM - Easy fix, big impact

---

### Issue #6: Reputation/Streak Not Fetched
```
Frontend: 
  reputation: 92  // HARDCODED
  streak: 14      // HARDCODED

Backend:
  User.reputation_score: <real value from DB>
  Streak: Not stored (calculate from pact records)
```
**What breaks:** Same user always shows 92 reputation  
**Fix Priority:** 🟠 MEDIUM - User profile accuracy

---

### Issue #7: Join Requests Have No UI
```
Backend has full system:           Frontend has:
- PactJoinRequest model            ❌ No request list
- CircleJoinRequest model          ❌ No approve/reject UI
- Pending status tracking          ❌ No notifications
- Response messages                ❌ No pending badge

Users can't join circles/pacts properly!
```
**What breaks:** Core feature incomplete  
**Fix Priority:** 🟠 MEDIUM - Feature completeness

---

### Issue #9: Wallet Not Integrated
```
Frontend shows:                Backend provides:
supportPool in stats      →   Pact.stake_amount
                         →   Wallet.balance
                         →   Wallet.escrow_locked

Missing: Check balance before creating pact
Missing: Show escrow locked UI
Missing: Deposit/withdraw flow
```
**What breaks:** Users can create pacts they can't afford  
**Fix Priority:** 🟠 MEDIUM - Financial logic

---

## 🟡 LOW PRIORITY (Nice to Have)

### Issue #8: Category System Undefined
```
Frontend:           Backend (inferred):
"Startup"      →   ??? (no enum defined)
"Fitness"      →   ??? (check backend)
"Coding"       →   ??? (docs missing)
```
**What breaks:** May cause 422 errors on pact creation  
**Fix Priority:** 🟡 LOW - Clarify with backend team

---

### Issue #10: Shorts Feed Not Hooked Up
```
Frontend:                      Backend:
Leaderboard tab empty      →   shortsService.getFeed() exists
No reaction buttons        →   shortsService.react() exists
No view tracking           →   shortsService.recordView() exists
```
**What breaks:** Leaderboard/Shorts tab doesn't work  
**Fix Priority:** 🟡 LOW - Non-essential feature

---

## Impact Matrix

| Issue | High Impact | Complex | Effort | Start When |
|-------|----------|---------|--------|-----------|
| #1 Mock data | ✅ Yes | No | 2h | Immediately |
| #2 Proof clips | ✅ Yes | Yes | 4h | After #1 |
| #3 Comments | ✅ Yes | No | 3h | Decide backend first |
| #4 Verification | ✅ Yes | ✅ Yes | 6h | After #1 |
| #5 Roles | ✅ Yes | No | 2h | After #4 |
| #6 Reputation | No | No | 1h | Phase 2 |
| #7 Join requests | No | ✅ Yes | 4h | Phase 2 |
| #8 Categories | No | No | 1h | Phase 1 |
| #9 Wallet | No | No | 3h | Phase 3 |
| #10 Shorts | No | No | 3h | Phase 3 |

---

## Recommended Fix Order

### Day 1 (4-6 hours)
1. ✅ Fix #1: Transform pact data mapping
2. ✅ Verify backend has Verification, Short endpoints
3. ✅ Start #4: Build verification form (questions 1/2)

### Day 2 (4-6 hours)
4. ✅ Finish #4: Complete verification submission
5. ✅ Fix #2: Map proofs to Shorts timeline
6. ✅ Fix #5: Add role checks to UI

### Day 3 (4 hours)
7. ✅ Fix #3: Decide comments strategy
8. ✅ Fix #7: Build join request UI

### Phase 2 (Later)
- Fix #6, #9, #10 (nice-to-have improvements)
- Add notifications
- Optimize performance

---

## File Locations to Modify

| Issue | File | Lines |
|-------|------|-------|
| #1 | `src/components/CirclePactApp.tsx` | 9-80 (mock data) |
| #1 | `src/lib/pact-transformers.ts` | NEW FILE |
| #2 | `src/components/CirclePactApp.tsx` | 24-26, 48-50 (proofClips) |
| #3 | `src/components/CirclePactApp.tsx` | 28-30 (comments) |
| #4 | `src/components/CirclePactApp.tsx` | 82-86 (handleVote) |
| #4 | `src/components/VerificationModal.tsx` | NEW FILE |
| #5 | `src/components/CirclePactApp.tsx` | 88-89 (handleUploadProof) |
| #6 | `src/app/page.tsx` | 22-24 (reputation display) |
| #7 | `src/components/CirclePactApp.tsx` | Circles tab (NEW) |
| #8 | `src/services/api.ts` | Check if categories endpoint exists |
| #9 | `src/app/page.tsx` | Profile tab (NEW) |
| #10 | `src/components/CirclePactApp.tsx` | Leaderboard tab (NEW) |

---

## Questions for Backend Team

Before starting Phase 1 integration:

1. **Verification Questions:** What are the exact 4 verification questions? Per-pact or global?
2. **Confidence Scoring:** How is confidence_score calculated from Q1-Q4 answers? What scale (0-100)?
3. **Comments:** Are comments implemented? If yes, what's the endpoint?
4. **Categories:** What's the enum of valid categories?
5. **Reputation:** How is reputation_score calculated? Exposed on User model?
6. **Streak:** How to calculate streak from pact records?
7. **Proof Upload:** Do proofs create Short records automatically or manually?
8. **Wallet:** When should escrow_locked be deducted?
9. **Notifications:** WebSocket, polling, or webhook for join requests?
10. **LLM Models:** Which LLM models are used? How are they versioned?

---

## Test Endpoints First

```bash
# 1. Auth
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass"}'

# 2. Pacts
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/pacts

# 3. Verification
curl -X POST http://localhost:8000/api/verifications/1 \
  -H "Authorization: Bearer TOKEN" \
  -d '{"q1_answer":"...","q2_answer":"...","q3_answer":"...","q4_answer":"..."}'

# 4. Shorts
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/shorts/feed

# 5. Circles
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/circles
```

---

## Success Criteria

✅ All 10 issues identified and documented  
✅ Integration path clear (Phases 1-6)  
✅ Fix priority ranked by impact  
✅ Backend questions prepared  
✅ Test endpoints identified  
⏳ Ready for Phase 1 integration

