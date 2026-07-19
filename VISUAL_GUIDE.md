# CirclePact Reporting System - Visual Guide

## User Experience Flow

### 1. Feed View (PactFeedV2)

```
┌─────────────────────────────────────────┐
│          CirclePact Feed                │
├─────────────────────────────────────────┤
│                                         │
│  @john Day 2 of 7                       │  ← Creator info
│  ⋯                                      │  ← Report button (3-dots)
│                                         │
│  Ship MVP in 7 Days                     │  ← Pact title
│  📸 [Full width proof image]            │  ← New: Full media display
│                                         │
│  ━━━━━━━━━━━━━━━━━                     │  ← Support % only
│  3420 Supporters                        │  ← New: Support count only
│  👤👤👤 +12 more                        │  ← New: Recent supporters
│                                         │
│  [✓ Support]  [✗ Skip]                  │  ← New: Support/Skip buttons
│                                         │
│  Reported  42 Proofs  📝 5  ↗️           │  ← Report badge if applicable
│                                         │
└─────────────────────────────────────────┘
```

### 2. Reporting Flow

#### Step 1: Click Report Button
```
User clicks three-dots menu (⋯) on any pact card
↓
Report button appears in menu
↓
User clicks "Report Pact"
```

#### Step 2: Report Modal Opens
```
┌─────────────────────────────────────────┐
│      Report Pact                    ✕   │
├─────────────────────────────────────────┤
│                                         │
│  Reporting: Ship MVP in 7 Days          │
│  ────────────────────────────────────   │
│                                         │
│  Why are you reporting this pact?       │
│                                         │
│  ☑ [⚡] Fake or AI Generated            │  ← Selected
│        This pact appears to be...       │
│                                         │
│  [ ] [💬] Spam                          │
│        This is spam or promotional...   │
│                                         │
│  [ ] [⚠️] Offensive Content             │
│        This content is offensive...     │
│                                         │
│  ℹ️  Thank you for helping keep...      │
│                                         │
│  [Cancel]  [Report Pact]                │
│                                         │
└─────────────────────────────────────────┘
```

#### Step 3: Confirmation
```
User clicks "Report Pact"
↓
API request sent to backend
↓
Toast notification: "Pact reported successfully. 
Thank you for helping keep our community safe."
↓
Modal closes
↓
Card now shows "Reported" badge
```

### 3. Auto-Hide at 4 Reports

```
Report Count:          Feed Display:
0-3 reports       →    ✅ Visible
4+ reports        →    ❌ Hidden from feed
```

### 4. View Your Reports

#### Page: `/profile/reports` or similar
```
┌─────────────────────────────────────────┐
│      Your Reports                       │
├─────────────────────────────────────────┤
│                                         │
│  [Report 1]                             │
│  👤 @jane Day 5 of 30                   │
│  "Lose 5kg in 60 days"                  │
│  📌 Reason: Fake or AI Generated        │
│  [View Pact]                            │
│                                         │
│  [Report 2]                             │
│  👤 @alex Day 10 of 100                 │
│  "Code 100 Days Straight"               │
│  📌 Reason: Spam                        │
│  [View Pact]                            │
│                                         │
│  [Report 3]                             │
│  👤 @sam Day 2 of 14                    │
│  "Learn React in 2 Weeks"               │
│  📌 Reason: Offensive Content           │
│  [View Pact]                            │
│                                         │
│  [Load More]                            │
│                                         │
└─────────────────────────────────────────┘
```

---

## Voting System

### Before (Believe/Doubt)
```
┌────────────────────────────┐
│  ━━━━━━━━━━│               │  ← 73% Believe
│  73% Believe                │
│  3420 believers · 1250...   │
│                             │
│  [✓ Believe]  [✕ Doubt]    │  ← Blue/Red buttons
│                             │
└────────────────────────────┘
```

### After (Support/Skip)
```
┌────────────────────────────┐
│  ━━━━━━━━━━━━━━━          │  ← Support % only
│  3420 Supporters            │  ← Skip never shown
│  👤👤👤 +12 more           │  ← New: Recent supporters
│                             │
│  [✓ Support]  [✗ Skip]     │  ← Emerald/Slate buttons
│                             │
└────────────────────────────┘
```

---

## Color System

### New Emerald Theme
```
Primary Actions:
  Support Vote    → Emerald (#10b981)
  Vote Pressed    → Emerald dark (#059669)
  Support Badge   → Emerald light (#d1fae5)

Secondary Actions:
  Skip Vote       → Slate (#64748b)
  Vote Pressed    → Slate dark (#475569)
  Skip Badge      → Slate light (#f1f5f9)

Alert/Report:
  Report Badge    → Red (#dc2626)
  Report Modal    → Red accents (#ef4444)
  Modal Cancel    → Slate border

Status:
  Loading         → Slate gray animation
  Success         → Emerald toast
  Error           → Red toast
  Warning         → Blue info box
```

