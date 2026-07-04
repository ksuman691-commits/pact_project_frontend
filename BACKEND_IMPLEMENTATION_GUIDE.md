# CirclePact Backend Implementation Guide
## Complete API & UI/UX Requirements

---

## PART 1: FRONTEND UI/UX OVERVIEW

### Current Frontend Architecture
The frontend is built with **Next.js 16, React Query v5, and Tailwind CSS** with:
- **Phase 1**: Beautiful auth pages (login/register) with CirclePact branding
- **Phase 2**: 60+ API service endpoints configured
- **Phase 3**: Home feed with pact cards, pact details with voting/comments
- **Phase 4**: Wallet system with deposit/withdraw
- **Phase 5**: Circle management system with leaderboard
- **Phase 5B**: 5-step pact creation wizard with money staking
- **Phase 6**: User profiles with achievements and followers
- **Phase 7**: Full backend API integration with real data

### Key UI Pages & Expected Behavior
These are the pages you need to support with backend APIs:

---

## PART 2: CRITICAL UI/UX ISSUES IN CURRENT BACKEND

### Issue #1: Login/Register Should Use Beautiful Modal, Not Full Page URLs
**Current Backend Problem**: Opens as full page redirect
**Frontend Expectation**: Clean modal/dialog overlay on same page

**Solution Required**:
```
Frontend sends: POST /auth/login { email, password }
Backend should return: { access_token, user_id, user_data }
NOT redirect to /dashboard URL, just return token

Frontend handles routing client-side using Next.js router
```

### Issue #2: Create Circle Should Open Modal, Not Full Page
**Current Backend Problem**: Opens complete web URL
**Frontend Expectation**: Small modal window to fill circle info

**Solution Required**:
- Modal opens with form
- User fills: Circle name, description, privacy setting, max members
- Submit calls API endpoint
- Modal closes, circle appears in list
- No page refresh needed

### Issue #3: Create Pact Should Open Wizard in Modal/Dialog
**Current Backend Problem**: Probably opens full page
**Frontend Expectation**: 5-step modal wizard (NOT separate pages)

**Solution Required**:
- Step 1: Basic info (title, description, category)
- Step 2: Duration & stakes
- Step 3: Verification method
- Step 4: Visibility & circle selection
- Step 5: Review & confirm
- Single API call at end: POST /pacts with all data

### Issue #4: All Modals Should Return JSON, Not HTML
**Current Problem**: Backend returns HTML pages
**Frontend Expectation**: All responses are JSON with proper status codes

**Solution Required**:
```json
Success: { "status": "success", "data": {...}, "message": "Created successfully" }
Error: { "status": "error", "message": "...", "code": "VALIDATION_ERROR" }
```

---

## PART 3: DETAILED API ENDPOINT MAPPING

### 1. AUTHENTICATION ENDPOINTS

#### 1.1 Login
**Frontend Call**:
```typescript
POST /auth/login
{
  email: "user@example.com",
  password: "password123"
}
```

**Backend Response** (Success 200):
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "username": "johndoe",
      "avatar_url": "https://...",
      "bio": "Building better habits",
      "reputation_score": 85.5
    }
  },
  "message": "Login successful"
}
```

**Frontend Expectation**:
- Token stored in localStorage as `token`
- User data stored in Zustand store
- Redirects to /home using client-side router (NOT server redirect)
- No page refresh

#### 1.2 Register
**Frontend Call**:
```typescript
POST /auth/register
{
  email: "user@example.com",
  password: "password123",
  full_name: "John Doe",
  username: "johndoe"
}
```

**Backend Response** (Success 201):
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "username": "johndoe"
    }
  },
  "message": "Registration successful"
}
```

---

### 2. PACTS ENDPOINTS

#### 2.1 Create Pact (5-Step Wizard)
**Frontend Call**: (After completing 5-step wizard)
```typescript
POST /pacts
{
  "title": "Ship MVP in 7 days",
  "description": "Build and launch a production-ready MVP",
  "category": "startup",
  "start_date": "2024-01-15T10:00:00Z",
  "end_date": "2024-01-22T10:00:00Z",
  "stake_amount": 500,
  "min_participants": 2,
  "max_participants": 10,
  "verification_type": "video",
  "verification_frequency": "daily",
  "max_proof_uploads": 7,
  "visibility": "circle-specific",
  "circle_id": 1
}
```

