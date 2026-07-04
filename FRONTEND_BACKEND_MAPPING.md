# CirclePact Frontend-Backend Mapping

## Quick Reference: Which Frontend Page Uses Which Backend API

### Navigation & Pages

| Frontend Page | Route | Backend API Endpoint | Method | Purpose |
|---|---|---|---|---|
| Login | `/auth/login` | `POST /auth/login` | POST | Authenticate user |
| Register | `/auth/register` | `POST /auth/register` | POST | Create new account |
| Home/Feed | `/home` | `GET /feed/personalized` | GET | Show pact feed |
| Create Pact | `/pacts/create` | `POST /pacts` | POST | Create new pact |
| Pact Details | `/pacts/{id}` | `GET /pacts/{id}` | GET | Show pact with comments |
| Circles | `/circles` | `GET /circles` | GET | Show user's circles |
| Create Circle | (Modal) | `POST /circles` | POST | Create new circle |
| Circle Detail | `/circles/{id}` | `GET /circles/{id}` | GET | Show circle members |
| Wallet | `/wallet` | `GET /wallet/balance` | GET | Show balance |
| Profile | `/profile` | `GET /users/me` | GET | Show current user |
| Public Profile | `/profile/{username}` | `GET /users/{username}` | GET | Show any user |

---

## Detailed Flow Diagrams

### 1. LOGIN FLOW

```
User
  ↓ Enters email/password on /auth/login page
  ↓ Clicks "Login" button
  ↓
Frontend
  ├─ Calls: POST /auth/login { email, password }
  ├─ Expects: { access_token, user: {...} }
  ├─ Stores token in localStorage
  ├─ Stores user in Zustand store
  └─ Navigates to /home using client-side router
  
Backend
  ├─ Validates email/password
  ├─ Generates JWT token
  ├─ Returns: { access_token, user: {...} }
  └─ NO page redirect! Just return JSON

Result: User sees home feed with real pacts
```

### 2. CREATE PACT FLOW

```
User clicks "+ Create Pact" button on /home
  ↓
Frontend
  ├─ Opens 5-step wizard modal (NOT new page)
  ├─ Step 1: Title, description, category
  ├─ Step 2: Duration, stake amount
  ├─ Step 3: Verification method
  ├─ Step 4: Visibility & circle
  ├─ Step 5: Review & confirm
  ├─ User clicks "Create"
  └─ Sends: POST /pacts with all 5 steps data
  
Backend
  ├─ Validates all fields
  ├─ Creates pact record
  ├─ Locks user's wallet (stakes amount)
  ├─ Returns: { id, title, creator_id, ... }
  └─ NO page redirect! Just return JSON

Frontend
  ├─ Modal closes
  ├─ Refetches feed using React Query
  ├─ New pact appears in feed
  └─ Toast: "Pact created!"

Result: User sees their new pact in the feed
```

### 3. CREATE CIRCLE FLOW

```
User clicks "+ Create Circle" button on /circles
  ↓
Frontend
  ├─ Opens circle creation modal (NOT new page)
  ├─ Form fields:
  │  ├─ Name
  │  ├─ Description
  │  ├─ Privacy (public/private)
  │  └─ Max members
  ├─ User fills form and clicks "Create"
  └─ Sends: POST /circles { name, description, privacy, max_members }
  
Backend
  ├─ Validates circle data
  ├─ Creates circle record
  ├─ Sets creator as admin
  ├─ Returns: { id, name, creator_id, ... }
  └─ NO page redirect! Just return JSON

Frontend
  ├─ Modal closes
  ├─ Refetches circles list
  ├─ New circle appears in list
  └─ Toast: "Circle created!"

Result: Circle appears in user's circle list
```

### 4. VOTE ON PACT FLOW

```
User sees pact card on /home feed
  ↓
User clicks "Believe" or "Doubt" button
  ↓
Frontend
  ├─ Calls: POST /pacts/{id}/votes { vote_type: "believe" }
  ├─ Expects: { vote_type, created_at }
  ├─ Updates local state (optimistic update)
  └─ Shows toast: "Vote recorded!"
  
Backend
  ├─ Validates pact exists
  ├─ Records vote
  ├─ Updates believers_count or doubters_count
  ├─ Recalculates confidence_score
  └─ Returns: { vote_type, ... }

Frontend
  ├─ Updates button styling (shows user voted)
  ├─ Fetches updated pact to get new numbers
  ├─ Pact card updates with new believers/doubters counts

Result: User sees their vote reflected in the UI
```

### 5. UPLOAD PROOF FLOW

