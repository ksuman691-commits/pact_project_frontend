# CirclePact - Complete Backend System Design

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [File Storage Strategy](#file-storage-strategy)
6. [Notification System](#notification-system)
7. [Common Friends & Circle Recommendations](#common-friends--circle-recommendations)
8. [Authentication & Security](#authentication--security)
9. [Real-time Features](#real-time-features)
10. [Data Models & Relationships](#data-models--relationships)

---

## System Overview

CirclePact is a **social accountability network** where:
- Users create **financial commitments (Pacts)** with real money stakes
- **Circles** are groups of friends who verify each other's pacts
- Each user profile acts like a **personal circle/mini-community**
- Friends send **circle join requests** to become part of each other's accountability groups
- Social features (believes, doubts, comments, shares) drive engagement
- Money is locked, released, or earned based on pact completion verification

### Key Concepts
- **Pact**: A commitment with stake money, duration, verification method
- **Circle**: A group of users with shared pacts and verification responsibilities
- **Verification**: 4-point voting system (Believe/Doubt) by circle members
- **Profile**: User's personal circle showing stats, achievements, followers
- **Proof**: Evidence submitted by user to complete daily pact requirements

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Web App)                         │
│  React 19 + Next.js 16 + TypeScript + Tailwind CSS              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway / Load Balancer                   │
│              (Rate Limiting, Auth Middleware, Logging)           │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Auth        │    │  Core        │    │  Social      │
│  Service     │    │  Service     │    │  Service     │
└──────────────┘    └──────────────┘    └──────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  PostgreSQL DB   │  │  File Storage    │  │  Cache (Redis)   │
│  (Primary Data)  │  │  (S3/Blob)       │  │  (Sessions, etc) │
└──────────────────┘  └──────────────────┘  └──────────────────┘
        │
        ▼
┌──────────────────┐
│  Message Queue   │
│  (Notifications) │
└──────────────────┘
```

### Tech Stack (Recommended)
- **Backend**: Node.js + Express or NestJS (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **File Storage**: AWS S3, Azure Blob Storage, or Vercel Blob
- **Cache**: Redis
- **Message Queue**: Bull/BullMQ (for notifications)
- **Authentication**: JWT + Better Auth
- **Real-time**: WebSockets (Socket.io) or Server-Sent Events (SSE)

---

## Database Schema

### Core Tables

#### 1. **users** - User profiles and account information
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  bio TEXT,
  avatar_url VARCHAR(500),
  
  -- Reputation & Achievements
  reputation_score INTEGER DEFAULT 0,
  total_pacts_created INTEGER DEFAULT 0,
  total_pacts_completed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_earned DECIMAL(15,2) DEFAULT 0,
  total_staked DECIMAL(15,2) DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indices
  INDEX(email),
  INDEX(username),
  INDEX(created_at)
);
```

#### 2. **circles** - Groups/communities
```sql
CREATE TABLE circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  
  -- Settings
  is_public BOOLEAN DEFAULT true,
  require_approval BOOLEAN DEFAULT false,
  max_members INTEGER,
  
  -- Stats
  member_count INTEGER DEFAULT 1,
  total_pacts INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  
  -- Meta
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX(creator_id),
  INDEX(is_public),
  INDEX(created_at)
);
```

#### 3. **circle_members** - Circle membership
```sql
CREATE TABLE circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Role
  role ENUM('admin', 'moderator', 'member') DEFAULT 'member',
  
  -- Status
  status ENUM('active', 'invited', 'removed') DEFAULT 'active',
  joined_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(circle_id, user_id),
  INDEX(circle_id),
  INDEX(user_id),
  INDEX(status)
);
```

#### 4. **follow** - User following relationships (for "common friends")
```sql
CREATE TABLE follow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Stats
  is_mutual BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(follower_id, following_id),
  INDEX(follower_id),
  INDEX(following_id),
  INDEX(is_mutual)
);
```

#### 5. **pacts** - Financial commitments
```sql
CREATE TABLE pacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  circle_id UUID REFERENCES circles(id) ON DELETE SET NULL,
  
  -- Content
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- fitness, finance, health, learning, etc.
  
  -- Financial
  stake_amount DECIMAL(15,2) NOT NULL,
  min_participants INTEGER DEFAULT 1,
  max_participants INTEGER,
  
  -- Duration & Timing
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  duration_days INTEGER GENERATED ALWAYS AS (EXTRACT(DAY FROM end_date - start_date)) STORED,
  
  -- Verification
  verification_method ENUM('photo', 'video', 'checklist', 'manual') NOT NULL,
  verification_frequency ENUM('daily', 'weekly', 'on-demand') NOT NULL,
  required_proofs_per_period INTEGER DEFAULT 1,
  
  -- Visibility
  visibility ENUM('public', 'private', 'circle-only') DEFAULT 'public',
  
  -- Status
  status ENUM('active', 'completed', 'failed', 'cancelled') DEFAULT 'active',
  
  -- Stats
  total_participants INTEGER DEFAULT 0,
  total_verified INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  INDEX(creator_id),
  INDEX(circle_id),
  INDEX(status),
  INDEX(category),
  INDEX(created_at)
);
```

#### 6. **pact_participants** - Users participating in a pact
```sql
CREATE TABLE pact_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pact_id UUID NOT NULL REFERENCES pacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Financial
  staked_amount DECIMAL(15,2) NOT NULL,
  earned_amount DECIMAL(15,2) DEFAULT 0,
  
  -- Status
  status ENUM('active', 'completed', 'failed', 'withdrawn') DEFAULT 'active',
  
  -- Daily tracking
  current_day INTEGER DEFAULT 1,
  total_days_completed INTEGER DEFAULT 0,
  
  -- Timestamps
  joined_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  UNIQUE(pact_id, user_id),
  INDEX(pact_id),
  INDEX(user_id),
  INDEX(status)
);
```

#### 7. **proofs** - Evidence submissions for pact completion
```sql
CREATE TABLE proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pact_id UUID NOT NULL REFERENCES pacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  content_type ENUM('photo', 'video', 'text', 'checklist') NOT NULL,
  content_url VARCHAR(500),
  description TEXT,
  
  -- Verification
  verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  verified_at TIMESTAMP,
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- Stats
  verification_count INTEGER DEFAULT 0,
  believe_count INTEGER DEFAULT 0,
  doubt_count INTEGER DEFAULT 0,
  
  day_number INTEGER NOT NULL,
  submitted_at TIMESTAMP DEFAULT NOW(),
  
  INDEX(pact_id),
  INDEX(user_id),
  INDEX(verification_status),
  INDEX(submitted_at)
);
```

#### 8. **verifications** - 4-point verification votes
```sql
CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proof_id UUID NOT NULL REFERENCES proofs(id) ON DELETE CASCADE,
  pact_id UUID NOT NULL REFERENCES pacts(id) ON DELETE CASCADE,
  verifier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Vote
  vote ENUM('believe', 'doubt') NOT NULL,
  
  -- Response - 4-point verification
  confidence_level INTEGER (1-4), -- How confident are they
  comment TEXT,
  
  -- Stats
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(proof_id, verifier_id),
  INDEX(pact_id),
  INDEX(verifier_id),
  INDEX(vote),
  INDEX(created_at)
);
```

#### 9. **wallet** - User financial accounts
```sql
CREATE TABLE wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Balance
  available_balance DECIMAL(15,2) DEFAULT 0,
  locked_balance DECIMAL(15,2) DEFAULT 0,
  rewards_balance DECIMAL(15,2) DEFAULT 0,
  
  -- Transactions summary
  total_deposited DECIMAL(15,2) DEFAULT 0,
  total_withdrawn DECIMAL(15,2) DEFAULT 0,
  total_earned DECIMAL(15,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX(user_id)
);
```

#### 10. **transactions** - Financial transaction history
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallet(id) ON DELETE CASCADE,
  
  -- Transaction details
  type ENUM('deposit', 'withdrawal', 'stake', 'earn', 'refund', 'forfeit') NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  description TEXT,
  
  -- References
  pact_id UUID REFERENCES pacts(id) ON DELETE SET NULL,
  payment_method VARCHAR(50), -- 'card', 'upi', 'bank', etc.
  
  -- Status
  status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  INDEX(user_id),
  INDEX(type),
  INDEX(status),
  INDEX(created_at)
);
```

#### 11. **comments** - Social comments on pacts/proofs
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pact_id UUID REFERENCES pacts(id) ON DELETE CASCADE,
  proof_id UUID REFERENCES proofs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  
  -- Content
  content TEXT NOT NULL,
  
  -- Stats
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX(pact_id),
  INDEX(proof_id),
  INDEX(user_id),
  INDEX(parent_comment_id),
  INDEX(created_at)
);
```

#### 12. **notifications** - User notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification details
  type ENUM(
    'pact_invitation',
    'verification_requested',
    'proof_verified',
    'proof_rejected',
    'circle_invite',
    'follow_request',
    'comment_mention',
    'pact_started',
    'pact_ending_soon',
    'reward_earned',
    'pact_failed',
    'custom'
  ) NOT NULL,
  
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- References
  from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  pact_id UUID REFERENCES pacts(id) ON DELETE SET NULL,
  proof_id UUID REFERENCES proofs(id) ON DELETE SET NULL,
  circle_id UUID REFERENCES circles(id) ON DELETE SET NULL,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  
  action_url VARCHAR(500),
  
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  
  INDEX(user_id),
  INDEX(type),
  INDEX(is_read),
  INDEX(created_at)
);
```

#### 13. **badges/achievements** - User achievements
```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  badge_type VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url VARCHAR(500),
  
  -- Rarity
  rarity ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
  
  -- Progress
  progress INTEGER DEFAULT 0,
  progress_max INTEGER,
  is_unlocked BOOLEAN DEFAULT false,
  
  unlocked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX(user_id),
  INDEX(badge_type)
);
```

#### 14. **common_friends** - Cached table for common friends (for performance)
```sql
CREATE TABLE common_friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Mutual connections
  mutual_friends_count INTEGER,
  mutual_circles_count INTEGER,
  
  -- Cached at
  cached_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_a_id, user_b_id),
  INDEX(user_a_id),
  INDEX(user_b_id)
);
```

#### 15. **circle_join_requests** - Requests to join circles
```sql
CREATE TABLE circle_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  request_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  
  UNIQUE(circle_id, user_id),
  INDEX(circle_id),
  INDEX(user_id),
  INDEX(status)
);
```

---

## API Endpoints

### Authentication Endpoints
```
POST /api/auth/register
- Create new user account
- Body: { email, password, full_name }
- Returns: { user, token }