**Backend Response** (Success 201):
```json
{
  "status": "success",
  "data": {
    "id": 42,
    "title": "Ship MVP in 7 days",
    "creator_id": 1,
    "creator_name": "Aniket",
    "created_at": "2024-01-15T10:00:00Z",
    "stake_amount": 500,
    "current_participants": 1,
    "believers_count": 0,
    "confidence_score": 50,
    "status": "active"
  },
  "message": "Pact created successfully"
}
```

**Frontend After Response**:
- Modal closes
- User returns to feed
- New pact appears in their pacts list
- Real-time update with React Query

#### 2.2 Get Pact Details
**Frontend Call**:
```typescript
GET /pacts/{id}
```

**Backend Response** (Success 200):
```json
{
  "status": "success",
  "data": {
    "id": 42,
    "title": "Ship MVP in 7 days",
    "description": "Build and launch a production-ready MVP",
    "creator": {
      "id": 1,
      "name": "Aniket",
      "username": "aniket",
      "avatar_url": "https://...",
      "reputation_score": 85.5
    },
    "category": "startup",
    "status": "active",
    "start_date": "2024-01-15T10:00:00Z",
    "end_date": "2024-01-22T10:00:00Z",
    "days_total": 7,
    "days_remaining": 2,
    "progress_percentage": 71,
    "stake_amount": 500,
    "visibility": "circle-specific",
    "circle_id": 1,
    "circle_name": "Tech Founders",
    "verification_type": "video",
    "verification_frequency": "daily",
    "max_proof_uploads": 7,
    "current_participants": 5,
    "believers_count": 78,
    "doubters_count": 22,
    "confidence_score": 78,
    "supporters_pool": 2500,
    "comments_count": 12,
    "proof_clips": [
      {
        "id": 1,
        "day": 1,
        "type": "video",
        "url": "https://...",
        "description": "Started backend setup",
        "uploaded_at": "2024-01-15T14:00:00Z",
        "uploader_name": "Aniket"
      },
      {
        "id": 2,
        "day": 5,
        "type": "image",
        "url": "https://...",
        "description": "API endpoints complete",
        "uploaded_at": "2024-01-19T10:00:00Z",
        "uploader_name": "Aniket"
      }
    ],
    "comments": [
      {
        "id": 1,
        "author": {
          "id": 2,
          "name": "Priya",
          "username": "priya",
          "avatar_url": "https://..."
        },
        "text": "Amazing progress! Keep it up 🔥",
        "created_at": "2024-01-19T15:00:00Z",
        "likes_count": 23
      }
    ],
    "user_vote": "believe",
    "user_can_upload_proof": true,
    "user_has_joined": true
  }
}
```

#### 2.3 Get Personalized Feed (Infinite Scroll)
**Frontend Call**:
```typescript
GET /feed/personalized?page=1&limit=10&offset=0
```

**Backend Response** (Success 200):
```json
{
  "status": "success",
  "data": [
    {
      "id": 42,
      "title": "Ship MVP in 7 days",
      "creator_name": "Aniket",
      "avatar": "🔥",
      "stake_amount": 500,
      "believers": 78,
      "doubters": 22,
      "confidence": 78,
      "progress": 71,
      "days_remaining": "2d 4h",
      "comments_count": 12,
      "proof_clips_count": 2
    },
    {
      "id": 43,
      "title": "Lose 5kg in 60 days",
      "creator_name": "Priya",
      "avatar": "💪",
      "stake_amount": 300,
      "believers": 56,
      "doubters": 8,
      "confidence": 88,
      "progress": 18,
      "days_remaining": "49d 8h",
      "comments_count": 5,
      "proof_clips_count": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 156,
    "has_next": true,
    "offset": 0
  }
}
```

