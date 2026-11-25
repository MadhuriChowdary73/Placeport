<div align="center">

# PlacePort

### Campus placement intelligence, crowdsourced and structured.

Round-by-round interview experiences from students who actually sat the process, built for **Amrita Vishwa Vidyapeetham, Amaravati campus**.

[![Live](https://img.shields.io/badge/live-placeport--lime.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://placeport-lime.vercel.app/)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth%20%2B%20RLS-3ECF8E?logo=supabase&logoColor=white)
![Tests](https://img.shields.io/badge/tests-Vitest%20%2B%20Playwright-6E9F18)

</div>

---

## Table of Contents

- [Why PlacePort](#why-placeport)
- [Features](#features)
- [Architecture](#architecture)
- [Authentication](#authentication)
- [Security and Privacy](#security-and-privacy)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Scripts](#scripts)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Author](#author)

---

## Why PlacePort

Placement knowledge on campus lives in WhatsApp forwards and memory. PlacePort gives anyone who has faced an interview (selected or not) a structured place to document the rounds, the questions, what worked, what to avoid, and which resources helped, so the next batch prepares with signal instead of noise.

It is not a senior-to-junior mentoring model. Every experience is first-class.

> Please do not post confidential company material or NDA-covered question papers. Share experiences and preparation advice only.

## Features

**Sharing**
- Structured posts: company, role, year, branch, package range (LPA) and outcome.
- **Round builder** with drag-and-drop ordering (`@dnd-kit`). Contributors define rounds in their own order, so pipelines that start with a GD or an online assessment are represented accurately.
- Do's, don'ts, helpful resource links, overall experience and preparation tips.

**Discovery**
- Feed of experience cards with a branch filter and sorting in the UI. The posts API also supports `company`, `year`, `role` and `outcome` filters, and filters live in the URL so links are shareable.
- Full detail page per experience (`/experiences/[id]`) showing every round in order.
- Company pages with an aggregated summary (`/company/[slug]`).
- Resources catalogue, saved posts, and contributor profile pages.

**Community**
- Helpful votes and bookmarks.
- Contributor badges and in-app notifications.
- Contributors choose how they appear: by **roll number** (masked, e.g. `AV.SC.U4CSE24XXX`) or by name, so people who prefer privacy can still contribute.

**Moderation (admin)**
- Admin console to manage roll numbers and users, review user reports, hide or delete posts, manage users and reset passwords.

## Architecture

```mermaid
flowchart LR
    B[Browser] --> M[Next.js middleware<br/>session + route guard]
    M --> P[App Router pages<br/>React 19 + TanStack Query]
    P --> API[Route Handlers /api/*]
    API --> SVC[lib/services]
    SVC --> SB[(Supabase<br/>Postgres + Auth + RLS)]
    API -. admin only .-> SR[Service-role client<br/>server-side]
    SR --> SB
```

- **UI components** render only; data access goes through hooks and route handlers.
- **`lib/services`** (`experienceService`, `profileService`, `rollNumberService`) are the layer that talks to the database.
- **`lib/auth`** exposes an `AuthService` interface with a Supabase implementation, so the provider can be swapped in one place.
- **Validation** uses Zod schemas (`lib/validations`) shared between forms and API routes.
- **Mock mode:** when Supabase variables are missing or contain `placeholder`, the app falls back to an in-memory store (`lib/mockStore.ts`) so you can run the UI locally with no backend.

## Authentication

Students sign in with **Google (OAuth 2.0)**, handled by Supabase Auth. There are no passwords or magic links in the student flow.

```mermaid
sequenceDiagram
    participant S as Student
    participant App as Next.js App
    participant G as Google OAuth 2.0
    participant SB as Supabase Auth
    S->>App: Click "Continue with Google"
    App->>SB: signInWithOAuth(provider: google)
    SB->>G: Redirect to Google consent screen
    G-->>SB: Authorization code
    SB-->>App: Redirect to /api/auth/callback?code=...
    App->>SB: exchangeCodeForSession(code)
    App->>SB: Upsert profile (roll number, branch, batch)
    App-->>S: Redirect to /feed
```

- The **callback route** (`app/api/auth/callback/route.ts`) exchanges the code for a session and upserts the student's profile.
- For Amrita student emails (e.g. `av.sc.u4cse24106@av.students.amrita.edu`), the **roll number, branch and batch year are parsed from the email**.
- The **admin** is identified by `ADMIN_EMAIL` and gets the `admin` role.
- A separate email/password sign-in exists only for the admin console at `/admin/login`.

## Security and Privacy

- **Row Level Security** is enabled on the core tables created by the setup scripts, so authorization is enforced in the database, not just the UI.
- Users can edit or delete only their own content.
- Sensitive operations (admin users, roll numbers, moderation) run in server route handlers using the service-role key, which is **never exposed to the browser**.
- Admin login and the legacy credential endpoints are **rate limited**. The Google sign-in flow is not rate limited by the app.
- Blocked users cannot publish, and the admin can suspend accounts.
- Student identity comes from Google, so no student passwords are stored by the app.

> **Note:** the rate limiter is in-memory, so on serverless platforms the limit applies per instance. Use a shared store (e.g. Redis) if you need strict global limits.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling / UI | Tailwind CSS v4, shadcn/ui (Radix + Base UI), Lucide, Sonner |
| Data fetching | TanStack Query v5 |
| Forms / validation | React Hook Form + Zod |
| Drag and drop | dnd-kit |
| Backend | Supabase (PostgreSQL, Auth, RLS) |
| Testing | Vitest, Testing Library, Playwright |
| Hosting | Vercel |

## Getting Started

**Prerequisites:** Node.js 20+, npm, and a Supabase project (optional for a UI-only run thanks to mock mode).

```bash
git clone https://github.com/MadhuriChowdary73/Placeport.git
cd Placeport
npm install        # .npmrc already sets legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-publishable-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>   # server only, required for admin routes
```

> Never commit `.env.local`, never prefix the service-role key with `NEXT_PUBLIC_`, and never expose it to the client.

## Google OAuth Setup

1. In [Google Cloud Console](https://console.cloud.google.com/), create an **OAuth 2.0 Client ID** (type: Web application).
2. Add Supabase's callback URL as an authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`.
3. In Supabase, go to **Authentication → Providers → Google**, enable it, and paste the Client ID and Client Secret.
4. In **Authentication → URL Configuration**, set the Site URL and add `http://localhost:3000/api/auth/callback` and `https://placeport-lime.vercel.app/api/auth/callback` to the redirect URLs.

## Database Setup

1. Create a project in the [Supabase dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor** and run `supabase/complete_setup.sql`. It creates the core tables, the helpful-vote trigger, and the RLS policies. Apply the `migration_*.sql` files if your database predates them.

   > **Known gap:** the SQL scripts cover only the core tables (`profiles`, `experiences`, `rounds`, `saves`, `helpful_votes`). Parts of the app also query `posts`, `companies`, `resources`, `dos_donts`, `votes`, `notifications`, `reports`, `badges`, `user_badges`, `round_types` and `valid_roll_numbers`, which are not created by any script in the repo. Add them to the setup SQL before a fresh deployment will fully work.
3. Set `ADMIN_EMAIL` in `lib/config.ts` to the Google account that should have admin access.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (webpack) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |

## Testing

- **Unit:** `__tests__/` (Vitest + Testing Library, jsdom).
- **E2E:** `e2e/auth.spec.ts` (Playwright).

## Project Structure

```
placeport/
├── app/
│   ├── (app)/          # feed, experiences, company, post, profile, resources, saved, notifications
│   ├── (auth)/         # login
│   ├── admin/          # admin login + reports, roll-numbers, users
│   └── api/            # route handlers: auth, posts, votes, saves, badges, reports, admin/*
├── components/         # auth, experience, post, ui (shadcn)
├── lib/
│   ├── auth/           # AuthService interface + Supabase implementation
│   ├── services/       # experience, profile, rollNumber
│   ├── supabase/       # browser + server clients
│   ├── validations/    # Zod schemas
│   ├── config.ts       # campus, branches, batch years, admin email
│   ├── rateLimit.ts
│   └── mockStore.ts    # in-memory fallback when Supabase is not configured
├── supabase/           # SQL setup and migrations
├── types/              # database types
├── __tests__/  e2e/    # tests
└── middleware.ts       # session refresh + route protection
```

## Deployment

Deployed on **Vercel**.

1. Import the GitHub repo in Vercel.
2. Add the three environment variables under **Project Settings → Environment Variables**.
3. Deploy. Pushes to `main` ship to production and every branch gets a preview URL.

## Roadmap

- [ ] Shared-store rate limiting for serverless
- [ ] Full-text search across companies, roles and keywords
- [ ] Richer per-company analytics (common rounds, frequent topics)
- [ ] Multi-campus support

## Contributing

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Commit with [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m "feat: add your feature"`
3. Run `npm run lint && npm test` before opening a PR.

## Author

**Madhuri Chowdary** · B.Tech CSE, Amrita Vishwa Vidyapeetham, Amaravati
[GitHub](https://github.com/MadhuriChowdary73)