POST /api/auth/login
- Authenticate user
- Body: { email, password }
- Returns: { user, token, refreshToken }

POST /api/auth/refresh
- Refresh authentication token
- Body: { refreshToken }
- Returns: { token }

POST /api/auth/logout
- Logout user
- Returns: { success: true }

GET /api/auth/verify
- Verify current session
- Returns: { user }
```

### User Profile Endpoints
```
GET /api/users/:userId
- Get user profile by ID
- Returns: { user, stats, achievements, followers, following }

GET /api/users/username/:username
- Get user profile by username
- Returns: { user, stats, achievements }

PUT /api/users/:userId
- Update user profile
- Body: { full_name, bio, avatar_url }
- Returns: { user }

GET /api/users/:userId/stats
- Get user statistics
- Returns: { pacts_created, pacts_completed, win_rate, streak, earned, etc. }

GET /api/users/:userId/achievements
- Get user badges and achievements
- Returns: { badges: [{}, ...], unlocked_count }

GET /api/users/:userId/followers
- Get list of followers (with pagination)
- Query: page, limit
- Returns: { followers: [{}], total, hasMore }

GET /api/users/:userId/following
- Get list of people user follows
- Query: page, limit
- Returns: { following: [{}], total, hasMore }

POST /api/users/:userId/follow
- Follow a user
- Returns: { success: true, mutual: boolean }