#### 2.4 Vote on Pact (Believe/Doubt)
**Frontend Call**:
```typescript
POST /pacts/{id}/votes
{
  "vote_type": "believe"  // or "doubt"
}
```

**Backend Response** (Success 201):
```json
{
  "status": "success",
  "data": {
    "vote_type": "believe",
    "created_at": "2024-01-19T16:00:00Z"
  },
  "message": "Vote recorded successfully"
}
```

#### 2.5 Upload Proof
**Frontend Call**:
```typescript
POST /pacts/{id}/proofs
{
  "file": File,
  "description": "API endpoints complete",
  "day": 5,
  "type": "video"  // or "image"
}
```

**Backend Response** (Success 201):
```json
{
  "status": "success",
  "data": {
    "id": 2,
    "url": "https://...",
    "description": "API endpoints complete",
    "day": 5,
    "type": "video",
    "uploaded_at": "2024-01-19T10:00:00Z"
  },
  "message": "Proof uploaded successfully"
}
```

#### 2.6 Add Comment
**Frontend Call**:
```typescript
POST /pacts/{id}/comments
{
  "text": "Amazing progress! Keep it up 🔥"
}
```

**Backend Response** (Success 201):
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "author": {
      "id": 2,
      "name": "Priya",
      "username": "priya",
      "avatar_url": "https://..."
    },
    "text": "Amazing progress! Keep it up 🔥",
    "created_at": "2024-01-19T15:00:00Z",
    "likes_count": 0
  },
  "message": "Comment added successfully"
}
```

---

### 3. CIRCLES ENDPOINTS

#### 3.1 Create Circle
**Frontend Call**: (from modal, NOT full page)
```typescript
POST /circles
{
  "name": "Tech Founders",
  "description": "A community for startup founders",
  "privacy": "private",  // or "public"
  "max_members": 50,
  "avatar_url": "https://...",
  "rules": "No spam, be respectful"
}
```

**Backend Response** (Success 201):
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Tech Founders",
    "description": "A community for startup founders",
    "privacy": "private",
    "creator_id": 1,
    "creator_name": "Aniket",
    "max_members": 50,
    "current_members": 1,
    "avatar_url": "https://...",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "message": "Circle created successfully"
}
```

#### 3.2 Get Circles List (User's Circles)
**Frontend Call**:
```typescript
GET /circles?page=1&limit=10
```

**Backend Response** (Success 200):
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Tech Founders",
      "description": "A community for startup founders",
      "privacy": "private",
      "avatar_url": "https://...",
      "members_count": 23,
      "pacts_count": 15,
      "is_member": true,
      "role": "member"  // or "admin", "creator"
    },
    {
      "id": 2,
      "name": "Fitness Enthusiasts",
      "description": "Health and fitness community",
      "privacy": "public",
      "avatar_url": "https://...",
      "members_count": 156,
      "pacts_count": 42,
      "is_member": true,
      "role": "member"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5
  }
}
```

#### 3.3 Get Circle Details
**Frontend Call**:
```typescript
GET /circles/{id}
```

**Backend Response** (Success 200):
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Tech Founders",
    "description": "A community for startup founders",
    "privacy": "private",
    "creator": {
      "id": 1,
      "name": "Aniket",
      "username": "aniket",
      "avatar_url": "https://..."
    },
    "max_members": 50,
    "current_members": 23,
    "avatar_url": "https://...",
    "rules": "No spam, be respectful",
    "created_at": "2024-01-15T10:00:00Z",
    "members": [
      {
        "id": 1,
        "name": "Aniket",
        "username": "aniket",
        "avatar_url": "https://...",
        "reputation_score": 85.5,
        "pacts_completed": 12,
        "role": "creator"
      },
      {
        "id": 2,
        "name": "Priya",
        "username": "priya",
        "avatar_url": "https://...",
        "reputation_score": 72.3,
        "pacts_completed": 8,
        "role": "member"
      }
    ],
    "leaderboard": [
      {
        "rank": 1,
        "user_name": "Aniket",
        "pacts_completed": 12,
        "win_rate": 92,
        "reputation": 85.5
      },
      {
        "rank": 2,
        "user_name": "Priya",
        "pacts_completed": 8,
        "win_rate": 87,
        "reputation": 72.3
      }
    ]
  }
}
```

