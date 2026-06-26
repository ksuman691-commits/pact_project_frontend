# CirclePact Backend Integration - START HERE

## Copy This Entire Section to Your Clipboard (It's Ready to Paste)

---

## **CHOOSE YOUR PROMPT FILE (Copy the one that matches you)**

### Option 1: I want to code immediately (FASTEST)
```
File: QUICK_START_PROMPT.txt
Time: 5 minutes to read
Steps: Read issue, copy code snippet, implement directly
Best for: Experienced devs who know what they're doing
```

### Option 2: I want an LLM to guide me (BALANCED)
```
File: COPY_PASTE_PROMPT.txt
Time: 10 minutes to read
Steps: Paste entire file into Claude/ChatGPT, follow guidance
Best for: Want help but also want detailed context
```

### Option 3: I need full understanding (COMPREHENSIVE)
```
File: VSCODE_MASTER_PROMPT.md
Time: 20 minutes to read
Steps: Read thoroughly, reference while coding, use for debugging
Best for: Need architecture understanding, debugging issues
```

---

## **YOUR FILES ARE READY (All in your project root)**

**Read These First:**
- `INTEGRATION_PROMPTS_SUMMARY.txt` ← Quick reference (312 lines)
- `README_INTEGRATION.md` ← How to use the guides (333 lines)

**Choose ONE of These to Use:**
- `QUICK_START_PROMPT.txt` ← Ultra-simple code snippets (248 lines)
- `COPY_PASTE_PROMPT.txt` ← For LLM chat (331 lines)
- `VSCODE_MASTER_PROMPT.md` ← Complete reference (632 lines)

**Reference Documents (Read as needed):**
- `TOP_10_ISSUES_SUMMARY.md` ← Executive summary
- `API_INTEGRATION_CHECKLIST.md` ← Phase-by-phase guide
- `BACKEND_ALIGNMENT_ISSUES.md` ← Technical deep dive

---

## **QUICK START (Next 30 minutes)**

### Step 1: Read (5 min)
Open and read: `README_INTEGRATION.md`

### Step 2: Choose (1 min)
Use the file decision tree to pick your prompt

### Step 3: Prepare (5 min)
- [ ] Backend team confirmed all 10 endpoints exist
- [ ] You have test user credentials
- [ ] Backend base URL is in `.env`
- [ ] Test one endpoint with Postman

### Step 4: Start (20 min)
- Open your chosen prompt file
- Read Issue #1
- Ask backend team the first question
- Ready to code

---

## **THE 10 ISSUES (Copy This)**

```
#1  Mock Pact Data      → Fetch real stats from API
#2  Vote Button         → Create 4-question verification form
#3  Proof Clips         → Upload and fetch videos from /shorts
#4  No Permissions      → Hide buttons if not creator
#5  Hardcoded Stats     → Fetch real streak/reputation
#6  Comments            → Ask backend if API exists
#7  Join Requests       → Create modal to approve/reject
#8  Categories          → Change text input to dropdown
#9  Wallet              → Check balance before creating
#10 Leaderboard         → Fetch and display Shorts grid
```

**Fix Order:** #1 → #2 → #4 → #3 → #5 → #7 → rest

---

## **3-DAY EXECUTION PLAN (Copy This)**

**DAY 1 (4-6 hours)**
```
Issue #1: Pact stats (30 min)
  ↓
Issue #2: Verification (90 min)
  ↓
Issue #4: Permissions (60 min)
  ↓
Test & commit (30 min)
```

**DAY 2 (4-6 hours)**
```
Issue #3: Proof upload (90 min)
  ↓
Issue #5: Streak/rep (60 min)
  ↓
Issue #7: Join requests (90 min)
  ↓
Test & commit (30 min)
```

**DAY 3+ (As needed)**
```
Issues #6, #8, #9, #10
```

---

## **FILES YOU'LL MODIFY (Copy This)**

```
MAIN:
  src/components/CirclePactApp.tsx

CREATE NEW:
  src/components/VerificationForm.tsx
  src/components/JoinRequestsModal.tsx

UPDATE:
  src/types/index.ts
  src/services/api.ts
  src/store/auth.ts
```

---

