# CirclePact Backend Endpoints - Complete Requirements

## Overview
This document specifies ALL backend endpoints needed for the CirclePact frontend to function with live data (no dummy data). Organized by feature area with request/response formats, status codes, and implementation notes.

---

## 1. AUTHENTICATION ENDPOINTS (Existing - Confirm Format)

### 1.1 Register
```
POST /api/auth/register

Request:
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username"
}

Response (201):
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "user": {
    "id": 1,
    "user_uuid": "uuid",
    "username": "username",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": null,
    "bio": null,
    "reputation_score": 0,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### 1.2 Login
```
POST /api/auth/login

Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response (200):
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "user": { ...user_object... }
}
```

### 1.3 Get Current User
```
GET /api/auth/me

Response (200):
{
  "id": 1,
  "user_uuid": "uuid",
  "username": "username",
  "email": "user@example.com",
  "full_name": "John Doe",
  "avatar_url": "https://...",
  "bio": "My bio",
  "reputation_score": 150,
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### 1.4 Refresh Token
```
POST /api/auth/refresh

Request:
{
  "refresh_token": "refresh_token"
}

Response (200):
{
  "access_token": "new_jwt_token",
  "refresh_token": "new_refresh_token"
}
```

---

## 2. PACT ENDPOINTS - MODIFIED & NEW

### 2.1 List Pacts (Main Feed) - MODIFIED
```
GET /api/pacts?skip=0&limit=20

Response (200):
{
  "data": [
    {
      "id": 1,
      "pact_uuid": "uuid-string",
      "title": "Run Daily",
      "description": "Running 5km every day",
      "category": "fitness",
      "stake_amount": 100,
      "visibility": "public",
      "status": "active",
      "creator_id": 5,
      "creator_username": "john_doe",
      "creator_avatar_url": "https://...",
      "start_date": "2024-01-01T00:00:00Z",
      "end_date": "2024-02-01T00:00:00Z",
      "duration_days": 30,
      "verification_method": "photo",
      "verification_frequency": "daily",
      "circle_id": 3,
      "circle_name": "Fitness Circle",
      "circle_icon_emoji": "🏃",
      
      // NEW FIELDS - REQUIRED
      "support_count": 42,          // Only this, NOT skip_count
      "recent_supporters": [         // Top 3-5 supporters with avatars
        {
          "id": 1,
          "username": "user1",
          "avatar_url": "https://..."
        },
        {
          "id": 2,
          "username": "user2",
          "avatar_url": "https://..."
        }
      ],
      "is_reported_by_me": false,   // Whether current user reported this pact
      "report_count": 0,            // Total reports (if >= 4, auto-hide)
      
      // MEDIA FIELDS - REQUIRED (Option A: comes in main feed)
      "proof_url": "https://...",   // Latest proof image/video URL
      "proof_type": "photo",        // "photo" | "video" | "checklist"
      "latest_proof_caption": "Day 15 - 5km run",
      "latest_proof_upload_date": "2024-01-15T10:00:00Z",
      
      // LEGACY FIELDS (kept for compatibility)
      "believers": 42,              // DEPRECATED: Use support_count instead
      "doubters": 0,                // DO NOT SEND (hidden from frontend)
      "skip_count": 0               // DO NOT SEND (hidden from frontend)
    }
  ],
  "pagination": {
    "skip": 0,
    "limit": 20,
    "total": 150
  }
}
```

**Why**: Main feed needs media, supporter avatars, report info, and only support_count (skip_count hidden)

---

### 2.2 Get Pact Details
```
GET /api/pacts/{id}

Response (200):
{
  // All fields from 2.1, plus:
  "participants": [
    {
      "id": 1,
      "username": "user1",
      "avatar_url": "https://...",
      "status": "active",
      "joined_date": "2024-01-01T00:00:00Z"
    }
  ],
  "proofs": [
    {
      "id": 1,
      "proof_url": "https://...",
      "proof_type": "photo",
      "caption": "Day 1",
      "day_number": 1,
      "uploaded_at": "2024-01-01T10:00:00Z"
    }
  ],
  "user_vote": "support" | "skip" | null,  // Current user's vote
  "user_has_verified": false
}
```

---

### 2.3 Create Pact
```
POST /api/pacts

Request:
{
  "title": "Run Daily",
  "description": "Running 5km every day",
  "category": "fitness",
  "stake_amount": 100,
  "visibility": "public",
  "duration_days": 30,
  "verification_method": "photo",
  "verification_frequency": "daily",
  "circle_id": 3,  // Optional
  "max_participants": 10,
  "start_date": "2024-01-01T00:00:00Z"
}

Response (201):
{
  "id": 1,
  "pact_uuid": "uuid",
  ...full_pact_object...
}
```

---

### 2.4 Vote on Pact - ENDPOINT RENAMED
```
POST /api/pacts/{id}/vote-support  (NEW - was /vote-believe)
POST /api/pacts/{id}/vote-skip     (NEW - was /vote-doubt)

Request (empty body):
{}

Response (200):
{
  "voted": true,
  "vote_type": "support" | "skip",
  "support_count": 43,        // Updated support count ONLY
  "user_vote": "support" | "skip" | null
}

Status Codes:
- 200: Success
- 401: Not authenticated
- 404: Pact not found
- 409: Already voted (optional - can update vote)
```

**Why**: Renaming from believe/doubt to support/skip for UX redesign. Response shows only support_count, not skip_count.

---

## 3. REPORTING SYSTEM - NEW ENDPOINTS

### 3.1 Report a Pact - NEW
```
POST /api/pacts/{id}/report

Request:
{
  "reason": "fake_or_ai" | "spam" | "offensive"
}

Response (201):
{
  "success": true,
  "report_id": "report_uuid",
  "message": "Pact reported successfully",
  "reported_at": "2024-01-20T15:30:00Z"
}

Status Codes:
- 201: Report created
- 400: Invalid reason or duplicate report
- 401: Not authenticated
- 404: Pact not found

Backend Logic:
- Store report with: pact_id, user_id, reason, timestamp, IP
- DO NOT store anonymously - track which user reported
- When report_count >= 4: auto-hide pact from all feeds
- Send notification to pact creator
```

**Why**: Users can report fake/AI/spam/offensive pacts. Once 4+ reports, pact auto-hides.

---

### 3.2 Get User's Reported Pacts - NEW
```
GET /api/pacts/my-reports?skip=0&limit=20

Response (200):
{
  "data": [
    {
      "id": 1,
      "pact_uuid": "uuid",
      "title": "Fake Pact",
      "creator_username": "spammer",
      "reported_at": "2024-01-20T15:30:00Z",
      "reason": "fake_or_ai",
      "status": "reported"  // or "hidden" if auto-hidden
    }
  ],
  "pagination": {
    "skip": 0,
    "limit": 20,
    "total": 5
  }
}
```

**Why**: Shows pacts current user reported, available in "Reported" tab in swipe feed UI.

---

### 3.3 Get Report Count & Breakdown - NEW
```
GET /api/pacts/{id}/report-count

Response (200):
{
  "total_reports": 5,
  "reasons_breakdown": {
    "fake_or_ai": 3,
    "spam": 1,
    "offensive": 1
  },
  "auto_hidden": false  // true if >= 4 reports
}
```

**Why**: For moderation dashboard & creator awareness (not shown to public).

---

### 3.4 Get Report Logs (Admin/Creator) - NEW
```
GET /api/pacts/{id}/report-logs

Response (200):
[
  {
    "id": 1,
    "report_id": "uuid",
    "pact_id": 1,
    "reported_by_user_id": 5,
    "reported_by_username": "reporter1",
    "reported_by_avatar": "https://...",
    "reason": "fake_or_ai",
    "reported_at": "2024-01-20T15:30:00Z",
    "status": "open"
  }
]

Status Codes:
- 200: Success
- 401: Not authenticated
- 403: Only creator can view (or admin)
- 404: Pact not found
```

**Why**: Pact creator can see who reported and why (for transparency & appeals).

---

## 4. WALLET ENDPOINTS (Existing - Confirm Format)

### 4.1 Get Wallet
```
GET /api/wallet

Response (200):
{
  "id": 1,
  "user_id": 5,
  "balance": 1000.50,
  "locked_balance": 200.00,  // Funds locked in active pacts
  "available_balance": 800.50,
  "total_earned": 5000.00,
  "total_spent": 2500.00,
  "currency": "USD",
  "updated_at": "2024-01-20T15:30:00Z"
}
```

---

### 4.2 Deposit
```
POST /api/wallet/deposit

Request:
{
  "amount": 100.00,
  "payment_method": "card" | "upi" | "bank"
}

Response (201):
{
  "transaction_id": "txn_uuid",
  "status": "pending" | "completed",
  "amount": 100.00,
  "wallet_balance": 1100.50,
  "created_at": "2024-01-20T15:30:00Z"
}
```

---

### 4.3 Withdraw
```
POST /api/wallet/withdraw

Request:
{
  "amount": 100.00
}

Response (201):
{
  "transaction_id": "txn_uuid",
  "status": "pending",
  "amount": 100.00,
  "wallet_balance": 900.50,
  "created_at": "2024-01-20T15:30:00Z"
}
```

---

### 4.4 Get Transactions
```
GET /api/wallet/transactions?skip=0&limit=20

Response (200):
{
  "data": [
    {
      "id": 1,
      "type": "deposit" | "withdraw" | "stake" | "refund" | "earning",
      "amount": 100.00,
      "status": "completed" | "pending" | "failed",
      "description": "Pact stake: Run Daily",
      "related_pact_id": 1,
      "created_at": "2024-01-20T15:30:00Z"
    }
  ],
  "pagination": {
    "skip": 0,
    "limit": 20,
    "total": 50
  }
}
```

---

## 5. CIRCLE ENDPOINTS (Existing - Confirm Format)

### 5.1 List Circles (Public)
```
GET /api/circles/public?skip=0&limit=20

Response (200):
{
  "data": [
    {
      "id": 1,
      "name": "Fitness Circle",
      "description": "For fitness enthusiasts",
      "icon_emoji": "🏃",
      "visibility": "public",
      "member_count": 50,
      "creator_id": 1,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### 5.2 Create Circle
```
POST /api/circles

Request:
{
  "name": "Fitness Circle",
  "description": "For fitness enthusiasts",
  "icon_emoji": "🏃",
  "visibility": "public" | "private"
}

Response (201):
{
  "id": 1,
  "name": "Fitness Circle",
  ...circle_object...
}
```

---

### 5.3 Join Circle
```
POST /api/circles/{id}/join

Response (200):
{
  "success": true,
  "message": "Joined circle successfully"
}
```

---

### 5.4 Get Circle Members
```
GET /api/circles/{id}/members?skip=0&limit=50

Response (200):
{
  "data": [
    {
      "id": 1,
      "username": "user1",
      "avatar_url": "https://...",
      "reputation_score": 150
    }
  ],
  "pagination": { ... }
}
```

---

## 6. USER ENDPOINTS (Existing - Confirm Format)

### 6.1 Get User Profile
```
GET /api/users/{id}

Response (200):
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "avatar_url": "https://...",
  "bio": "Fitness enthusiast",
  "reputation_score": 150,
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 6.2 Get User by Username
```
GET /api/users/by-username/{username}

Response (200):
{
  ...user_object...
}
```

---

### 6.3 Get User Stats
```
GET /api/users/{id}/stats

Response (200):
{
  "pacts_created": 10,
  "pacts_completed": 8,
  "pacts_failed": 2,
  "total_win_rate": 80,
  "current_streak": 5,
  "total_earned": 1000.00,
  "reputation_score": 150,
  "followers_count": 50,
  "following_count": 30
}
```

---

### 6.4 Update User Profile
```
PUT /api/users/{id}

Request:
{
  "full_name": "John Doe",
  "bio": "Updated bio",
  "avatar_url": "https://..."
}

Response (200):
{
  ...updated_user_object...
}
```

---

### 6.5 Upload Avatar
```
POST /api/auth/avatar

Request:
FormData with "file" field

Response (200):
{
  ...user_object_with_new_avatar...
}
```

---

### 6.6 Get User Pacts
```
GET /api/users/{id}/pacts?skip=0&limit=20

Response (200):
{
  "data": [...pact_objects...],
  "pagination": { ... }
}
```

---

### 6.7 Get User's Created Pacts
```
GET /api/pacts/user/{id}/created?skip=0&limit=20

Response (200):
{
  "data": [...pact_objects...],
  "pagination": { ... }
}
```

---

### 6.8 Get User's Joined Pacts
```
GET /api/pacts/user/{id}/joined?skip=0&limit=20

Response (200):
{
  "data": [...pact_objects...],
  "pagination": { ... }
}
```

---

### 6.9 Follow User
```
POST /api/users/{id}/follow

Response (200):
{
  "success": true,
  "is_following": true
}
```

---

### 6.10 Unfollow User
```
DELETE /api/users/{id}/follow

Response (200):
{
  "success": true,
  "is_following": false
}
```

---

### 6.11 Get User Followers
```
GET /api/users/{id}/followers?skip=0&limit=50

Response (200):
{
  "data": [...user_objects...],
  "pagination": { ... }
}
```

---

### 6.12 Get User Following
```
GET /api/users/{id}/following?skip=0&limit=50

Response (200):
{
  "data": [...user_objects...],
  "pagination": { ... }
}
```

---

## 7. PROOF/MEDIA ENDPOINTS (Existing - Confirm Format)

### 7.1 Upload Proof File
```
POST /api/pacts/{id}/upload-proof-file

Request:
FormData with:
- "file": File (photo/video)
- "proof_type": "photo" | "video" | "checklist"
- "caption": optional
- "day_number": optional

Response (201):
{
  "id": 1,
  "proof_url": "https://...",
  "proof_type": "photo",
  "caption": "Day 1 run",
  "day_number": 1,
  "uploaded_at": "2024-01-01T10:00:00Z"
}
```

---

### 7.2 List Proofs for Pact
```
GET /api/pacts/{id}/proofs?limit=20

Response (200):
{
  "data": [
    {
      "id": 1,
      "proof_url": "https://...",
      "proof_type": "photo",
      "caption": "Day 1",
      "day_number": 1,
      "uploaded_at": "2024-01-01T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

## 8. COMMENT & SOCIAL ENDPOINTS (Existing - Confirm Format)

### 8.1 Add Comment
```
POST /api/pacts/{id}/comments

Request:
{
  "text": "Great pact!"
}

Response (201):
{
  "id": 1,
  "pact_id": 1,
  "user_id": 5,
  "username": "commenter",
  "avatar_url": "https://...",
  "text": "Great pact!",
  "created_at": "2024-01-20T15:30:00Z"
}
```

---

### 8.2 Get Comments
```
GET /api/pacts/{id}/comments?skip=0&limit=20

Response (200):
{
  "data": [...comment_objects...],
  "pagination": { ... }
}
```

---

### 8.3 Delete Comment
```
DELETE /api/pacts/{id}/comments/{commentId}

Response (204): No content
```

---

### 8.4 Like Pact
```
POST /api/pacts/{id}/like

Response (200):
{
  "success": true,
  "is_liked": true,
  "like_count": 42
}
```

---

### 8.5 Unlike Pact
```
DELETE /api/pacts/{id}/like

Response (200):
{
  "success": true,
  "is_liked": false,
  "like_count": 41
}
```

---

## 9. VERIFICATION ENDPOINTS (Existing - Confirm Format)

### 9.1 Submit Verification
```
POST /api/verifications/{pactId}

Request:
{
  "answers": ["Yes", "I ran 5km", "Very confident"],
  "confidence_score": 0.9
}

Response (201):
{
  "id": 1,
  "pact_id": 1,
  "user_id": 5,
  "status": "submitted",
  "created_at": "2024-01-20T15:30:00Z"
}
```

---

### 9.2 Get Verifications for Pact
```
GET /api/verifications/{pactId}

Response (200):
{
  "data": [...verification_objects...],
  "pagination": { ... }
}
```

---

## 10. FEED ENDPOINTS (Existing - Confirm Format)

### 10.1 Get Personalized Feed
```
GET /api/feed?skip=0&limit=20&category=trending

Response (200):
{
  "data": [...pact_objects... (using 2.1 format with media & support)],
  "pagination": { ... }
}
```

---

## 11. LEADERBOARD ENDPOINTS (Existing - Confirm Format)

### 11.1 Global Leaderboard
```
GET /api/leaderboards/global?skip=0&limit=50

Response (200):
{
  "data": [
    {
      "rank": 1,
      "user_id": 5,
      "username": "john_doe",
      "avatar_url": "https://...",
      "reputation_score": 500,
      "pacts_completed": 50,
      "win_rate": 95
    }
  ],
  "pagination": { ... }
}
```

---

### 11.2 Circle Leaderboard
```
GET /api/leaderboards/circles/{circleId}?skip=0&limit=50

Response (200):
{
  "data": [...leaderboard_entries...],
  "pagination": { ... }
}
```

---

## CRITICAL NOTES FOR BACKEND IMPLEMENTATION

### 1. **Vote Endpoint Changes**
- Change `/api/pacts/{id}/vote` parameter from `{ "vote": "believe/doubt" }` to separate endpoints:
  - `POST /api/pacts/{id}/vote-support` (was believe)
  - `POST /api/pacts/{id}/vote-skip` (was doubt)
- Response should only include `support_count`, never `skip_count` to frontend

### 2. **Main Feed Response Modification**
- Add `support_count`, `recent_supporters`, `is_reported_by_me`, `report_count`
- Add `proof_url`, `proof_type`, `latest_proof_caption`, `latest_proof_upload_date`
- Remove `doubters` and `skip_count` from feed response (hide completely)
- Keep `believers` for backward compatibility but use `support_count` as primary

### 3. **Reporting System**
- Must track user_id of reporter (not anonymous)
- Auto-hide pacts with >= 4 reports from all feed endpoints
- Send creator notification when pact is reported
- New endpoint: GET `/api/pacts/my-reports` for user's reported pacts

### 4. **Error Handling**
All endpoints should return:
```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "detail": "Optional details"
}
```

### 5. **Pagination Standard**
All list endpoints should return:
```json
{
  "data": [...],
  "pagination": {
    "skip": number,
    "limit": number,
    "total": number
  }
}
```

### 6. **Authentication**
- All endpoints except login/register require `Authorization: Bearer {token}` header
- Return 401 for expired tokens, 403 for forbidden actions

### 7. **Media Storage**
- Return full `https://` URLs in responses (not relative paths)
- Store latest proof info in pact record for quick feed access