#### 3.4 Join Circle
**Frontend Call**:
```typescript
POST /circles/{id}/join
```

**Backend Response** (Success 200):
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "joined_at": "2024-01-15T10:00:00Z"
  },
  "message": "Successfully joined circle"
}
```

---

### 4. WALLET ENDPOINTS

#### 4.1 Get Wallet Balance
**Frontend Call**:
```typescript
GET /wallet/balance
```

**Backend Response** (Success 200):
```json
{
  "status": "success",
  "data": {
    "balance": 5000,
    "locked": 1500,
    "rewards_earned": 2300,
    "total_stakes": 1500,
    "currency": "INR"
  }
}
```

#### 4.2 Deposit Funds
**Frontend Call**:
```typescript
POST /wallet/deposit
{
  "amount": 1000,
  "payment_method": "card",  // or "upi", "bank"
  "currency": "INR"
}
```

**Backend Response** (Success 201):
```json
{
  "status": "success",
  "data": {
    "transaction_id": "txn_12345",
    "amount": 1000,
    "status": "success",
    "new_balance": 6000,
    "created_at": "2024-01-15T10:00:00Z"
  },
  "message": "Deposit successful"
}
```

#### 4.3 Withdraw Funds
**Frontend Call**:
```typescript
POST /wallet/withdraw
{
  "amount": 1000,
  "bank_account_id": 1,
  "currency": "INR"
}
```

**Backend Response** (Success 201):
```json
{
  "status": "success",
  "data": {
    "transaction_id": "txn_12346",
    "amount": 1000,
    "status": "processing",
    "new_balance": 5000,
    "created_at": "2024-01-15T10:00:00Z"
  },
  "message": "Withdrawal initiated"
}
```

#### 4.4 Get Transaction History
**Frontend Call**:
```typescript
GET /wallet/transactions?page=1&limit=10&type=all
```

**Backend Response** (Success 200):
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "type": "deposit",
      "amount": 1000,
      "status": "success",
      "description": "Credit card deposit",
      "created_at": "2024-01-15T10:00:00Z",
      "balance_after": 6000
    },
    {
      "id": 2,
      "type": "stake",
      "amount": 500,
      "status": "locked",
      "description": "Pact: Ship MVP in 7 days",
      "created_at": "2024-01-15T11:00:00Z",
      "balance_after": 5500
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```

---

### 5. USER PROFILE ENDPOINTS

#### 5.1 Get Current User Profile
**Frontend Call**:
```typescript
GET /users/me
```

**Backend Response** (Success 200):
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "username": "johndoe",
    "bio": "Building better habits",
    "avatar_url": "https://...",
    "reputation_score": 85.5,
    "created_at": "2024-01-01T10:00:00Z",
    "stats": {
      "pacts_created": 12,
      "pacts_completed": 11,
      "win_rate": 92,
      "current_streak": 14,
      "total_earned": 5000,
      "followers_count": 45,
      "following_count": 32
    }
  }
}
```

#### 5.2 Get Public User Profile by Username
**Frontend Call**:
```typescript
GET /users/{username}
```

**Backend Response** (Success 200):
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "full_name": "John Doe",
    "username": "johndoe",
    "bio": "Building better habits",
    "avatar_url": "https://...",
    "reputation_score": 85.5,
    "created_at": "2024-01-01T10:00:00Z",
    "is_following": false,
    "followers_count": 45,
    "following_count": 32,
    "stats": {
      "pacts_created": 12,
      "pacts_completed": 11,
      "win_rate": 92,
      "current_streak": 14,
      "total_earned": 5000
    },
    "recent_pacts": [
      {
        "id": 42,
        "title": "Ship MVP in 7 days",
        "status": "completed",
        "completion_date": "2024-01-22T10:00:00Z"
      }
    ]
  }
}
```