DELETE /api/users/:userId/follow
- Unfollow a user
- Returns: { success: true }

GET /api/users/:userId/common-friends/:otherUserId
- Get mutual friends between two users
- Returns: { mutual_friends: [{}], count }
```

### Wallet Endpoints
```
GET /api/wallet
- Get user wallet information
- Returns: { wallet: { available_balance, locked_balance, rewards_balance } }

GET /api/wallet/balance
- Get current balance
- Returns: { available, locked, rewards, total }

POST /api/wallet/deposit
- Add funds to wallet
- Body: { amount, payment_method }
- Returns: { transaction }

POST /api/wallet/withdraw
- Withdraw funds
- Body: { amount, bank_details }
- Returns: { transaction }

GET /api/wallet/transactions
- Get transaction history
- Query: page, limit, type (deposit/withdrawal/stake/earn)
- Returns: { transactions: [{}], total }

GET /api/wallet/transactions/:id
- Get transaction details
- Returns: { transaction }
```

### Pact Endpoints
```
POST /api/pacts
- Create new pact
- Body: {
    title, description, category, stake_amount,
    start_date, end_date, verification_method,
    verification_frequency, visibility, circle_id
  }
- Returns: { pact }

GET /api/pacts/:id
- Get pact details
- Returns: {
    pact,
    participants: [{}],
    proofs: [{}],
    comments: [{}],
    verifications: [{}],
    stats: { belief_count, doubt_count, etc. }
  }

GET /api/pacts
- List pacts (with filters)
- Query: page, limit, category, visibility, status, circle_id
- Returns: { pacts: [{}], total, hasMore }

GET /api/pacts/trending
- Get trending pacts
- Query: page, limit, timeframe (week/month)
- Returns: { pacts: [{}], total }

PUT /api/pacts/:id
- Update pact (creator only)
- Body: { title, description, category, ... }
- Returns: { pact }

POST /api/pacts/:id/join
- Join a pact
- Body: { stake_amount }
- Returns: { participant }

DELETE /api/pacts/:id/leave
- Leave a pact
- Returns: { success: true }

POST /api/pacts/:id/complete
- Mark pact as completed
- Body: { final_status }
- Returns: { pact }

GET /api/pacts/:id/feed
- Get activity feed for pact
- Query: page, limit
- Returns: { activities: [{}], total }

GET /api/pacts/category/:category
- Get pacts by category
- Query: page, limit
- Returns: { pacts: [{}], total }

GET /api/pacts/search
- Search pacts
- Query: q, page, limit
- Returns: { pacts: [{}], total }
```

### Proof/Evidence Endpoints
```
POST /api/proofs
- Submit proof for pact
- Body: {
    pact_id, content_type, content_url, description, day_number
  }
- Returns: { proof }

GET /api/proofs/:id
- Get proof details
- Returns: {
    proof,
    verifications: [{}],
    comments: [{}],
    stats: { believe_count, doubt_count }
  }