```
User on pact detail page (/pacts/{id})
  ↓
User clicks "Upload Proof" button
  ↓
Frontend
  ├─ Shows file upload modal
  ├─ User selects video/image file
  ├─ User adds description
  ├─ Clicks "Upload"
  └─ Sends: POST /pacts/{id}/proofs with FormData
  
Backend
  ├─ Validates file type
  ├─ Stores file (S3, local, etc.)
  ├─ Creates proof record
  ├─ Returns: { id, url, description, ... }
  └─ Updates pact's proof_clips list

Frontend
  ├─ Modal closes
  ├─ New proof appears in proof_clips section
  ├─ Updates pact detail page
  └─ Toast: "Proof uploaded!"

Result: Proof video/image appears in pact details
```

### 6. WALLET DEPOSIT FLOW

```
User on /wallet page
  ↓
User clicks "+ Add Funds" button
  ↓
Frontend
  ├─ Opens deposit modal
  ├─ User enters amount and selects payment method
  ├─ Clicks "Pay Now"
  └─ Sends: POST /wallet/deposit { amount, payment_method }
  
Backend
  ├─ Validates amount
  ├─ Processes payment (or redirects to payment gateway)
  ├─ Updates wallet balance
  ├─ Creates transaction record
  └─ Returns: { transaction_id, new_balance, ... }

Frontend
  ├─ Modal closes
  ├─ Refetches wallet balance
  ├─ Balance updates in real-time
  └─ Toast: "₹{amount} added to wallet!"

Result: User sees new balance on wallet page
```

### 7. FOLLOW USER FLOW

```
User on /profile/{username} page (public profile)
  ↓
User clicks "Follow" button
  ↓
Frontend
  ├─ Calls: POST /users/{id}/follow
  ├─ Expects: { is_following: true }
  ├─ Updates button text to "Following"
  └─ Shows toast: "Following {username}!"
  
Backend
  ├─ Validates user exists
  ├─ Creates follow relationship
  ├─ Returns: { is_following: true }
  └─ Updates followers_count

Frontend
  ├─ Button styling changes
  ├─ User appears in "Following" tab
  ├─ Their pacts appear in feed if already following

Result: User is now following the other user
```

---

## Component-to-API Mapping

### Frontend Components → Backend APIs

```
LoginPage
  ↓ Uses
  useLogin hook
  ↓ Calls
  POST /auth/login

RegisterPage
  ↓ Uses
  useRegister hook
  ↓ Calls
  POST /auth/register

CirclePactApp (Home Feed)
  ↓ Uses
  usePersonalizedFeed hook
  ↓ Calls
  GET /feed/personalized?page=1&limit=10

PactCard
  ├─ Shows data from feed
  └─ Calls on vote:
      POST /pacts/{id}/votes

PactWizardStep5 (Create Pact)
  ↓ Uses
  useCreatePact hook
  ↓ Calls
  POST /pacts { title, description, ... }

CirclesPage
  ↓ Uses
  useCircles hook
  ↓ Calls
  GET /circles

CreateCircleModal
  ↓ Uses
  useCreateCircle hook
  ↓ Calls
  POST /circles

CircleDetailPage
  ├─ Shows members list
  ├─ Shows leaderboard
  └─ Uses
     GET /circles/{id}

WalletPage
  ├─ WalletSummary component
  │  ├─ Shows balance from
  │  └─ GET /wallet/balance
  ├─ DepositModal
  │  └─ Calls
  │     POST /wallet/deposit
  └─ TransactionHistory
     └─ Calls
        GET /wallet/transactions

ProfilePage (Current User)
  ├─ ProfileHero component
  │  ├─ Shows user from
  │  └─ GET /users/me
  ├─ ProfileStats
  │  └─ Shows stats from
  │     GET /users/me
  └─ ProfileTabs
     ├─ Pacts tab
     │  └─ Shows user's pacts
     └─ Followers tab
        └─ Calls
           GET /users/{id}/followers

PublicProfilePage
  ├─ Shows user from
  │  GET /users/{username}
  └─ Follow button calls
     POST /users/{id}/follow
```

---

## Data Flow: Real Example

### Example: User Creates Pact "Ship MVP in 7 days"

**Frontend Timeline:**
```
T1: User opens /pacts/create
    → Page component loads PactWizardProvider

T2: User fills Step 1 (title: "Ship MVP in 7 days")
    → PactWizardContext updates state
    → No API call yet

T3: User fills Steps 2-5
    → All data stored in PactWizardContext
    → No API calls

T4: User clicks "Create" button on Step 5
    → Frontend constructs payload from PactWizardContext
    → Calls: POST /pacts { ... }
    
T5: Backend responds with { id: 42, ... }
    → Frontend stores in React Query cache
    → Modal closes
    → User returns to /home

T6: Home page has usePersonalizedFeed hook
    → React Query refetches GET /feed/personalized
    → New pact (id: 42) appears in feed

T7: User sees their new pact with:
    - Title: "Ship MVP in 7 days"
    - Believers: 0
    - Confidence: 50%
    - Progress: 0%
```

