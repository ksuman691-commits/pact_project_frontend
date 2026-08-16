> **⚠️ DEPRECATED / HISTORICAL — DO NOT USE AS A REFERENCE.**
> This lavender/white neumorphic system was superseded by the violet dark
> system (`--pact-*` tokens defined in `globals.css`). The `DesignTokens.tsx`
> file that once hardcoded this palette as exported Tailwind classes has
> been deleted (it had zero remaining imports). Kept only as a historical
> record. For current design guidance, use the `--pact-*` tokens directly.

# Soft Neumorphic Design System Implementation (DEPRECATED)

## Overview
CirclePact has been completely redesigned with a modern "soft neumorphic SaaS" design language. This document outlines all design system changes, color palette, and implementation details.

## Design System Applied

### Color Palette
All colors use custom CSS variables and Tailwind classes for consistency:

**Base Colors:**
- `bg-[#F4F2FB]` - Lavender-tinted page background (never pure white)
- `bg-white` - Card surfaces
- `bg-[#FAF9FE]` - Nested/secondary panels

**Accent Colors:**
- `bg-[#A78BFA]` - Primary purple (buttons, active states, progress bars)
- `hover:bg-[#9270F5]` - Primary purple hover
- `bg-[#EDE9FE]` - Light purple fill (tags, badges)

**Text Colors:**
- `text-[#14121F]` - Near-black primary text
- `text-[#6B7280]` - Muted secondary gray
- `text-[#9CA3AF]` - Light tertiary gray

**Status Colors:**
- `bg-[#FDECC8] text-[#92622A]` - Warning (yellow pill)
- `bg-[#DBEAFE] text-[#1E40AF]` - Info (blue pill)
- `bg-[#FBD5E8] text-[#9D2B6B]` - Pink/urgent (pink pill)
- `bg-[#D9F2E3] text-[#1B7A46]` - Success (green pill)

**Borders:**
- `border-[rgba(20,18,31,0.06)]` - Hairline separator (used sparingly)

### Elevation & Shape

**Cards:**
- Border radius: `rounded-[28px]` (large and modern)
- Shadow: `shadow-[0_8px_24px_rgba(94,84,142,0.08),0_2px_6px_rgba(94,84,142,0.04)]`
- NO visible borders - shadow provides all depth
- Padding: `p-6` (generous internal spacing)

**Buttons:**
- Primary: Pill-shaped (`rounded-full`), purple background, white text
- Secondary: Light purple fill, dark text, subtle border
- Ghost: Transparent with hover background

**Icon Buttons:**
- Perfect circles, 44-48px
- Default: White background with soft shadow
- Active: Dark background (`bg-[#14121F]`) with white icon (signature detail)

**Status/Stage Pills:**
- Pill-shaped (`rounded-full`), small text (12-13px)
- Colored soft-background + darker text of same hue
- Optional small number badge attached

**Avatars:**
- Perfect circles with 2px white ring when overlapping
- Small purple dot badge (top-right) for online status

**Progress Bars:**
- Height: 6-8px, fully rounded ends
- Track: Light purple `bg-[#EDE9FE]`
- Fill: Primary purple `bg-[#A78BFA]`

### Typography

**Hierarchy:**
- Headings: Semibold/bold, `text-[#14121F]`, tight line-height
- Body: Regular weight, `text-[#14121F]`, relaxed line-height (1.5-1.6)
- Meta/secondary: `text-[#6B7280]`, smaller size, regular weight

**Stat Numbers:**
- Extra large: 4-5xl size, bold weight
- Label below: Smaller size (sm), muted color
- Creates visual hierarchy and emphasis

### Layout Rhythm

- Generous padding inside cards: 24-32px
- Consistent gap between stacked cards: 16-20px
- Background always lavender base - never flat white
- White cards visibly "float" above background
- Search bars: Pill-shaped, light gray-lavender fill, no border
- Icon inline left in inputs

### Interaction Details