GET /api/pacts/:pactId/proofs
- Get all proofs for a pact
- Query: page, limit, day_number, user_id
- Returns: { proofs: [{}], total }

GET /api/proofs/pending
- Get proofs pending verification
- Query: page, limit, pact_id
- Returns: { proofs: [{}], total }

DELETE /api/proofs/:id
- Delete proof submission
- Returns: { success: true }
```

### Verification Endpoints
```
POST /api/verifications
- Submit verification vote (believe/doubt)
- Body: { proof_id, vote, confidence_level, comment }
- Returns: { verification }

GET /api/proofs/:proofId/verifications
- Get all verifications for a proof
- Query: page, limit
- Returns: { verifications: [{}], stats: { believe, doubt, total } }

GET /api/verifications/pending
- Get pending verifications for current user
- Query: page, limit
- Returns: { verifications: [{}], total }

PUT /api/verifications/:id
- Update verification (change vote)
- Body: { vote, comment }
- Returns: { verification }

DELETE /api/verifications/:id
- Remove verification
- Returns: { success: true }
```

### Comment Endpoints
```
POST /api/comments
- Add comment to pact or proof
- Body: { pact_id, proof_id, content, parent_comment_id }
- Returns: { comment }

GET /api/pacts/:pactId/comments
- Get comments on pact
- Query: page, limit, sort
- Returns: { comments: [{}], total }

GET /api/proofs/:proofId/comments
- Get comments on proof
- Query: page, limit
- Returns: { comments: [{}], total }

PUT /api/comments/:id
- Update comment
- Body: { content }
- Returns: { comment }

DELETE /api/comments/:id
- Delete comment
- Returns: { success: true }

POST /api/comments/:id/like
- Like a comment
- Returns: { like_count }

DELETE /api/comments/:id/like
- Unlike a comment
- Returns: { like_count }
```

### Circle Endpoints
```
POST /api/circles
- Create new circle
- Body: { name, description, is_public, max_members, logo_url }
- Returns: { circle }

GET /api/circles/:id
- Get circle details
- Returns: {
    circle,
    members: [{}],
    pacts: [{}],
    leaderboard: [{}],
    stats: { total_members, total_pacts, etc. }
  }

GET /api/circles
- List circles
- Query: page, limit, search, is_public, sort
- Returns: { circles: [{}], total, hasMore }

GET /api/circles/my
- Get user's circles
- Query: page, limit
- Returns: { circles: [{}], total }

GET /api/circles/trending
- Get trending circles
- Query: page, limit
- Returns: { circles: [{}], total }

PUT /api/circles/:id
- Update circle (admin only)
- Body: { name, description, is_public, max_members }
- Returns: { circle }

DELETE /api/circles/:id
- Delete circle (creator only)
- Returns: { success: true }

POST /api/circles/:id/join
- Request to join circle
- Body: { message }
- Returns: { request }

DELETE /api/circles/:id/join
- Cancel join request
- Returns: { success: true }

GET /api/circles/:id/members
- Get circle members
- Query: page, limit, role
- Returns: { members: [{}], total }

POST /api/circles/:id/members/:userId
- Add member to circle (admin, if approval required)
- Returns: { member }

DELETE /api/circles/:id/members/:userId
- Remove member from circle (admin only)
- Returns: { success: true }

GET /api/circles/:id/leaderboard
- Get circle leaderboard
- Query: sort_by (earnings, streak, win_rate), page, limit
- Returns: { leaderboard: [{}], total }

GET /api/circles/:id/pacts
- Get pacts in circle
- Query: page, limit, status
- Returns: { pacts: [{}], total }

GET /api/circles/:id/requests
- Get join requests (admin only)
- Query: page, limit
- Returns: { requests: [{}], total }

POST /api/circles/:id/requests/:requestId/approve
- Approve join request (admin only)
- Returns: { member }

DELETE /api/circles/:id/requests/:requestId/reject
- Reject join request (admin only)
- Returns: { success: true }
```

### Notification Endpoints
```
GET /api/notifications
- Get user notifications
- Query: page, limit, is_read, type
- Returns: { notifications: [{}], total, unread_count }

GET /api/notifications/count
- Get unread notification count
- Returns: { unread_count }

PUT /api/notifications/:id
- Mark notification as read
- Returns: { notification }

PUT /api/notifications/read-all
- Mark all notifications as read
- Returns: { success: true }

DELETE /api/notifications/:id
- Delete notification
- Returns: { success: true }

DELETE /api/notifications/archive-all
- Archive all old notifications
- Returns: { archived_count }

POST /api/notifications/settings
- Update notification preferences
- Body: { types: { pact_invitation: true, ... } }
- Returns: { settings }

GET /api/notifications/settings
- Get notification preferences
- Returns: { settings }
```

### Activity Feed Endpoints
```
GET /api/feed
- Get personalized activity feed
- Query: page, limit, filter (following, circles, all)
- Returns: { activities: [{}], total, hasMore }

