// Sample data used to render the mobile dashboard design.
// Shapes mirror the API types so it can be swapped for live data later.

export interface DashGoal {
  id: number
  title: string
  circle: string
  progress: number // 0-100
  daysLeft: number
  color: 'emerald' | 'amber' | 'sky' | 'rose'
}

export interface DashCircle {
  id: number
  name: string
  members: number
  isOwner: boolean
  color: string
}

export interface DashActivity {
  id: number
  user: string
  initials: string
  action: string
  goal: string
  time: string
  photo?: string
  cheers: number
}

export interface DashAnnouncement {
  id: number
  circle: string
  owner: string
  title: string
  time: string
  joined: number
}

export const currentUser = {
  name: 'Maya',
  fullName: 'Maya Chen',
  initials: 'MC',
  reputation: 92,
  streak: 14,
  // last 7 days completion (Mon-Sun)
  week: [true, true, true, false, true, true, true],
}

export const stats = {
  activePacts: 4,
  circles: 3,
  completed: 27,
}

export const goals: DashGoal[] = [
  { id: 1, title: 'Run 5km every morning', circle: 'Morning Movers', progress: 72, daysLeft: 6, color: 'emerald' },
  { id: 2, title: 'Read 20 pages a day', circle: 'Book Club', progress: 45, daysLeft: 12, color: 'sky' },
  { id: 3, title: 'No sugar for 30 days', circle: 'Clean Eats', progress: 88, daysLeft: 4, color: 'amber' },
  { id: 4, title: 'Ship the side project', circle: 'Builders', progress: 30, daysLeft: 18, color: 'rose' },
]

export const circles: DashCircle[] = [
  { id: 1, name: 'Morning Movers', members: 8, isOwner: true, color: 'bg-emerald-500' },
  { id: 2, name: 'Book Club', members: 12, isOwner: false, color: 'bg-sky-500' },
  { id: 3, name: 'Clean Eats', members: 6, isOwner: false, color: 'bg-amber-500' },
]

export const announcements: DashAnnouncement[] = [
  {
    id: 1,
    circle: 'Morning Movers',
    owner: 'You',
    title: 'New pact: 7-day sunrise run challenge',
    time: '2h ago',
    joined: 5,
  },
  {
    id: 2,
    circle: 'Book Club',
    owner: 'Devon',
    title: 'New pact: Finish "Atomic Habits" by Friday',
    time: '5h ago',
    joined: 9,
  },
]

export const activity: DashActivity[] = [
  {
    id: 1,
    user: 'Priya',
    initials: 'PS',
    action: 'completed',
    goal: 'Morning 5km run',
    time: '12m ago',
    cheers: 14,
  },
  {
    id: 2,
    user: 'Marcus',
    initials: 'MJ',
    action: 'crushed a workout for',
    goal: 'Gym 4x a week',
    time: '1h ago',
    cheers: 9,
  },
  {
    id: 3,
    user: 'Aisha',
    initials: 'AK',
    action: 'hit her daily',
    goal: 'Read 20 pages',
    time: '3h ago',
    cheers: 22,
  },
  {
    id: 4,
    user: 'Leo',
    initials: 'LR',
    action: 'logged a clean',
    goal: 'No sugar meal prep',
    time: '6h ago',
    cheers: 7,
  },
]
