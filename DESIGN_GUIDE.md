# CirclePact Frontend Design Guide

## Visual Redesign Overview

### 🎯 Design Philosophy
- **Circular Theme** - Reinforces "Circle" concept with rounded elements throughout
- **Instagram-Inspired** - Clean cards, emphasis on visual content, subtle interactions
- **Mobile-First** - Optimized for 375px (iPhone 14) width
- **Minimal & Elegant** - Remove clutter, emphasize essence
- **Gradient Accents** - Emerald → Blue theme throughout

---

## Header Layout

```
┌─────────────────────────────────────────┐
│ MC | Welcome back            [+] [👥] [🔔]2
│    | Maya                               
├─────────────────────────────────────────┤
│ Active: 4  │  Circles: 3  │  Streak: 14d🔥  │  Done: 27
└─────────────────────────────────────────┘
```

**Key Elements:**
- Avatar (11px circular) on left
- Greeting text (small font)
- **3 Action Buttons on Right:**
  - ✚ Create Pact (Emerald)
  - 👥 Join Circle (Blue)
  - 🔔 Notifications (with badge)

---

## Pact Card Anatomy

```
┌─────────────────────────────────────────┐
│  🔥  Aniket    Day 2/7              ⋮   │
│                                         │
│  Ship MVP in 7 days                    │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │         🔥                      │  │
│  │      2 proof clips              │  │
│  └─────────────────────────────────┘  │
│                                         │
│  Confidence: 73%  │ Believe: 3k        │
│  Doubt: 1k       │ Time: 2d 14h       │
│                                         │
│  ████████░░░░░░░░░░░ (Progress)       │
│                                         │
│  [✓ Believe] [✗ Doubt]       [📷 Proof]
│                                         │
│  Members: ⭕ ⭕ ⭕ ⭕ +2              │
│                                         │
│  ❤️ 2.7k    💬 145   🔗 Share         │
└─────────────────────────────────────────┘
```

### Card Dimensions
- **Border Radius:** 16px (rounded-2xl)
- **Shadow:** sm (subtle)
- **Border:** 1px gray-100
- **Margin Bottom:** 24px (space-y-6)

### Title Section
- **Font:** Bold, large
- **Spacing:** Gap (py-2) **before** image area ← User Request ✓

### Image Area (PROMINENT)
- **Aspect:** 1:1 (square)
- **Border Radius:** 16px
- **Margin:** 12px horizontal (mx-4), 12px vertical (my-3)
- **Background:** Gradient gray-100 → gray-200
- **Shadow:** sm

### Stats Row
- **Layout:** 4 columns, horizontal, centered text
- **Spacing:** Gap 12px between columns
- **Labels:** xs text, gray-500
- **Values:** Small font, color-coded
  - Confidence: **Emerald**
  - Believers: **Blue**
  - Doubters: **Red**
  - Time: **Orange**

### Progress Bar
- **Height:** 2px (h-2)
- **Border Radius:** Full
- **Gradient:** Blue → Cyan

### Action Buttons
```
[✓ Believe]  [✗ Doubt]           [📷 Proof]

Inactive:
  - Background: transparent
  - Text: gray-600
  - Hover: gray-50 background

Active (Believe):
  - Background: emerald-100
  - Text: emerald-700
  - Shadow: sm

Active (Doubt):
  - Background: red-100
  - Text: red-700
  - Shadow: sm
```

### Circle Members (NEW)
```
Members: [A] [P] [R] [S] [+2]
         └─ Overlapping with -space-x-2
```

Each circle:
- Size: 28px
- Border: 2px white
- Gradients: Different for each
- Hover: scale-110

---

## Bottom Navigation

```
┌─────────────────────────────────────────┐
│  🏠      👥      ➕      🏆      👤    │
│ Feed   Circles  Create  Leaderboard Profile
└─────────────────────────────────────────┘

Active Tab:
  - Background: Gradient (emerald → blue)
  - Text: White
  - Shadow: md

Inactive Tab:
  - Background: transparent
  - Text: gray-600
  - Hover: gray-100 background
```

---

## Color Palette

| Color | Usage | Hex/Tailwind |
|-------|-------|-------------|
| **Emerald** | Create Pact, Believe, Primary CTA | `emerald-500` |
| **Blue** | Circle, Leaderboard, Secondary CTA | `blue-500` |
| **Red** | Doubt, Negative action | `red-500` |
| **Orange** | Time remaining | `orange-600` |
| **Purple** | Member avatars | `purple-500` |
| **Pink** | Member avatars | `pink-500` |
| **White** | Backgrounds | `white` |
| **Gray-100** | Borders, hover states | `gray-100` |
| **Gray-500** | Secondary text | `gray-500` |
| **Gray-900** | Primary text | `gray-900` |

---

## Typography

| Element | Font Size | Weight | Line Height |
|---------|-----------|--------|-------------|
| Card Title | 18px (text-lg) | Bold | tight |
| Stats Label | 12px (text-xs) | Medium | - |
| Stats Value | 14px (text-sm) | Bold | - |
| Button Text | 12px (text-xs) | Medium | - |
| Engagement | 12px (text-xs) | Medium | - |

---

## Spacing System

| Element | Space |
|---------|-------|
| Header Padding | 12px (py-3, px-4) |
| Card Padding | 16px (p-4) |
| Section Padding | 12px (py-2) |
| Button Padding | 8px x 10px (py-1 px-2.5) |
| Gap Between Cards | 24px (space-y-6) |
| Image Margin | 12px (mx-4 my-3) |

---

## Interaction States

### Buttons
- **Idle:** Text color
- **Hover:** Light background appear
- **Active:** Colored background + shadow
- **Transition:** All 200ms

### Navigation
- **Inactive:** Icon + label visible
- **Active:** Full gradient background, white text
- **Hover:** Hover effect on inactive tabs

---

## Responsive Design

**Mobile First (375px base):**
- All cards full width with padding
- Bottom nav fixed
- Touch-friendly button sizes (min 44px)
- No horizontal scroll needed

---

## Dark Mode (Future)

Color scheme when dark mode is added:
```
Background: gray-950
Card: gray-900
Text: white
Border: gray-800
Buttons: Same hues, adjusted for dark
```

---

## Accessibility

✓ Color contrast meets WCAG AA  
✓ Touch targets minimum 44px  
✓ Semantic HTML  
✓ Proper button labeling  
✓ SVG icons have alt text  
✓ Focus states visible  

---

## Key Component Code Snippets

### Circular Action Button
```tsx
<button className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white transition-all shadow-sm hover:shadow-md">
  <Plus className="w-5 h-5" />
</button>
```

### Elegant Micro Button (Believe/Doubt)
```tsx
<button className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
  pact.userVote === 'believe'
    ? 'bg-emerald-100 text-emerald-700 shadow-sm'
    : 'text-gray-600 hover:bg-gray-50'
}`}>
  ✓ Believe
</button>
```

### Circle Members Display
```tsx
<div className="flex -space-x-2">
  {memberList.map((member) => (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white hover:scale-110 transition-transform cursor-pointer">
      {member.initial}
    </div>
  ))}
</div>
```

---

## Animation & Transitions

- **Default Transition:** 200ms ease
- **Hover Scales:** scale-110 for member avatars
- **Button States:** Smooth color changes
- **Shadow Transitions:** Subtle depth changes

---

## Design System Usage

This design system is **closed** (not editable by users). All changes require:
1. Design approval
2. Component update
3. Testing on device
4. Push to main branch

Future designers should reference this guide before making changes to maintain consistency.