GET /api/feed/trending
- Get trending activities
- Query: page, limit, timeframe
- Returns: { activities: [{}], total }

GET /api/users/:userId/activity
- Get user's activity (public)
- Query: page, limit
- Returns: { activities: [{}], total }
```

### Search Endpoints
```
GET /api/search
- Global search
- Query: q, type (users, pacts, circles), page, limit
- Returns: { users: [{}], pacts: [{}], circles: [{}] }

GET /api/search/users
- Search users
- Query: q, page, limit
- Returns: { users: [{}], total }

GET /api/search/pacts
- Search pacts
- Query: q, category, page, limit
- Returns: { pacts: [{}], total }

GET /api/search/circles
- Search circles
- Query: q, page, limit
- Returns: { circles: [{}], total }
```

---

## File Storage Strategy

### Storage Types and Locations

#### 1. **Profile Avatars**
- **Location**: `/avatars/users/{user_id}/{filename}`
- **Format**: JPEG, PNG (max 5MB)
- **Access**: Public read, private write
- **CDN**: Enable CloudFront/CDN for fast delivery
- **Retention**: Forever (or until user deletes)

#### 2. **Proof Submissions**
- **Location**: `/proofs/{pact_id}/{proof_id}/{filename}`
- **Format**: JPEG, PNG, MP4, MOV (max 50MB for videos, 10MB for photos)
- **Access**: Private (only circle members can view)
- **CDN**: Stream videos with CloudFront
- **Retention**: 1 year after pact completion (configurable)
- **Backup**: Yes (important for disputes)

#### 3. **Circle Logos**
- **Location**: `/circles/{circle_id}/{filename}`
- **Format**: JPEG, PNG (max 5MB)
- **Access**: Public read
- **CDN**: Enable CDN
- **Retention**: Forever

#### 4. **Proof Thumbnails** (for videos)
- **Location**: `/thumbnails/{proof_id}.jpg`
- **Format**: JPEG (generated automatically)
- **Size**: 300x300px
- **Generation**: Use ffmpeg or similar when video is uploaded

#### 5. **Badge Images**
- **Location**: `/badges/{badge_id}.png`
- **Format**: PNG with transparency
- **Access**: Public
- **CDN**: Enable
- **Size**: 256x256px

### Upload Process

```
┌─────────────────────────────────────┐
│     Client (Frontend)               │
│  Selects file and submits           │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Backend API - Request Upload URL   │
│  (Validates file type, size)        │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│   AWS S3 / Vercel Blob              │
│   Returns presigned POST URL        │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Client uploads directly to S3      │
│  (bypasses backend for speed)       │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  S3 notifies backend via webhook    │
│  (file processed, indexed)          │
└─────────────────────────────────────┘
```

### Recommended Implementation
```javascript
// Backend: Generate presigned upload URL
POST /api/upload/presigned
- Body: { file_type, file_size, proof_id }
- Returns: { upload_url, file_key }

// Backend: Handle S3 webhook
POST /api/webhooks/s3
- Triggered when file uploaded
- Updates proof record with final URL
- Generates thumbnail if needed
- Sends notification to verifiers
```

---

## Notification System

### Notification Types and Triggers

#### 1. **Pact Notifications**
| Trigger | Message | Recipients |
|---------|---------|-----------|
| Pact Created | New pact created in your circle | Circle members |
| Pact Started | A pact you joined has started | Participants |
| Pact Ending Soon | 3 days left in pact | Participants |
| Pact Completed | Pact completed, rewards distributed | Participants |
| Pact Failed | You failed the pact | Failed participants |

#### 2. **Verification Notifications**
| Trigger | Message | Recipients |
|---------|---------|-----------|
| Proof Submitted | New proof needs verification | Circle members (non-submitter) |
| Proof Verified | Your proof was verified | Proof submitter |
| Proof Rejected | Your proof was rejected | Proof submitter |
| Verification Needed (7 min remaining) | Please verify pending proofs | Assigned verifiers |

#### 3. **Social Notifications**
| Trigger | Message | Recipients |
|---------|---------|-----------|
| Follow Request | User wants to follow you | Target user |
| Circle Invite | You've been invited to join circle | Invited user |
| Comment Mention | @user mentioned you in comment | Mentioned user |
| Comment Reply | New reply to your comment | Comment author |

#### 4. **Financial Notifications**
| Trigger | Message | Recipients |
|---------|---------|-----------|
| Deposit Successful | ₹X deposited to wallet | User |
| Withdrawal Initiated | Withdrawal processing | User |
| Reward Earned | You earned ₹X in rewards | User |
| Stake Locked | ₹X locked for pact | User |

### Notification Architecture

```
┌──────────────────┐
│  Event Trigger   │  (Pact completed, proof submitted, etc.)
│  (Backend)       │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Message Queue (Bull/BullMQ)         │
│  - Deduplicates                      │
│  - Batches notifications             │
│  - Handles retries                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Notification Worker                 │
│  - Generates message                 │
│  - Stores in DB                      │
│  - Sends via multiple channels       │
└────────┬─────────────────────────────┘
         │
    ┌────┴────┬──────────┬─────────┐
    ▼         ▼          ▼         ▼
   In-App  Email      SMS      Push
   (DB)    (SendGrid) (Twilio) (Firebase)