**Hover/Press States:**
- Scale-down animation: `active:scale-[0.98]`
- Shadow softening rather than color inversion
- Maintains "soft/tactile" feel

**Favorites/Actions:**
- Star icons in small circular white chip, top-right corner
- Overlaps card edge slightly
- Multi-select avatar stacks end with "+N" chip

## Files Updated

### CSS Foundation (`src/styles/globals.css`)
- New CSS custom properties for all design tokens
- Component utility classes: `.card`, `.btn-primary`, `.badge`, etc.
- Typography scales and heading styles
- Responsive shadow and spacing utilities

### Design Tokens Component (`src/components/DesignTokens.tsx`)
- Centralized design token constants
- Quick reference for developers
- Helper function for combining classes

### Layout & Navigation
- `src/app/layout.tsx` - Updated background to lavender base
- `src/components/BottomNav.tsx` - Redesigned with circular icon buttons, dark circle active state
- `src/components/Navbar.tsx` - Updated colors and borders
- `src/components/PageWrapper.tsx` - Proper background colors
- `src/components/TopNav.tsx` - Consistent styling

### All Pages Updated (21 pages)
- `/app/feed/page.tsx`
- `/app/home/page.tsx`
- `/app/profile/page.tsx`
- `/app/profile/edit/page.tsx`
- `/app/profile/[username]/page.tsx`
- `/app/pacts/page.tsx`
- `/app/pacts/[id]/page.tsx`
- `/app/pacts/create/page.tsx`
- `/app/circles/page.tsx`
- `/app/circles/[id]/page.tsx`
- `/app/circles/create/page.tsx`
- `/app/dares/page.tsx`
- `/app/dares/[id]/page.tsx`
- `/app/wallet/page.tsx`
- `/app/notifications/page.tsx`
- `/app/auth/login/page.tsx`
- `/app/auth/register/page.tsx`
- And all component files

## Changes Applied (Bulk Updates)

1. **Color Replacements:**
   - `bg-slate-50` → `bg-[#F4F2FB]`
   - `bg-slate-100` → `bg-[#FAF9FE]`
   - `text-slate-900` → `text-[#14121F]`
   - `text-slate-600` → `text-[#6B7280]`
   - `text-slate-500` → `text-[#9CA3AF]`
   - `bg-emerald-600` → `bg-[#A78BFA]`
   - `bg-emerald-50` → `bg-[#EDE9FE]`

2. **Rounded Corners:**
   - `rounded-lg` → `rounded-[28px]`
   - `rounded-xl` → `rounded-[24px]`

3. **Borders:**
   - `border-slate-200` → `border-[rgba(20,18,31,0.06)]`
   - `border-slate-100` → `border-[rgba(20,18,31,0.06)]`

4. **Shadows:**
   - `shadow-sm` → `shadow-[0_4px_12px_rgba(94,84,142,0.08)]`

## Design Consistency Checklist

- Lavender background on all pages
- White card surfaces with proper shadows
- Purple accent colors for primary actions
- Soft status pill badges (not saturated fills)
- Circular nav icons with dark circle active state
- Generous spacing (24-32px card padding, 16-20px between cards)
- Proper text hierarchy with stat numbers
- Smooth hover/press animations
- NO visible card borders - shadow only
- Ring accents on avatars when stacked
- Proper focus states on inputs (ring-2 ring-[#A78BFA])

## Testing

Build verification: ✓ Successful
All pages prerendered: ✓ Static content generated
All routes accessible: ✓ No compilation errors
File count: 21 pages updated, 30+ components updated

## Next Steps

1. Deploy to staging/preview
2. Test on mobile devices (primary viewport: max-w-md)
3. Verify all interactions and hover states
4. Check accessibility (contrast ratios, focus states)
5. Test on different browsers

## Notes

- The design maintains all existing functionality
- No component structure or routing changes
- Pure visual/style redesign
- All data and copy remains unchanged
- Ready for production deployment
