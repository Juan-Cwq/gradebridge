# GradeBridge

**The seamless bridge between MagicSchool AI and GradeLink SIS.**

GradeBridge eliminates the painful double data entry that teachers face daily. With one click, sync your AI-generated assignments, rubrics, and grades directly to your gradebook.

## Features

- **One-Click Sync** - Transfer content from MagicSchool AI to GradeLink instantly
- **Smart Mapping** - Intelligent field mapping ensures data lands correctly
- **Time Tracking** - See exactly how many hours you're saving each week
- **Real-Time Status** - Know what synced, when, and catch issues early
- **Secure & Private** - FERPA-compliant, bank-level encryption

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + DaisyUI
- **Animations**: Framer Motion
- **Backend**: Supabase (Auth & Database)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Auth pages (login, signup)
│   ├── (dashboard)/      # Dashboard pages
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/
│   ├── layout/           # Header, Footer, etc.
│   └── ui/               # Reusable UI components
└── lib/
    └── utils.ts          # Utility functions
```

## Available Routes

- `/` - Landing page
- `/login` - Sign in page
- `/signup` - Sign up page
- `/dashboard` - Main dashboard
- `/dashboard/sync` - Sync Hub (one-click sync)
- `/dashboard/settings` - Integration settings
- `/dashboard/help` - Help & FAQ

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

Private - All rights reserved.
