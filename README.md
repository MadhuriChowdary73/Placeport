# PlacePort (PlacementHub) 🎓

> **A login-only placement interview sharing platform exclusively for Amrita Vishwa Vidyapeetham students.**

PlacePort allows Amrita students who have attended placement interviews (both selected and rejected) to share organized suggestions, interview flow timelines, verified resources, and authentic do's & don'ts to help fellow students prepare better.

---

## 🚀 Key Features

### 1. Access & Identity Protection
- **Exclusive Domain Access**: Strictly restricted to `@cb.students.amrita.edu` (configurable via `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN`) with magic link / OTP verification.
- **Login-Only Perimeter**: Every single route requires authentication; nothing is public or indexable by search engines.
- **Roll Number Display Modes**: Contributors choose how they appear on posts:
  - `full`: Shows full roll number (e.g. `CB.EN.U4CSE21001`)
  - `masked`: Automatically masks digits (e.g. `CB.EN.U4CSE21XXX`)
  - `anon`: Anonymous handle (e.g. `@silentcoder`)
- **Privacy Enforcement**: Roll numbers are stripped at the database/view layer (`posts_public`). Only verified admins can view real identities.

### 2. Interview Flow Builder
- Add any combination of rounds: **OA, GD, Aptitude, Coding, Technical, Case Study, Managerial, HR, or Custom**.
- **Drag-to-Reorder**: Interactive drag-and-drop timeline powered by `@dnd-kit`.
- Per-round metadata: Questions asked, difficulty rating (1–5), duration in minutes, and actionable tips.
- Structured lists for **Do's & Don'ts** and **Useful Resources** (URL + note).
- Single-line summary advice: *"If I were you, I'd..."*

### 3. Browsing & Company Insights
- **Multi-parameter Filtering**: Filter by company, year, role, campus, branch, outcome (`selected`, `rejected`, `waitlisted`), and sort by **Most Helpful** or **Newest**.
- **Company Summary Pages**: Aggregate view of company interview flows, computed top common round sequences, top do's/don'ts, and top preparation resources.
- **Ranked Resources**: Central repository of student-vetted interview resources ranked by helpful votes.
- **Personal Bookmarks**: Save posts to your personal list for quick offline revision.

### 4. Motivation & Gamification (Anti-Spam)
- **"Helped X Students" Counter**: Counts unique users who marked a post helpful or bookmarked it.
- **Merit Badges** (awarded on helpful impact, not post count):
  - 🏆 **First Post**: Shared first interview experience.
  - 💪 **Rejection Lessons**: Helpful advice on a rejected interview outcome (≥ 5 helpful votes).
  - 📚 **Resource Hero**: Post with 5+ resources and ≥ 10 helpful votes.
  - 🏢 **Company Expert**: 3+ detailed experiences for the same company.
  - ⭐ **Top Helper**: Helped 50+ unique students across posts.
  - ✨ **Fresh Insight**: First post for a company in the active placement year.
- **Milestone Notifications**: In-app notifications when reaching helpfulness milestones and receiving badges.

### 5. Moderation & Trust
- In-app **Report Dialog** on all posts.
- **Admin Review Dashboard**: Dedicated `/admin/reports` to inspect flagged content and resolve/dismiss or delete posts.
- **User Role Management**: Dedicated `/admin/users` to view real roll numbers and manage admin privileges.
- Built-in reminder against posting confidential or NDA-violating question papers.

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Styling & UI**: Tailwind CSS v4, shadcn/ui, Lucide Icons
- **State & Data Fetching**: TanStack React Query v5
- **Form Management**: React Hook Form + Zod
- **Drag & Drop**: @dnd-kit/core & @dnd-kit/sortable
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security & Triggers)
- **Testing**: Vitest, React Testing Library, Playwright
- **CI/CD**: GitHub Actions

---

## 📁 Project Structure

```
placeport/
├── app/
│   ├── (auth)/
│   │   └── login/                  # Amrita email OTP / Magic link
│   ├── (app)/
│   │   ├── layout.tsx              # Authenticated shell & navigation
│   │   ├── feed/                   # Main placement experiences feed
│   │   ├── post/
│   │   │   ├── new/                # Interactive submission + flow builder
│   │   │   └── [id]/               # Experience detail with timeline
│   │   ├── company/[slug]/         # Company aggregate view & common flow
│   │   ├── resources/              # Ranked resources catalog
│   │   ├── saved/                  # Saved / bookmarked posts
│   │   ├── profile/[handle]/       # Contributor profile & badges
│   │   └── notifications/          # Milestone & badge notifications
│   ├── admin/
│   │   ├── layout.tsx              # Admin-only route guard
│   │   ├── reports/                # Report review dashboard
│   │   └── users/                  # User identity & role management
│   └── api/                        # Next.js Route Handlers
│       ├── posts/
│       ├── companies/
│       ├── votes/
│       ├── saves/
│       ├── resources/
│       ├── badges/
│       ├── reports/
│       ├── notifications/
│       └── admin/
├── components/
│   ├── post/
│   │   ├── FlowBuilder.tsx         # Drag-to-reorder round builder
│   │   ├── RoundTimeline.tsx       # Timeline visualizer
│   │   ├── PostCard.tsx            # Feed card
│   │   ├── PostFilters.tsx         # Multi-criteria filter controls
│   │   └── PostActions.tsx         # Vote, save, report modal
│   └── ui/                         # shadcn UI components
├── lib/
│   ├── supabase/                   # SSR & browser Supabase clients
│   ├── validations/                # Zod schemas for auth & posts
│   ├── hooks/                      # TanStack query hooks
│   └── utils.ts                    # Roll number masking, CTC & date helpers
├── supabase/
│   ├── migrations/                 # Full SQL schema, RLS, triggers & views
│   └── seed.sql                    # Initial seed data for companies
└── e2e/ & __tests__/               # Playwright & Vitest test suites
```

---

## ⚙️ Getting Started

### 1. Environment Setup

Copy `.env.local.example` to `.env.local` inside `placeport/`:

```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN=cb.students.amrita.edu
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Database Migration

Run the SQL migration in `supabase/migrations/001_initial_schema.sql` inside your Supabase project dashboard (SQL Editor) or via the Supabase CLI:

```bash
supabase db push
```

### 3. Install & Run

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run unit tests
npm test

# Build for production
npm run build

# Start production server
npm start
```

---

## 🔒 Security & Privacy Architecture

- **Row Level Security (RLS)** is enabled on all tables (`posts`, `rounds`, `dos_donts`, `resources`, `votes`, `saves`, `profiles`, `reports`, `notifications`).
- Unauthenticated requests are rejected by Edge Middleware before reaching application code.
- Public views (`posts_public`) automatically apply string masking: `regexp_replace(roll_number, '[0-9]{3}$', 'XXX')` or `@handle` depending on user preference.
- Real identities and raw roll numbers are accessible **only** to accounts with `role = 'admin'` via protected routes.