---

## Mobile Experience

### PactCard on Mobile
```
Width: 360px (iPhoneSE / small phones)

┌──────────────────────────┐
│ @john 2/7           ⋯    │  ← Compact header
├──────────────────────────┤
│ Ship MVP in 7 Days       │
│ (text wraps as needed)   │
│                          │
│ 📸 [Full width media]    │
│ (aspect ratio maintained)│
│                          │
│ ━━━━━━━━              │  ← Support bar
│ 3.4k Supporters         │  ← Abbreviated
│ 👤👤👤 +12             │  ← Stacked avatars
│                          │
│ [✓ Support] [✗ Skip]    │  ← Buttons stack
│                          │
│ Report  42P  📝5  ↗️     │  ← Compact footer
│                          │
└──────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│           User Actions                              │
└────────────┬────────────────────────────────────────┘
             │
             ├─ Vote Support ──→ useVoteSupport()
             │                   ↓
             │            POST /api/pacts/{id}/vote-support
             │                   ↓
             │            Update React Query cache
             │                   ↓
             │            Card re-renders with new count
             │
             ├─ Vote Skip ────→ useVoteSkip()
             │                   ↓
             │            POST /api/pacts/{id}/vote-skip
             │                   ↓
             │            Update React Query cache
             │                   ↓
             │            Card re-renders (silent)
             │
             └─ Report Pact ──→ useReportPact()
                                 ↓
                          POST /api/pacts/{id}/report
                                 ↓
                          Show "Reported" badge
                                 ↓
                          Invalidate feed cache
                                 ↓
                          Feed filters out if >= 4 reports
```

---

## State Transitions

### Vote State
```
┌──────────────┐
│   No Vote    │
└──────┬───────┘
       │
       ├─ Click Support ─→ ┌──────────────┐
       │                   │   Support    │  ← Button highlights
       └─ Click Skip ─────→│ (voted)      │
                           └──────┬───────┘
                                  │
                           └─ Click Support again
                              (toggle off)
```

### Report State
```
┌──────────────┐
│  Not Reported│
└──────┬───────┘
       │
       └─ Click Report ─→ ┌──────────────┐
                          │   Reported   │  ← Badge shows
                          │  (submitted) │
                          └──────────────┘
                          (can report again with
                           different reason)
```

---

## Keyboard Navigation

### For Accessibility
```
PactCard:
  Tab     → Focus between buttons
  Enter   → Click focused button
  Escape  → Close modals

ReportModal:
  Tab     → Cycle through report options
  Enter   → Select option
  Enter   → Submit report
  Escape  → Close modal
```

---

## Error States

### Network Error
```
[Report Button Clicked]
  ↓
[Attempting to submit...]
  ↓
[Network fails]
  ↓
Toast: "Failed to report pact"
  ↓
Modal stays open, user can retry
```

### Duplicate Report
```
[Click Report]
  ↓
[Select Reason]
  ↓
[Click Report]
  ↓
Backend: "Already reported with this reason"
  ↓
Toast: "You already reported this pact"
  ↓
Modal closes
```

---

## Animation & Transitions

### Vote Button Press
```
Before:        On Click:       After:
┌─────────┐   ┌─────────┐    ┌─────────┐
│ Support │→  │ Support │→   │ Support │
└─────────┘   └─────────┘    └─────────┘
 (slate)     (animate)    (emerald filled)
                (scale up)     (shadow)
             (0.1s)         (200ms total)
```

### Modal Open
```
Initial:                 Final:
┌─────────────┐        ┌─────────────┐
│             │        │             │
│             │   ┌────┤  Fade In    │
│ (dark bg)   │   │    │             │
│             │   │    │  Slide Up   │
│             │   │    │             │
└─────────────┘   │    └─────────────┘
              (300ms)
```

---

## Performance Metrics

### Expected Load Times
```
Feed Load:        < 1s
Vote Submit:      200-500ms
Report Submit:    200-500ms
Modal Open:       100ms
Image Display:    Varies (lazy loaded)
```

### Optimization Techniques
```
✓ React Query caching
✓ Image lazy loading (Next.js Image)
✓ Component memoization ready
✓ Pagination for reports
✓ Skeleton screens during load
✓ No unnecessary re-renders
```

---

## Responsive Breakpoints

```
Mobile (< 640px):
  - Full width cards
  - Stack buttons vertically
  - Single column layout
  
Tablet (640px - 1024px):
  - Cards with margins
  - Horizontal button layout
  - 1-2 column layout

Desktop (> 1024px):
  - Max-width containers
  - Full button layouts
  - Multi-column options
```

---

## Accessibility Features

```
✓ Semantic HTML
✓ ARIA labels on buttons
✓ Keyboard navigation
✓ Focus indicators
✓ Alt text on images
✓ Color contrast compliance
✓ Loading states announced
✓ Error messages visible
✓ Mobile touch targets 48px+
✓ Screen reader support
```