**Backend Timeline:**
```
T4: Receives POST /pacts { title: "Ship MVP...", ... }
    → Validates all required fields
    → Creates pact record in DB
    → Locks user's wallet (stakes amount)
    → Calculates confidence_score (default 50)
    → Returns: { id: 42, title: "...", believers: 0, ... }

T6: Receives GET /feed/personalized?page=1
    → Fetches user's feed
    → Includes newly created pact
    → Returns paginated list
```

---

## Error Scenarios

### Scenario 1: User Tries to Create Pact Without Enough Balance

```
Frontend
  └─ useCreatePact() checks wallet balance
     └─ If balance < stake_amount:
        └─ Shows error toast: "Insufficient balance"
        └─ Disables "Create" button

OR if validation fails on backend:

Backend
  └─ POST /pacts receives request
     └─ Validates wallet has balance
     └─ If not:
        └─ Returns 400 error:
           {
             "status": "error",
             "code": "INSUFFICIENT_BALANCE",
             "message": "You have ₹100 but need ₹500"
           }

Frontend
  └─ Catches error
  └─ Shows toast: "Insufficient balance"
  └─ Modal stays open
```

### Scenario 2: User Creates Circle With Duplicate Name

```
Frontend
  └─ useCreateCircle() sends POST /circles

Backend
  └─ Checks if circle name exists
  └─ Returns 409 Conflict:
     {
       "status": "error",
       "code": "DUPLICATE_NAME",
       "message": "Circle 'Tech Founders' already exists"
     }

Frontend
  └─ Catches error
  └─ Shows toast: "Circle name already taken"
  └─ Modal stays open, user can edit name
```

---

## Response Structure Reference

### Success Response (All Endpoints)
```json
{
  "status": "success",
  "data": {
    "id": 42,
    "title": "Ship MVP in 7 days",
    ...
  },
  "message": "Created successfully"
}
```

### Error Response (All Endpoints)
```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Title is required",
  "details": {
    "field": "title",
    "reason": "required"
  }
}
```

### Paginated Response
```json
{
  "status": "success",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 156,
    "has_next": true,
    "offset": 0
  }
}
```

---

## Testing Checklist

### After Backend Implements Each Endpoint

- [ ] Login works without page redirect
- [ ] Create pact wizard opens as modal (not full page)
- [ ] Create circle opens as modal (not full page)
- [ ] All responses return JSON (not HTML)
- [ ] Pact feed shows real data from API
- [ ] Vote buttons work and update counts
- [ ] Proof upload works
- [ ] Wallet balance updates in real-time
- [ ] User profile shows real stats
- [ ] Follow button works
- [ ] No console errors
- [ ] No CORS errors
- [ ] All API calls visible in DevTools Network tab

---

## Quick Implementation Order for Backend

1. **Auth Endpoints** (2-3 hours)
   - POST /auth/login
   - POST /auth/register

2. **Pact Endpoints** (4-6 hours)
   - POST /pacts
   - GET /pacts/{id}
   - GET /feed/personalized (with pagination)
   - POST /pacts/{id}/votes

3. **Circle Endpoints** (3-4 hours)
   - POST /circles
   - GET /circles
   - GET /circles/{id}

4. **Wallet Endpoints** (2-3 hours)
   - GET /wallet/balance
   - POST /wallet/deposit
   - POST /wallet/withdraw

5. **Profile Endpoints** (2-3 hours)
   - GET /users/me
   - GET /users/{username}
   - POST /users/{id}/follow

6. **Additional Features** (2-3 hours)
   - POST /pacts/{id}/proofs
   - POST /pacts/{id}/comments
   - POST /pacts/{id}/verifications

**Total Time Estimate: 5-7 days for one developer**

---

## Debugging Tips

### "API call not appearing in Network tab"
- Check if token is in Authorization header
- Verify endpoint path is correct (case-sensitive!)
- Check browser console for errors
- Verify CORS is enabled on backend

### "UI not updating after API response"
- Check React Query cache (DevTools)
- Verify response data structure matches expected format
- Add console.log to see what data is coming back
- Check if component is using right hook

### "Modal not closing after create"
- Verify backend response has `status: "success"`
- Check if frontend is handling error correctly
- Verify React Query invalidation is working

---

This document is your mapping guide. Share with your backend team! 🚀