```

### Implementation

```typescript
// Notification Service
interface Notification {
  type: NotificationType
  user_id: string
  title: string
  message: string
  from_user_id?: string
  action_url?: string
  metadata?: Record<string, any>
}

// Trigger notification
async function notifyUser(notification: Notification) {
  // Store in DB
  await db.notifications.create(notification)
  
  // Queue for delivery
  await notificationQueue.add({
    userId: notification.user_id,
    type: notification.type,
    // ... rest of data
  })
  
  // If WebSocket connected, send real-time
  if (userSockets[notification.user_id]) {
    userSockets[notification.user_id].emit('notification', notification)
  }
}

// Notification Worker processes queue
notificationQueue.process(async (job) => {
  const { userId, type, title, message } = job.data
  
  // Get user preferences
  const settings = await getUserNotificationSettings(userId)
  
  // Send via enabled channels
  if (settings.email_notifications) {
    await sendEmail(userId, { title, message })
  }
  
  if (settings.push_notifications) {
    await sendPushNotification(userId, { title, message })
  }
})
```

---

## Common Friends & Circle Recommendations

### Common Friends Calculation

```sql
-- Get mutual friends between two users
SELECT 
  u.id, u.full_name, u.avatar_url, u.username,
  COUNT(*) as mutual_count
FROM users u
WHERE u.id IN (
  -- Friends of user A
  SELECT following_id FROM follow WHERE follower_id = $1
) AND u.id IN (
  -- Friends of user B
  SELECT following_id FROM follow WHERE follower_id = $2
)
GROUP BY u.id
ORDER BY mutual_count DESC
LIMIT 10;

-- Get mutual circles between two users
SELECT 
  c.id, c.name, c.logo_url,
  COUNT(*) as mutual_count
FROM circles c
WHERE c.id IN (
  SELECT circle_id FROM circle_members WHERE user_id = $1
) AND c.id IN (
  SELECT circle_id FROM circle_members WHERE user_id = $2
)
GROUP BY c.id
ORDER BY c.member_count DESC;
```

### Circle Recommendations

```sql
-- Recommend circles based on user's activity
SELECT 
  c.id, c.name, c.description, c.logo_url, c.member_count,
  COUNT(DISTINCT cm.user_id) as friends_in_circle
FROM circles c
LEFT JOIN circle_members cm ON c.id = cm.circle_id 
  AND cm.user_id IN (
    SELECT following_id FROM follow WHERE follower_id = $1
  )
WHERE c.id NOT IN (
  SELECT circle_id FROM circle_members WHERE user_id = $1
)
AND c.is_public = true
GROUP BY c.id
HAVING COUNT(DISTINCT cm.user_id) > 0
ORDER BY COUNT(DISTINCT cm.user_id) DESC, c.member_count DESC
LIMIT 10;
```

### Pact Recommendations

```sql
-- Recommend pacts based on user's interests
SELECT 
  p.id, p.title, p.category, p.creator_id,
  COUNT(DISTINCT pp.user_id) as participant_count,
  COUNT(DISTINCT cf.user_b_id) as friends_in_pact
FROM pacts p
LEFT JOIN pact_participants pp ON p.id = pp.pact_id
LEFT JOIN common_friends cf ON p.creator_id = cf.user_a_id 
  AND cf.user_b_id = $1
WHERE p.visibility IN ('public', 'circle-only')
AND p.status = 'active'
AND p.category IN (
  SELECT category FROM pacts 
  WHERE creator_id = $1 OR id IN (
    SELECT pact_id FROM pact_participants WHERE user_id = $1
  )
)
GROUP BY p.id
ORDER BY COUNT(DISTINCT cf.user_b_id) DESC
LIMIT 10;
```

### Caching Common Friends

```typescript
// Cache common friends for faster lookup
async function getCachedCommonFriends(userId1: string, userId2: string) {
  // Check cache first
  const cached = await redis.get(`common_friends:${userId1}:${userId2}`)
  if (cached) return JSON.parse(cached)
  
  // Query DB if not cached
  const commonFriends = await db.query(`
    SELECT ... FROM follow
    WHERE follower_id IN ($1, $2) ...
  `)
  
  // Cache for 24 hours
  await redis.setex(
    `common_friends:${userId1}:${userId2}`,
    86400,
    JSON.stringify(commonFriends)
  )
  
  return commonFriends
}

// Invalidate cache when follow/unfollow happens
async function handleFollow(followerId, followingId) {
  // ... perform follow
  
  // Invalidate cache for both users
  await redis.del(`common_friends:${followerId}:*`)
  await redis.del(`common_friends:${followingId}:*`)
}
```

---

## Authentication & Security

### JWT Token Strategy

```typescript
interface TokenPayload {
  userId: string
  email: string
  role: 'user' | 'admin' | 'moderator'
  iat: number
  exp: number
}

