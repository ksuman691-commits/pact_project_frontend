# CirclePact Backend - Quick Reference Guide

## 🎯 TL;DR: What You Need to Build

### Critical Issues to Fix
1. **Login/Register**: Stop redirecting to full URLs, return JSON + token
2. **Create Circle**: Stop opening full page, use modal instead
3. **Create Pact**: Stop opening full page, use 5-step modal wizard
4. **All Responses**: Always return JSON, never HTML
5. **Pagination**: Add to all list endpoints (feed, circles, followers, etc.)

---

## 📊 Backend Overview

### Tech Stack Recommended
- Framework: Django, Flask, FastAPI, or Node.js/Express
- Database: PostgreSQL (recommended)
- Auth: JWT tokens (Bearer scheme)
- File Storage: S3 or similar for proofs/videos

### Database Tables Needed
```
users → pacts (one to many)
users → circles (many to many via circle_members)
users → wallets (one to one)
pacts → proofs (one to many)
pacts → votes (many to many)
pacts → comments (many to one)
pacts → verifications (many to one)
circles → circle_members
```

---

## 🚀 Implementation Roadmap (5-7 days)

### Day 1-2: Authentication
```
✓ POST /auth/login → { access_token, user }
✓ POST /auth/register → { access_token, user }
✓ GET /users/me (protected route)
```

### Day 2-3: Pacts Core
```
✓ POST /pacts (create from wizard)
✓ GET /pacts/{id} (full details with comments)
✓ GET /feed/personalized (paginated feed)
✓ POST /pacts/{id}/votes (believe/doubt)
```

### Day 4: Circles
```
✓ POST /circles (create)
✓ GET /circles (list user's)
✓ GET /circles/{id} (with members & leaderboard)
✓ POST /circles/{id}/join
```

### Day 5: Social Features
```
✓ POST /pacts/{id}/proofs (file upload)
✓ POST /pacts/{id}/comments
✓ POST /users/{id}/follow
✓ GET /users/{id}/followers
```

### Day 6: Wallet & Verification
```
✓ GET /wallet/balance
✓ POST /wallet/deposit
✓ POST /wallet/withdraw
✓ POST /pacts/{id}/verifications (4-point system)
```

### Day 7: Polish & Testing
```
✓ Error handling
✓ Input validation
✓ CORS configuration
✓ Integration testing with frontend
```

---

## 📋 API Endpoints Checklist

### Authentication (2 endpoints)
- [ ] `POST /auth/login` - Returns token + user
- [ ] `POST /auth/register` - Creates user, returns token

### Pacts (8 endpoints)
- [ ] `POST /pacts` - Create pact from wizard
- [ ] `GET /pacts/{id}` - Full pact details
- [ ] `GET /feed/personalized` - Paginated feed
- [ ] `POST /pacts/{id}/votes` - Vote believe/doubt
- [ ] `POST /pacts/{id}/proofs` - Upload proof file
- [ ] `POST /pacts/{id}/comments` - Add comment
- [ ] `GET /pacts` - User's pacts list
- [ ] `PUT /pacts/{id}` - Update pact (optional)

### Circles (5 endpoints)
- [ ] `POST /circles` - Create circle
- [ ] `GET /circles` - User's circles
- [ ] `GET /circles/{id}` - Circle details + members
- [ ] `POST /circles/{id}/join` - Join circle
- [ ] `GET /circles/{id}/leaderboard` - Rankings

### Users & Profiles (5 endpoints)
- [ ] `GET /users/me` - Current user profile
- [ ] `GET /users/{username}` - Public profile
- [ ] `PUT /users/me` - Update profile
- [ ] `POST /users/{id}/follow` - Follow user
- [ ] `GET /users/{id}/followers` - Followers list

### Wallet (4 endpoints)
- [ ] `GET /wallet/balance` - Get balance
- [ ] `POST /wallet/deposit` - Add funds
- [ ] `POST /wallet/withdraw` - Withdraw funds
- [ ] `GET /wallet/transactions` - Transaction history

### Verification (1 endpoint)
- [ ] `POST /pacts/{id}/verifications` - 4-point vote

**Total: 25 API endpoints**

---

## 🔑 Response Format (All Endpoints)

### Success (200/201)
```json
{
  "status": "success",
  "data": { ... },
  "message": "Action successful"
}
```

### Error (400/401/403/404/500)
```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "details": { ... }
}
```

### Paginated List
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

## 🔐 Authentication

### Token Format
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Where Token Goes
- Request header: `Authorization: Bearer {token}`
- Frontend stores in localStorage: `localStorage.token`
- Frontend sends on every API call (via axios interceptor)

### Token Lifetime
- Recommended: 24 hours
- Refresh: Frontend refreshes page → uses cached token
- Expiry: Return 401 → frontend redirects to login

---

## 📝 Key Data Models

### User
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "avatar_url": "https://...",
  "bio": "Building habits",
  "reputation_score": 85.5,
  "current_streak": 14,
  "created_at": "2024-01-01T10:00:00Z"
}
```

### Pact
```json
{
  "id": 42,
  "title": "Ship MVP in 7 days",
  "description": "...",
  "creator_id": 1,
  "creator_name": "Aniket",
  "stake_amount": 500,
  "status": "active",
  "start_date": "2024-01-15T10:00:00Z",
  "end_date": "2024-01-22T10:00:00Z",
  "believers_count": 78,
  "doubters_count": 22,
  "confidence_score": 78,
  "progress_percentage": 71,
  "verification_type": "video",
  "created_at": "2024-01-15T10:00:00Z"
}
```

### Circle
```json
{
  "id": 1,
  "name": "Tech Founders",
  "description": "...",
  "creator_id": 1,
  "privacy": "private",
  "members_count": 23,
  "avatar_url": "https://...",
  "created_at": "2024-01-01T10:00:00Z"
}
```

---

## 🧪 Testing After Implementation

### Step 1: Test with Postman
1. Create Postman collection
2. Set base URL: `http://localhost:8000`
3. Test each endpoint with sample data
4. Verify response structure matches docs

