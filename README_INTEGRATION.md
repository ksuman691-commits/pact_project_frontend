# CirclePact Backend Integration Guide

## How to Use This Guide

You have **3 prompt files** to choose from:

### 1. **QUICK_START_PROMPT.txt** ⭐ **START HERE**
- **Best for:** Fastest execution, copy-pasting code snippets
- **Length:** 248 lines (5 min read)
- **When to use:** You want quick, focused code examples
- **How to use:** Open in your editor, read one issue at a time, copy code blocks into your LLM

### 2. **COPY_PASTE_PROMPT.txt**
- **Best for:** Complete reference with more detail
- **Length:** 331 lines (10 min read)
- **When to use:** You want full context but still concise
- **How to use:** Paste entire content into your LLM chat at once

### 3. **VSCODE_MASTER_PROMPT.md**
- **Best for:** Deep dive, debugging, architecture understanding
- **Length:** 632 lines (20 min read)
- **When to use:** You need comprehensive guide with all debugging tips
- **How to use:** Reference while coding, use for troubleshooting

---

## Recommended Workflow

### Step 1: Choose Your Prompt (2 min)
Pick ONE file above based on your learning style:
- **Impatient?** → Use **QUICK_START_PROMPT.txt**
- **Balanced?** → Use **COPY_PASTE_PROMPT.txt**
- **Thorough?** → Use **VSCODE_MASTER_PROMPT.md**

### Step 2: Prepare Your LLM (1 min)
Open your LLM (Claude in VS Code, ChatGPT, Deepseek, etc.)

### Step 3: Paste the Prompt (1 min)
- Copy entire content of your chosen file
- Paste into your LLM chat
- Hit send

### Step 4: Work Through Issues (8-10 hours across 2-3 days)
Follow the LLM's guidance:
- Day 1: Issues #1, #2, #4 (4-6 hours)
- Day 2: Issues #3, #5, #7 (4-6 hours)
- Later: Issues #6, #8, #9, #10 (as needed)

### Step 5: Test & Commit
After each issue:
1. Open DevTools Network tab
2. Test the feature
3. Verify API call shows up
4. Commit your changes

---

## What Each File Contains

| Aspect | QUICK_START | COPY_PASTE | MASTER |
|--------|-------------|-----------|--------|
| **Issues covered** | All 10 | All 10 | All 10 |
| **Code examples** | Brief snippets | Full code blocks | Full + variations |
| **Testing steps** | Quick checks | Detailed steps | Comprehensive |
| **Debugging tips** | None | Minimal | Extensive |
| **Execution phases** | Overview | Detailed 3-phase | 6-phase detailed |
| **Questions for backend** | Not included | Not included | 10 detailed questions |
| **File locations** | General | Specific paths | Complete mapping |

---

## File Locations Reference

All files are in your project root:

```
/pact_project_frontend/
├── QUICK_START_PROMPT.txt          ← START HERE (fastest)
├── COPY_PASTE_PROMPT.txt           ← For LLM (most balanced)
├── VSCODE_MASTER_PROMPT.md         ← Deep dive (most comprehensive)
├── TOP_10_ISSUES_SUMMARY.md        ← Executive summary
├── API_INTEGRATION_CHECKLIST.md    ← Phase-by-phase guide
├── BACKEND_ALIGNMENT_ISSUES.md     ← Technical deep dive
├── README_INTEGRATION.md           ← THIS FILE
└── src/
    ├── components/
    │   ├── CirclePactApp.tsx       ← Main file to modify
    │   ├── VerificationForm.tsx    ← CREATE THIS
    │   └── JoinRequestsModal.tsx   ← CREATE THIS
    ├── types/
    │   └── index.ts               ← Update type definitions
    └── services/
        └── api.ts                 ← Add new endpoints
```

---

## Before You Start

### Pre-Flight Checklist
- [ ] Backend team confirmed all 10 endpoints exist
- [ ] You have test user credentials (email/password)
- [ ] Backend base URL is in your `.env` file
- [ ] Backend CORS is enabled for your frontend domain
- [ ] You've tested one backend endpoint with Postman first

### Questions to Ask Backend Team
These are included in VSCODE_MASTER_PROMPT.md but tl;dr:

1. Stats endpoint: `GET /pacts/{id}/stats` returns `{ believers_count, confidence_score }`?
2. Verification: `POST /verifications` with 4 answers, returns `confidence_score`?
3. Proof clips: Single `proof_url` on Pact, OR Shorts table?
4. User stats: `GET /users/me/stats` returns `{ current_streak, reputation_score }`?
5. Comments: Do we have a comments API?
6. Join requests: `GET /circles/{id}/join-requests`, `POST /join-requests/{id}/approve`?
7. Categories: Predefined enum or freetext?
8. Wallet: Do pacts require stakes? Do users have wallets?
9. Shorts: `GET /shorts` for leaderboard feed?
10. Error format: Responses always have `{ message, code }`?

---

## Usage Examples

### Example 1: Quick Implementation (No Guidance Needed)
**Your situation:** You know what you're doing, just need code reference
```
1. Open QUICK_START_PROMPT.txt
2. Read Issue #1, #2, #4 (the snippets)
3. Implement directly in your editor
4. Test with Network tab
5. Move to next issue
```

