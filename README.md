README.md

# CirclePact Frontend

Beautiful and modern React/Next.js frontend for CirclePact - the social execution network.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Utility-first CSS
- **Zustand** - Lightweight state management
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful icons
- **React Hot Toast** - Elegant notifications
- **Framer Motion** - Smooth animations

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running on `http://localhost:8000`

### Setup

```bash
# Navigate to frontend directory
cd pact-project-frontend

# Install dependencies
npm install

# Create environment file (optional - already configured)
cp .env.example .env.local

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Project Structure

```
src/
├── app/                  # Next.js app router pages
│   ├── auth/            # Login, Register pages
│   ├── dashboard/       # Main dashboard
│   ├── pacts/          # Pact pages
│   ├── circles/        # Circle pages
│   └── page.tsx        # Home page
├── components/          # Reusable React components
├── services/           # API client and services
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
└── styles/             # Global CSS
```

## Features

✅ User Authentication (Login/Register)
✅ Dashboard with stats and pacts overview
✅ Create and manage Pacts
✅ Circle management
✅ 4-Point Verification system
✅ Wallet management
✅ Shorts feed
✅ Real-time notifications
✅ Responsive design
✅ Beautiful UI with Tailwind CSS

## Available Pages

- `/` - Home page
- `/auth/login` - Login
- `/auth/register` - Register
- `/dashboard` - Main dashboard
- `/pacts` - View all pacts
- `/pacts/create` - Create new pact
- `/pacts/:id` - Pact details
- `/circles` - Circle management
- `/wallet` - Wallet management
- `/shorts` - Shorts feed

## API Integration

The frontend communicates with the backend API at `http://localhost:8000`.

All API calls are centralized in `src/services/api.ts`:
- Authentication services
- Pact services
- Circle services
- Verification services
- Wallet services
- Shorts services

## Authentication

JWT token-based authentication. After login:
1. Token is stored in localStorage
2. Token is automatically included in all API requests
3. Token is cleared on logout

## State Management

Uses Zustand for global state:
- Authentication state
- User data
- Token management

## Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## Deployment

Deploy to Vercel (recommended for Next.js):

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Or use any Node.js hosting (AWS, DigitalOcean, Heroku, etc.)

## Contributing

1. Create feature branch
2. Make changes
3. Test locally
4. Submit pull request

## License

MIT