### Step 2: Test with Frontend
1. Clone frontend repo (this repo)
2. Install dependencies: `npm install`
3. Set backend URL in `.env`
4. Run dev server: `npm run dev`
5. Open http://localhost:3000
6. Try each feature:
   - Login
   - Create pact
   - View feed
   - Vote on pact
   - Create circle
   - View wallet

### Step 3: Check Frontend Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by XHR
4. Perform action
5. Verify API call appears
6. Check response has correct structure

---

## ⚠️ Common Mistakes to Avoid

### ❌ Mistake #1: Redirecting Instead of Returning JSON
```python
# WRONG
return redirect('/dashboard')

# RIGHT
return jsonify({
    'status': 'success',
    'data': {'access_token': '...', 'user': {...}},
    'message': 'Login successful'
})
```

### ❌ Mistake #2: Returning HTML from API
```python
# WRONG
return render_template('create_circle.html')

# RIGHT
return jsonify({
    'status': 'success',
    'data': {'id': 1, 'name': 'Tech Founders'},
    'message': 'Circle created'
})
```

### ❌ Mistake #3: Missing Pagination
```python
# WRONG
pacts = Pact.objects.all()
return jsonify(pacts)

# RIGHT
page = request.args.get('page', 1)
limit = request.args.get('limit', 10)
pacts = Pact.objects.paginate(page, limit)
return jsonify({
    'data': pacts,
    'pagination': {
        'page': page,
        'limit': limit,
        'total': total_count,
        'has_next': has_next
    }
})
```

### ❌ Mistake #4: Forgetting CORS
```python
# WRONG - API works in Postman, breaks in browser

# RIGHT - Add CORS to all endpoints
from flask_cors import CORS
CORS(app)
```

### ❌ Mistake #5: Token in Different Format
```python
# WRONG
response.headers['Authorization'] = token

# RIGHT - Frontend expects this format
return jsonify({
    'access_token': token,
    'token_type': 'Bearer'
})
```

---

## 📞 Questions to Clarify

Before starting, confirm with your frontend team:

1. **Database**: Using PostgreSQL or SQLite?
2. **File Storage**: Where should proofs go (S3, local, etc.)?
3. **Wallet**: Real money or testing with mock balances?
4. **Categories**: Fixed list or user-created?
5. **Verification**: 4-question system required?
6. **Notifications**: Email/SMS when pacts complete?
7. **Verification**: Should verification affect pact status?
8. **Leaderboard**: Sorted by what (win rate, pacts, reputation)?
9. **Streaks**: Reset daily or calendar-based?
10. **Error Codes**: Any specific codes required?

---

## 🎓 Learning Resources

### If using Python/Django
- Django REST Framework: https://www.django-rest-framework.org/
- Django JWT Auth: https://github.com/jpadilla/django-rest-framework-simplejwt

### If using Node.js/Express
- Express.js: https://expressjs.com/
- JWT auth: https://github.com/auth0/node-jsonwebtoken
- Validation: https://express-validator.github.io/

### If using FastAPI (recommended for quick build)
- FastAPI: https://fastapi.tiangolo.com/
- JWT: https://fastapi.tiangolo.com/advanced/security/

---

## ✅ Success Criteria

After implementing all endpoints, verify:

- [ ] Frontend login works (no page redirect)
- [ ] Create pact opens modal wizard (not full page)
- [ ] Create circle opens modal (not full page)
- [ ] Pact feed shows real pacts from API
- [ ] Voting works and updates counts
- [ ] Wallet balance displays correctly
- [ ] User profiles show real data
- [ ] Follow button works
- [ ] File uploads work
- [ ] Comments work
- [ ] All paginated lists work
- [ ] No console errors
- [ ] No CORS errors
- [ ] API calls visible in DevTools

---

## 📚 Documentation Files

Three comprehensive docs are provided:

1. **BACKEND_IMPLEMENTATION_GUIDE.md** (1650+ lines)
   - Complete API specs with examples
   - Database schema
   - Implementation checklist
   - Error handling
   - Testing workflow

2. **FRONTEND_BACKEND_MAPPING.md** (500+ lines)
   - Frontend page to API mapping
   - Detailed flow diagrams
   - Component-to-API mapping
   - Example flows
   - Debugging tips

3. **QUICK_BACKEND_REFERENCE.md** (this file)
   - Quick checklist
   - 5-7 day roadmap
   - Key data models
   - Common mistakes
   - Testing steps

**Start with this file → read BACKEND_IMPLEMENTATION_GUIDE.md for details → use FRONTEND_BACKEND_MAPPING.md while coding**

---

## 🎯 Your Next Steps

1. **Today**: Read this file + BACKEND_IMPLEMENTATION_GUIDE.md
2. **Day 1-2**: Implement auth endpoints
3. **Day 2-4**: Implement pact endpoints
4. **Day 4-5**: Implement circles + wallet
5. **Day 5-6**: Implement profiles + verification
6. **Day 6-7**: Test everything with frontend
7. **Day 7+**: Handle edge cases + optimize

**Good luck! 🚀 You got this!**