---

## IMPLEMENTATION PRIORITY (What to do first)

### Phase 1 (Highest Priority - 2-3 days)
1. Modify vote endpoints: believe/doubt → support/skip
2. Update main feed response format (2.1)
3. Update vote response format
4. Add proof/media fields to pact responses
5. Hide skip_count from frontend

### Phase 2 (Medium Priority - 2-3 days)
6. Implement reporting system (3.1, 3.2, 3.3, 3.4)
7. Auto-hide pacts >= 4 reports from feed
8. Add notification for creators when reported

### Phase 3 (Final - 1-2 days)
9. Verify all other endpoints (wallet, circles, users, etc.) match expected format
10. Test pagination on all list endpoints
11. Error handling consistency

---

## TESTING CHECKLIST

- [ ] Vote on pact with support/skip and get correct support_count back
- [ ] Main feed returns pacts with media, supporters, report count
- [ ] skip_count is NOT in any feed response
- [ ] Report pact and verify it's hidden after 4 reports
- [ ] Get my-reports shows user's reported pacts
- [ ] Creator gets notification when pact reported
- [ ] Report logs show who reported (with user info)
- [ ] All list endpoints support skip/limit pagination
- [ ] Upload proof works and shows in feed
- [ ] Vote response shows updated support_count immediately

---

## NEXT STEPS

1. Implement changes in priority order above
2. Test each endpoint with Postman/curl
3. Confirm response formats match this spec exactly
4. Push backend changes to Render
5. Notify frontend team when ready to integrate

Once confirmed, frontend will integrate all endpoints immediately using these hooks:
- `useBelievePact()` → `useSupportPact()`
- `useDoubtPact()` → `useSkipPact()`
- `useReportPact()` (NEW)
- `useGetMyReportedPacts()` (NEW)
- Updated feed queries with reporting logic