## **TESTING AFTER EACH FIX (Copy This)**

```
1. Open DevTools (F12)
2. Go to Network tab, filter XHR
3. Perform the action (click, upload, etc.)
4. Look for API call in Network
5. Click request → Response tab
6. Verify response has expected data
7. Refresh page → verify it persists
8. Check console for errors (should be none)
9. Commit: git commit -m "Fix Issue #X: [description]"
```

---

## **SUCCESS CRITERIA (When You're Done)**

```
✓ Real user data (not dummy "Maya")
✓ Real pact stats (believers, confidence from API)
✓ Believe button → verification form → API call
✓ Upload proof → video appears in shorts
✓ Real streak number (not hardcoded 14)
✓ Real reputation (not hardcoded 92)
✓ Upload button only for creator
✓ Pending requests modal works
✓ Categories are dropdown
✓ Leaderboard shows videos
✓ No 404/403/500 errors
✓ No console errors
```

---

## **RIGHT NOW, DO THIS (Copy These Steps)**

```
1. Read INTEGRATION_PROMPTS_SUMMARY.txt
   (It tells you everything in 2 minutes)

2. Use the file decision tree to choose your prompt

3. Open your chosen file:
   - If QUICK_START: Copy code snippets
   - If COPY_PASTE: Paste into LLM
   - If MASTER: Read then reference while coding

4. Start with Issue #1 and work through

5. Test with Network tab after each fix

6. Commit after each issue

7. Move to next issue

8. Repeat until all 10 are done
```

---

## **WHICH FILE TO COPY INTO YOUR LLM**

### For Claude/Cursor in VS Code:
1. Open `COPY_PASTE_PROMPT.txt`
2. Select all (Ctrl+A)
3. Copy (Ctrl+C)
4. Open Claude chat in VS Code
5. Paste (Ctrl+V)
6. Send it
7. Ask: "Help me implement Issue #1 first, step by step"

### For ChatGPT Web:
1. Same steps
2. Just paste into ChatGPT chat

### For Deepseek/Other LLM:
1. Same steps
2. Just paste into your LLM

---

## **IF YOU GET STUCK**

```
Can't find the right file?
  → Read: README_INTEGRATION.md (file decision tree at top)

Don't know which issue to fix first?
  → Read: TOP_10_ISSUES_SUMMARY.md (priority matrix)

Something isn't working?
  → Check: VSCODE_MASTER_PROMPT.md (debugging section)

Want quick code reference?
  → Use: QUICK_START_PROMPT.txt (just snippets)

Want step-by-step guidance?
  → Use: COPY_PASTE_PROMPT.txt (full context)
```

---

## **BEFORE YOU CODE - ASK BACKEND TEAM**

```
1. "Do we have GET /pacts/{id}/stats for believers and confidence?"
2. "Is verification endpoint POST /verifications with 4 answers?"
3. "Do you store proofs as single URL or multiple Shorts?"
4. "Is there a GET /users/me/stats for streak and reputation?"
5. "Do we have a comments API?"
6. "Are join requests at GET /circles/{id}/join-requests?"
7. "What categories are predefined?"
8. "Do pacts have stakes? Do users have wallets?"
9. "Is there GET /shorts for the leaderboard?"
10. "What's the error response format?"
```

---

## **FINAL CHECKLIST**

Before you start, check these boxes:

```
[ ] Read INTEGRATION_PROMPTS_SUMMARY.txt
[ ] Read README_INTEGRATION.md
[ ] Chose your prompt file
[ ] Backend team answered questions
[ ] You have test credentials
[ ] Backend base URL is in .env
[ ] CORS is enabled
[ ] Tested one endpoint with Postman
[ ] LLM is ready (if using LLM approach)
```

---

## **GO TIME**

You have everything you need. Pick your prompt file and start.

**If using code-first approach:** Open QUICK_START_PROMPT.txt and start with Issue #1

**If using LLM approach:** Copy COPY_PASTE_PROMPT.txt into Claude/ChatGPT

**If you need everything:** Read VSCODE_MASTER_PROMPT.md first

The files are clear. The code is ready. You've got this. 🚀

---

**Questions?** Everything is explained in one of the 8 files. No question left unanswered.