#### 5.3 Update User Profile
**Frontend Call**:
```typescript
PUT /users/me
{
  "full_name": "John Doe",
  "bio": "Building better habits",
  "avatar_url": "https://..."
}
```

**Backend Response** (Success 200):
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "full_name": "John Doe",
    "bio": "Building better habits",
    "avatar_url": "https://...",
    "updated_at": "2024-01-15T10:00:00Z"
  },
  "message": "Profile updated successfully"
}
```

#### 5.4 Follow User
**Frontend Call**:
```typescript
POST /users/{id}/follow
```

**Backend Response** (Success 200):
```json
{
  "status": "success",
  "data": {
    "is_following": true,
    "created_at": "2024-01-15T10:00:00Z"
  },
  "message": "Successfully followed user"
}
```

#### 5.5 Get User's Followers
**Frontend Call**:
```typescript
GET /users/{id}/followers?page=1&limit=20
```

**Backend Response** (Success 200):
```json
{
  "status": "success",
  "data": [
    {
      "id": 2,
      "full_name": "Priya",
      "username": "priya",
      "avatar_url": "https://...",
      "reputation_score": 72.3,
      "is_following": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

---

### 6. VERIFICATION ENDPOINTS

#### 6.1 Submit Verification Vote (4-Point System)
**Frontend Call**:
```typescript
POST /pacts/{id}/verifications
{
  "vote_type": "believe",  // or "doubt"
  "confidence_level": 85,  // 0-100
  "answer_1": "Yes",       // Answer to question 1
  "answer_2": "No",        // Answer to question 2
  "answer_3": "Yes",       // Answer to question 3
  "answer_4": "Maybe"      // Answer to question 4
}
```

**Backend Response** (Success 201):
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "pact_id": 42,
    "verifier_id": 2,
    "vote_type": "believe",
    "confidence_level": 85,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_confidence": 82
  },
  "message": "Verification submitted successfully"
}
```

---

## PART 4: DATABASE SCHEMA REQUIREMENTS

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  username VARCHAR(100) UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  reputation_score DECIMAL(10, 2) DEFAULT 0,
  current_streak INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Pacts Table
```sql
CREATE TABLE pacts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  creator_id INT NOT NULL REFERENCES users(id),
  category VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  stake_amount DECIMAL(10, 2),
  min_participants INT,
  max_participants INT,
  verification_type VARCHAR(50),
  verification_frequency VARCHAR(50),
  max_proof_uploads INT,
  visibility VARCHAR(20),
  circle_id INT REFERENCES circles(id),
  believers_count INT DEFAULT 0,
  doubters_count INT DEFAULT 0,
  confidence_score DECIMAL(10, 2) DEFAULT 50,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Circles Table
```sql
CREATE TABLE circles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  creator_id INT NOT NULL REFERENCES users(id),
  privacy VARCHAR(20),
  avatar_url TEXT,
  max_members INT,
  rules TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Wallet Table
```sql
CREATE TABLE wallets (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(id),
  balance DECIMAL(10, 2) DEFAULT 0,
  locked_amount DECIMAL(10, 2) DEFAULT 0,
  rewards_earned DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Proof Uploads Table
```sql
CREATE TABLE proofs (
  id SERIAL PRIMARY KEY,
  pact_id INT NOT NULL REFERENCES pacts(id),
  uploader_id INT NOT NULL REFERENCES users(id),
  url TEXT NOT NULL,
  description TEXT,
  day INT,
  type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## PART 5: IMPLEMENTATION CHECKLIST

### Phase 1: Authentication (Day 1)
- [ ] POST /auth/login returns token + user data (no redirect)
- [ ] POST /auth/register works same way
- [ ] Token stored in localStorage
- [ ] API intercepts add Authorization header
- [ ] 401 errors refresh token
- [ ] Beautiful login/register pages display correctly

### Phase 2: Pacts (Day 2-3)
- [ ] POST /pacts creates pact from wizard data
- [ ] GET /pacts/{id} returns full pact details
- [ ] GET /feed/personalized returns paginated feed
- [ ] POST /pacts/{id}/votes works (believe/doubt)
- [ ] POST /pacts/{id}/proofs uploads files
- [ ] POST /pacts/{id}/comments adds comments

### Phase 3: Circles (Day 3-4)
- [ ] POST /circles creates circle (from modal, not full page)
- [ ] GET /circles returns user's circles
- [ ] GET /circles/{id} returns full details
- [ ] POST /circles/{id}/join works
- [ ] Leaderboard shows in circle detail

### Phase 4: Wallet (Day 4)
- [ ] GET /wallet/balance returns real balance
- [ ] POST /wallet/deposit works
- [ ] POST /wallet/withdraw works
- [ ] GET /wallet/transactions paginated

### Phase 5: Profiles (Day 5)
- [ ] GET /users/me returns current user
- [ ] GET /users/{username} returns public profile
- [ ] PUT /users/me updates profile
- [ ] POST /users/{id}/follow works
- [ ] GET /users/{id}/followers paginated

### Phase 6: Verification (Day 5-6)
- [ ] POST /pacts/{id}/verifications submits 4-point vote
- [ ] Confidence score updates across app

---

## PART 6: KEY ARCHITECTURAL DECISIONS

### Decision #1: No Full-Page Redirects for Modal Features
**Requirement**: Create Circle, Create Pact, etc. should be modals
**Implementation**: All return JSON, frontend handles routing

### Decision #2: All Responses Must Be JSON
**Requirement**: Never return HTML from API
**Implementation**: Always return `{ status, data, message }`

### Decision #3: Pagination for All Lists
**Requirement**: Infinite scroll on feed, circles, followers, etc.
**Implementation**: Always include `pagination` object with `page, limit, total, has_next`

### Decision #4: Token-Based Auth with Bearer Scheme
**Requirement**: JWT tokens in Authorization header
**Implementation**: `Authorization: Bearer {token}`

---

## PART 7: ERROR HANDLING

### All errors must follow this format:
```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "details": {}
}
```

### Error Codes:
- `VALIDATION_ERROR`: 400 - Bad request
- `UNAUTHORIZED`: 401 - Not authenticated
- `FORBIDDEN`: 403 - No permission
- `NOT_FOUND`: 404 - Resource not found
- `CONFLICT`: 409 - Already exists
- `INTERNAL_ERROR`: 500 - Server error

---

## PART 8: TESTING THE INTEGRATION

### Test Workflow:
1. Open DevTools → Network tab
2. Filter by XHR
3. Perform action (login, create pact, etc.)
4. Look for API call in Network tab
5. Click request → Response tab
6. Verify response structure matches documentation
7. Verify UI updates with real data
8. Refresh page → verify data persists

### Example Test:
```
1. Go to /home
2. Click "New Pact" → 5-step wizard opens
3. Fill all 5 steps
4. Click "Create" → POST /pacts call appears in Network
5. Response should have `data.id` and `message`
6. Modal closes
7. Refresh page → new pact appears in feed
8. Success!
```

---

## PART 9: MIGRATION PATH

### If You Have Existing Backend:
1. Add JSON response wrapper to all endpoints
2. Remove full-page redirects for modal features
3. Add pagination to all list endpoints
4. Implement 4-point verification system
5. Add token auth instead of session auth
6. Deploy behind CORS proxy if needed

### If Building from Scratch:
1. Create database schema (see Part 4)
2. Implement endpoints in order:
   - Auth (login, register)
   - Pacts (CRUD)
   - Feed (with pagination)
   - Circles (CRUD)
   - Wallet
   - Profiles
   - Verification
3. Test each endpoint with Postman
4. Connect to frontend

---

## PART 10: NEXT STEPS

1. **Share This Document** with backend team
2. **Create Issues** for each endpoint
3. **Set Timeline**: 5-7 days to implement all endpoints
4. **Test Daily**: Use Network tab to verify each endpoint
5. **Iterate**: Fix issues as they come up

---

**Questions?** Check the schema, data types, and response formats above. Frontend is ready to consume these APIs.

