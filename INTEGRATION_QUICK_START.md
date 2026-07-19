# Quick Start: Reporting System Integration

## What Was Built

Frontend implementation for the CirclePact reporting and voting system. All components are production-ready and connect to your backend APIs.

---

## Quick Integration (5 Minutes)

### 1. Replace Feed Component

**Before:**
```jsx
import PactFeed from '@/components/PactFeed'

export default function HomePage() {
  return <PactFeed category="all" />
}
```

**After:**
```jsx
import PactFeedV2 from '@/components/PactFeedV2'

export default function HomePage() {
  return <PactFeedV2 category="all" />
}
```

**That's it!** The feed now:
- Shows support count only
- Hides skip votes
- Filters out reported pacts
- Has report buttons on each card

---

## What Each New Component Does

### PactCardV2
The new pact card UI with:
- Support/Skip voting (new emerald/slate theme)
- Report button (three-dots menu)
- "Reported by me" badge
- Recent supporters avatars
- Full media display

**Use it:** Automatically via PactFeedV2, or import directly for custom layouts.

### ReportPactModal
Modal that appears when user clicks report:
- 3 report reasons (Fake/AI, Spam, Offensive)
- Each with icon and description
- Submits to backend and shows confirmation

**Use it:** Automatically appears when clicking report button on card.

### ReportedPactsTab
Shows user's reported pacts:
- List of all pacts user reported
- Shows report reason
- Pagination support
- "View Pact" button

**Use it:** Add to profile page or reports section:
```jsx
import ReportedPactsTab from '@/components/ReportedPactsTab'

export default function ReportsPage() {
  return (
    <div>
      <h1>Your Reports</h1>
      <ReportedPactsTab />
    </div>
  )
}
```

### PactFeedV2
Enhanced feed component:
- Auto-filters pacts with >= 4 reports
- Infinite scroll support
- Uses new backend response format
- All cards are PactCardV2

**Use it:** Replace anywhere you use PactFeed.

---

## What Hooks Are Available

### Vote Hooks
```jsx
import { useVoteSupport, useVoteSkip } from '@/hooks/useReportingMutations'

const supportMutation = useVoteSupport()
const skipMutation = useVoteSkip()

// Use in component
supportMutation.mutateAsync(pactId)
skipMutation.mutateAsync(pactId)
```

### Report Hooks
```jsx
import { 
  useReportPact, 
  useGetMyReports, 
  useGetReportCount, 
  useGetReportLogs 
} from '@/hooks/useReportingMutations'

// Report a pact
const reportMutation = useReportPact()
reportMutation.mutateAsync({ pactId, reason: 'fake_or_ai' })

// Get user's reports
const { data: reports } = useGetMyReports(0, 20)

// Get report stats for a pact
const { data: stats } = useGetReportCount(pactId)

// Get who reported (for moderators)
const { data: logs } = useGetReportLogs(pactId)
```

---

## Backend Endpoints Required

Your backend needs these endpoints running. Check with your backend team:

```
POST /api/pacts/{id}/vote-support     ✓ Should be live
POST /api/pacts/{id}/vote-skip        ✓ Should be live
POST /api/pacts/{id}/report           ✓ Should be live
GET  /api/pacts/my-reports            ✓ Should be live
GET  /api/pacts/{id}/report-count     ✓ Should be live
GET  /api/pacts/{id}/report-logs      ✓ Should be live
GET  /api/pacts/feed/personalized     ✓ Updated with new fields
```

All these should have been implemented in your backend update.

---

## Response Format

### Feed Response (from `/api/pacts/feed/personalized`)
```json
{
  "data": [
    {
      "id": 1,
      "title": "Ship MVP",
      "support_count": 3420,          // ← NEW: show this
      "skip_count": 0,                // ← DON'T show skip count
      "recent_supporters": [          // ← NEW: avatars
        { "id": "u1", "name": "Alice", "avatar": "url" }
      ],
      "is_reported_by_me": false,     // ← NEW: show badge if true
      "report_count": 0,              // ← NEW: if >= 4, pact hides
      "proof_url": "url",             // ← NEW: main media
      "proof_type": "photo",          // ← NEW: video or photo
      "user_vote": "support",         // User's vote
      "creator": "john",
      // ... rest of fields
    }
  ],
  "pagination": { "skip": 0, "limit": 20, "has_more": true }
}
```

---

## Migration Checklist

- [ ] Backend endpoints all live and tested
- [ ] Replace PactFeed with PactFeedV2 in home page
- [ ] Add ReportedPactsTab to user profile page
- [ ] Test feed loads with new response format
- [ ] Test voting (support/skip) works
- [ ] Test reporting opens modal and submits
- [ ] Test reported pacts auto-hide
- [ ] Check mobile responsiveness
- [ ] Verify no console errors
- [ ] Deploy to staging and test E2E

---

## Testing in Development

```bash
# Watch for errors
# Open browser DevTools Console

# Test 1: Feed loads
# Should see pacts with support_count, not skip_count

# Test 2: Vote support
# Click Support button, should show "You voted support!"
# Check Network tab: POST /api/pacts/{id}/vote-support

# Test 3: Report
# Click three-dots, select reason, submit
# Card should show "Reported" badge
# Check Network tab: POST /api/pacts/{id}/report

# Test 4: View reports
# Go to ReportedPactsTab
# Should list all reported pacts
```

---

## If Something Breaks

1. **Feed not loading**: Check backend `/api/pacts/feed/personalized` endpoint
2. **Vote not working**: Check `/api/pacts/{id}/vote-support` endpoint
3. **Report not working**: Check `/api/pacts/{id}/report` endpoint
4. **No recent supporters**: Check `recent_supporters` in feed response
5. **Console errors**: Check React Query DevTools (usually a network issue)

---

## Files Location

```
/src/hooks/
  └── useReportingMutations.ts         (6 hooks for voting/reporting)

/src/components/
  ├── PactCardV2.tsx                  (New card with report + support)
  ├── PactFeedV2.tsx                  (New feed using PactCardV2)
  ├── ReportPactModal.tsx             (Report modal with 3 reasons)
  └── ReportedPactsTab.tsx            (Show user's reports)

/src/services/
  └── api.ts                           (Updated with new endpoints)

/FRONTEND_IMPLEMENTATION_COMPLETE.md   (Full technical docs)
/INTEGRATION_QUICK_START.md            (This file)
```

---

## Support

If you have questions:
1. Check `FRONTEND_IMPLEMENTATION_COMPLETE.md` for technical details
2. Search components for inline comments
3. Check hook functions for logic flow
4. Verify backend endpoints are live

Everything is built and ready to go!