### Example 2: Need LLM Guidance
**Your situation:** Want LLM to walk you through each step
```
1. Open COPY_PASTE_PROMPT.txt
2. Paste entire content into Claude/ChatGPT
3. Ask: "Help me implement Issue #1 first, step by step"
4. Follow the LLM's guidance
5. Repeat for each issue
```

### Example 3: Need Deep Understanding
**Your situation:** Want to understand the full architecture first
```
1. Read BACKEND_ALIGNMENT_ISSUES.md (understand the problem)
2. Read TOP_10_ISSUES_SUMMARY.md (see the impact matrix)
3. Use VSCODE_MASTER_PROMPT.md as reference while coding
4. Ask LLM detailed questions about architecture
```

### Example 4: Debugging Issues
**Your situation:** Something isn't working
```
1. Consult VSCODE_MASTER_PROMPT.md → Debugging Tips section
2. Check the specific issue in any of the files
3. Ask LLM: "Why is Issue #X not working?" + error message
```

---

## Implementation Timeline

### Day 1 (4-6 hours): Core Functionality
```
Issue #1: Pact stats (30 min)
  ↓
Issue #2: Verification flow (90 min)
  ↓
Issue #4: Role-based access (60 min)
  ↓
Test & commit (30 min)

Result: Real pacts load with stats, users can verify with 4 questions
```

### Day 2 (4-6 hours): Workflows
```
Issue #3: Proof uploads (90 min)
  ↓
Issue #5: Streak/reputation (60 min)
  ↓
Issue #7: Join requests (90 min)
  ↓
Test & commit (30 min)

Result: Full proof workflow, real user stats, join request management
```

### Day 3+ (As Needed): Polish
```
Issue #6: Comments (if backend has it)
Issue #8: Categories dropdown
Issue #9: Wallet integration
Issue #10: Leaderboard feed

Result: Complete feature parity with backend
```

---

## Testing After Each Fix

### Network Tab Checklist
```
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by XHR
4. Do the action
5. Look for new API call
6. Click request → Response tab
7. Verify response has expected fields
8. Refresh page → verify data persists (not dummy)
```

### For Each Issue
- [ ] API call appears in Network tab
- [ ] Response has expected data structure
- [ ] UI updates with real data (not hardcoded)
- [ ] No 404/403/500 errors
- [ ] Works on page refresh
- [ ] No console errors

---

## Common Issues & Solutions

### "404 Not Found"
**Cause:** Wrong endpoint path
**Fix:** 
1. Check VSCODE_MASTER_PROMPT.md for exact endpoint
2. Verify case sensitivity (API paths are case-sensitive!)
3. Test with Postman first

### "401 Unauthorized"
**Cause:** Auth token not sent with request
**Fix:**
1. Verify axios has Authorization header in api.ts
2. Check token is valid: `localStorage.getItem('token')`

### "UI doesn't update after API call"
**Cause:** State not being set or component not re-rendering
**Fix:**
1. Add console.log in .then() to verify response: `console.log('[v0] Response:', res.data)`
2. Add console.log in setState: `console.log('[v0] Setting state:', newData)`
3. Check React DevTools component state

### "CORS error"
**Cause:** Backend doesn't allow frontend domain
**Fix:**
1. Contact backend team: "Please add frontend URL to CORS whitelist"
2. Check backend CORS config includes your domain

---

## Success Criteria

After implementing all fixes, check:

✅ Dashboard loads real user data (not dummy)
✅ Pact cards show real stats (believers, confidence)
✅ Verification form works and submits 4 answers
✅ Proof uploads work, appear in Shorts
✅ Streak/reputation show real values
✅ Upload button only shows for creator
✅ Join requests modal works
✅ Categories are dropdown
✅ Leaderboard shows recent videos
✅ No hardcoded values in UI

---

## File Decision Tree

```
Do you want to:
│
├─ Start immediately with code? 
│  └─ Use: QUICK_START_PROMPT.txt
│
├─ Use an LLM to guide you?
│  └─ Use: COPY_PASTE_PROMPT.txt
│
├─ Understand the full architecture?
│  └─ Use: VSCODE_MASTER_PROMPT.md
│
├─ See executive summary of issues?
│  └─ Read: TOP_10_ISSUES_SUMMARY.md first
│
├─ Need step-by-step by-phase guide?
│  └─ Use: API_INTEGRATION_CHECKLIST.md
│
└─ Need technical deep dive?
   └─ Read: BACKEND_ALIGNMENT_ISSUES.md first
```

---

## Next Steps

### Right Now (5 minutes)
1. Read this file (you're doing it!)
2. Choose your prompt file
3. Prepare your workspace

### Next 10 minutes
1. Open chosen prompt file
2. Read through Issues #1, #2, #4
3. Ask backend team the 10 questions

### Next 4-6 hours (Day 1)
1. Follow QUICK_START_PROMPT.txt or COPY_PASTE_PROMPT.txt
2. Implement Issues #1, #2, #4
3. Test with Network tab
4. Commit changes

### Following days
Continue with Issues #3, #5, #7 (Day 2) then #6, #8, #9, #10 as needed

---

## Questions?

If something doesn't make sense:
1. Check VSCODE_MASTER_PROMPT.md for deeper explanation
2. Check your backend API documentation
3. Test endpoint with Postman first
4. Ask your LLM the specific question

Good luck! 🚀
