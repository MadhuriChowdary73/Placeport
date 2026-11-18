# PlacePort 🎓

> **A login-only placement experience platform exclusively for Amrita Vishwa Vidyapeetham, Amaravati campus students.**

PlacePort lets Amaravati students who have attended placement interviews (selected or not) share organized round-by-round experiences, verified resources, and honest do's and don'ts, so their juniors and peers can prepare better.

🔗 **Live:** _add your Vercel link here_

---

## 🚀 Key Features

### 1. Access and Verified Identity
- **Amaravati-only access**: Sign-in is restricted to `@av.students.amrita.edu` emails through a passwordless magic link. Other domains, including Gmail, are rejected.
- **Login-only**: Every page requires authentication, and nothing is public.
- **Roll number from your college email**: Emails follow the format `av.sc.u4cse2xxxx@av.students.amrita.edu`. The roll number (e.g. `AV.SC.U4CSE24106`), branch and batch year are read from the email, saved to your profile on first login, and cannot be edited.
- **Verified authorship**: Every post shows the author's roll number from their verified profile. Nobody can post under someone else's roll number, and this is enforced in the database.

### 2. Share Your Experience
- Company, role, year, branch, package range (LPA) and outcome (`selected`, `rejected`, `waitlisted`, `no_offer`).
- **Round builder**: Add rounds in any order (Online Assessment, GD, Technical, HR, or your own) and drag them to reorder. Each round has its own details.
- Structured **Do's**, **Don'ts** and **Helpful Resources** (links).
- Overall experience and preparation tips.

### 3. Browse and Learn
- **Feed**: Compact cards showing company, role, outcome, year, branch, package, rounds and a short summary.
- **Detail page** (`/experiences/[id]`): Opens the full experience with every round in order, the do's and don'ts, resources, author and date.
- **Filters**: Search, company, branch, year, outcome, and sort by most recent or most helpful. Filters are kept in the URL, so refreshing the page or sharing a link keeps them.
- **Helpful votes and saves**: Mark posts as helpful and bookmark them for later.

### 4. Roadmap
- Merit badges and a "helped X students" counter
- Company summary pages with common round flows
- Ranked resources catalog
- Report and moderation dashboard for admins
- In-app notifications

> Please don't post confidential company material or question papers covered by an NDA. Share experiences and preparation advice only.

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Styling and UI**: Tailwind CSS v4, shadcn/ui, Lucide Icons
- **Data fetching**: TanStack React Query v5
- **Forms**: React Hook Form + Zod
- **Drag and drop**: @dnd-kit/core and @dnd-kit/sortable
- **Database and Auth**: Supabase (PostgreSQL, Row Level Security, magic link auth)
- **Testing**: Vitest, React Testing Library, Playwright
- **Hosting**: Vercel

---

## 🧱 Architecture

The code is layered so each part has one job:

- **UI components** only render. They never call Supabase directly.
- **`lib/auth`**: An `AuthService` interface with one Supabase implementation, so the auth provider can be swapped in one place.
- **`lib/services`**: `experienceService` and `profileService` are the only files that talk to the database.
- **`lib/validation.ts`**: Email checks and `parseRollNumber()`, which turns an Amrita email into a roll number, branch and batch year.
- **`lib/config.ts`**: Constants such as the allowed email domain and the campus name.
- **`lib/types.ts`**: Shared types (`Experience`, `Round`, `Profile`).

```
placeport/
├── app/               # Routes: login, feed, share, experience detail, auth callback
├── components/        # LoginForm, ExperienceCard, ExperienceDetail, RoundList, RoundEditor, ui/
├── lib/
│   ├── auth/          # AuthService interface + Supabase implementation
│   ├── services/      # experienceService, profileService
│   ├── validation.ts  # email + roll number parsing
│   ├── config.ts      # allowed domain, campus
│   └── types.ts
├── types/             # Generated database types
└── __tests__/         # Unit and e2e tests
```

---

## ⚙️ Getting Started

### 1. Clone and install

```bash
git clone https://github.com/MadhuriChowdary73/Placeport.git
cd Placeport
npm install --legacy-peer-deps
```

### 2. Environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
```

Use the **publishable** (anon) key from Supabase → Project Settings → API Keys. Never put the secret or `service_role` key in this app, and never commit `.env.local`.

### 3. Database setup

Run the SQL setup script in Supabase → **SQL Editor**. It creates:

| Object | Purpose |
|---|---|
| `profiles` | One row per verified student (roll number, branch, batch year) |
| `experiences` | Posts, with rounds, do's, don'ts and resources stored as structured fields |
| `saves` | Bookmarks |
| `helpful_votes` | Helpful votes, which update `helpful_count` through a trigger |
| `experiences_with_author` | A view that adds the author's roll number (no emails exposed) |

### 4. Supabase auth settings

In Supabase → **Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` (use your live link in production)
- **Redirect URLs**: `http://localhost:3000/auth/callback` and `https://your-live-link/auth/callback`

For real use, set up custom SMTP under **Authentication → Emails → SMTP Settings**, because Supabase's built-in email has a low hourly limit.

### 5. Run

```bash
npm run dev      # development at http://localhost:3000
npm test         # unit tests
npm run build    # production build
npm start        # run the production build
```

---

## 🚢 Deployment (Vercel)

1. Push the repo to GitHub.
2. Import it in Vercel and add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables.
3. Deploy, then add the live URL and `/auth/callback` to Supabase's Site URL and Redirect URLs.

---

## 🔒 Security and Privacy

- **Row Level Security** is enabled on every table.
- Only users whose verified email ends with `@av.students.amrita.edu` can create profiles, posts, saves or votes.
- A profile's roll number must match its verified email, which the database checks. Profiles are read-only after creation, so roll numbers can't be changed or spoofed.
- Users can edit or delete only their own posts, and posts are always created for the Amaravati campus.
- The author view runs with the viewer's permissions (`security_invoker`) and exposes no email addresses.
- Anonymous visitors have no access to any data.