// Access Token: 15 minutes
const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
  expiresIn: '15m'
})

// Refresh Token: 7 days
const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
  expiresIn: '7d'
})

// Store refresh token in DB with hash
await db.refreshTokens.create({
  user_id: userId,
  token_hash: hash(refreshToken),
  expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000
})
```

### Password Security

```typescript
// Hash password with bcrypt
import bcrypt from 'bcrypt'

const passwordHash = await bcrypt.hash(password, 12)

// Verify password
const isValid = await bcrypt.compare(inputPassword, storedHash)
```

### Rate Limiting

```typescript
// Rate limit authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  keyGenerator: (req) => req.body.email
})

app.post('/api/auth/login', authLimiter, async (req, res) => {
  // ...
})

// Rate limit payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10
})
```

### Data Validation

```typescript
import { z } from 'zod'

const CreatePactSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().max(2000),
  stake_amount: z.number().positive().max(1000000),
  start_date: z.date(),
  end_date: z.date(),
  verification_method: z.enum(['photo', 'video', 'checklist', 'manual']),
  // ... more fields
})

app.post('/api/pacts', async (req, res) => {
  try {
    const data = CreatePactSchema.parse(req.body)
    // ... create pact
  } catch (error) {
    return res.status(400).json({ error: error.errors })
  }
})
```

### Authorization Middleware

```typescript
// Verify JWT
function verifyAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token' })
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Check permissions
function requireCircleAdmin(req, res, next) {
  const { circleId } = req.params
  const { userId } = req.user
  
  const member = await db.circleMembers.findOne({
    circle_id: circleId,
    user_id: userId,
    role: { $in: ['admin', 'moderator'] }
  })
  
  if (!member) return res.status(403).json({ error: 'Forbidden' })
  next()
}

app.delete('/api/circles/:circleId/members/:memberId',
  verifyAuth,
  requireCircleAdmin,
  async (req, res) => {
    // ... remove member
  }
)
```

---

## Real-time Features

### WebSocket Setup

```typescript
import { Server } from 'socket.io'

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL },
  transports: ['websocket', 'polling']
})

// Authenticate socket connection
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    socket.userId = decoded.userId
    next()
  } catch (error) {
    next(new Error('Authentication failed'))
  }
})

// Handle connections
io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected`)
  
  // Join user-specific room for notifications
  socket.join(`user:${socket.userId}`)
  
  // Join pact rooms for real-time updates
  socket.on('join_pact', (pactId) => {
    socket.join(`pact:${pactId}`)
  })
  
  socket.on('leave_pact', (pactId) => {
    socket.leave(`pact:${pactId}`)
  })
  
  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected`)
  })
})

// Broadcast events
function notifyUser(userId, notification) {
  io.to(`user:${userId}`).emit('notification', notification)
}

function broadcastPactUpdate(pactId, update) {
  io.to(`pact:${pactId}`).emit('pact_update', update)
}
```

### Real-time Events

```typescript
// When proof is submitted
async function submitProof(pactId, userId, proof) {
  const saved = await db.proofs.create({ ...proof, pact_id: pactId })
  
  // Notify circle members
  const pact = await db.pacts.findById(pactId)
  const circle = await db.circles.findById(pact.circle_id)
  const members = await db.circleMembers.find({ circle_id: circle.id })
  
  for (const member of members) {
    if (member.user_id !== userId) {
      notifyUser(member.user_id, {
        type: 'proof_verification_needed',
        proof_id: saved.id,
        pact_id: pactId
      })
      
      // Broadcast real-time update
      io.to(`pact:${pactId}`).emit('proof_submitted', saved)
    }
  }
}

// When verification is submitted
async function submitVerification(proofId, verifierId, vote) {
  const verification = await db.verifications.create({
    proof_id: proofId,
    verifier_id: verifierId,
    vote
  })
  
  // Get proof and notify submitter
  const proof = await db.proofs.findById(proofId)
  notifyUser(proof.user_id, {
    type: 'verification_received',
    proof_id: proofId,
    vote
  })
  
  // Broadcast to pact viewers
  io.to(`pact:${proof.pact_id}`).emit('verification_submitted', {
    proof_id: proofId,
    vote,
    timestamp: new Date()
  })
}

// When comment is added
async function addComment(pactId, userId, content) {
  const comment = await db.comments.create({
    pact_id: pactId,
    user_id: userId,
    content
  })
  
  // Broadcast to all viewers
  io.to(`pact:${pactId}`).emit('comment_added', comment)
}
```

---

## Data Models & Relationships

### Entity Relationship Diagram

```
┌─────────────────┐
│     USERS       │
├─────────────────┤
│ id (PK)         │
│ email           │
│ full_name       │
│ username        │
│ avatar_url      │
│ reputation      │
│ streak          │
└────────┬────────┘
         │
    ┌────┴─────────────────────────────────┐
    │                                       │
    ▼                                       ▼
┌──────────────┐   ┌─────────────────┐  ┌──────────────┐
│   CIRCLES    │   │     PACTS       │  │   FOLLOW     │
├──────────────┤   ├─────────────────┤  ├──────────────┤
│ id (PK)      │   │ id (PK)         │  │ follower_id  │
│ creator_id   │◄──┤ creator_id (FK) │  │ following_id │
│ name         │   │ circle_id (FK)  │  │ is_mutual    │
│ description  │   │ title           │  └──────────────┘
│ is_public    │   │ stake_amount    │
└──────┬───────┘   │ verification    │
       │           │ status          │
       │           └────────┬────────┘
       │                    │
    ┌──┴──┐            ┌────┴────────────┐
    │     │            │                 │
    ▼     ▼            ▼                 ▼
┌────────────────┐  ┌──────────────┐  ┌──────────────┐
│ CIRCLE_MEMBERS │  │ PACT_PARTICIP│ │   PROOFS     │
├────────────────┤  ├──────────────┤  ├──────────────┤
│ id             │  │ pact_id (FK) │  │ pact_id (FK) │
│ circle_id (FK) │  │ user_id (FK) │  │ user_id (FK) │
│ user_id (FK)   │  │ staked_amount│  │ content_url  │
│ role           │  │ earned_amount│  │ status       │
└────────────────┘  │ status       │  └────────┬─────┘
                    └──────────────┘           │
                                               ▼
                                    ┌──────────────────┐
                                    │ VERIFICATIONS    │
                                    ├──────────────────┤
                                    │ proof_id (FK)    │
                                    │ verifier_id (FK) │
                                    │ vote             │
                                    │ confidence       │
                                    └──────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   WALLET         │  │  TRANSACTIONS    │  │  NOTIFICATIONS   │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ user_id (PK/FK)  │  │ id (PK)          │  │ id (PK)          │
│ available_bal    │  │ user_id (FK)     │  │ user_id (FK)     │
│ locked_bal       │  │ type             │  │ type             │
│ rewards_bal      │  │ amount           │  │ title            │
└──────────────────┘  │ pact_id (FK)     │  │ message          │
                      │ status           │  │ is_read          │
                      └──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐
│    COMMENTS      │  │     BADGES       │
├──────────────────┤  ├──────────────────┤
│ id (PK)          │  │ id (PK)          │
│ pact_id (FK)     │  │ user_id (FK)     │
│ proof_id (FK)    │  │ badge_type       │
│ user_id (FK)     │  │ is_unlocked      │
│ content          │  │ rarity           │
│ parent_id (FK)   │  └──────────────────┘
└──────────────────┘
```

---

## Implementation Timeline & Priorities

### Phase 1: Core Backend (Week 1-2)
- [ ] Database schema setup
- [ ] User authentication (register/login)
- [ ] User profile endpoints
- [ ] Basic wallet setup

### Phase 2: Pacts System (Week 2-3)
- [ ] Create/read/update pacts
- [ ] Pact participants management
- [ ] Basic pact listing and filtering

### Phase 3: Verification System (Week 3-4)
- [ ] Proof submission endpoints
- [ ] Verification voting (believe/doubt)
- [ ] Stats calculation

### Phase 4: Circles & Social (Week 4-5)
- [ ] Circle CRUD operations
- [ ] Circle members management
- [ ] Comments system
- [ ] Following system

### Phase 5: Advanced Features (Week 5-6)
- [ ] Notifications
- [ ] Real-time updates (WebSockets)
- [ ] Search functionality
- [ ] Analytics

### Phase 6: Optimization & Testing (Week 6-7)
- [ ] Performance optimization
- [ ] Caching strategies
- [ ] Error handling & logging
- [ ] Unit and integration tests

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] S3/Blob storage configured
- [ ] Email service (SendGrid) configured
- [ ] SMS service (Twilio) configured
- [ ] Firebase/Push notifications configured
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Error logging (Sentry) configured
- [ ] Database backups scheduled
- [ ] CDN configured
- [ ] SSL certificates installed
- [ ] Monitoring & alerting set up
- [ ] Load testing completed
- [ ] Security audit passed

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "field": "value"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "field": "stake_amount",
        "message": "Must be positive"
      }
    ]
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [
    { "id": "1", "name": "Item 1" },
    { "id": "2", "name": "Item 2" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasMore": true
  }
}
```

---

## Summary

This complete backend design document provides:

1. **Database Schema**: 15+ tables with proper relationships and indices
2. **API Endpoints**: 50+ endpoints covering all frontend features
3. **File Storage**: Strategy for avatars, proofs, badges
4. **Notification System**: Event-driven with multiple delivery channels
5. **Real-time Features**: WebSocket setup for live updates
6. **Common Friends**: Efficient queries with caching
7. **Security**: JWT tokens, password hashing, rate limiting
8. **Best Practices**: Data validation, error handling, response formats

Each endpoint maps directly to frontend features implemented, ensuring complete feature parity between frontend and backend.
