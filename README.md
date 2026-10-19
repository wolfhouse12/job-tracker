# Job Tracker

An AI-powered job application tracker. Log every application, manage your pipeline with a Kanban board, and use AI to generate cover letters, interview prep, follow-up emails, and resume feedback tailored to each role.

**Live demo:** [job-tracker-eosin-two.vercel.app](https://job-tracker-eosin-two.vercel.app/)

## Features

- **Auth** — sign up / sign in with Clerk
- **Application tracking** — table and Kanban views across Applied, Phone Screen, Interview, Offer, Rejected
- **AI tools** (Groq / Llama 3.3 70B) — generate a cover letter, interview prep questions, or a follow-up email for any application; get resume-optimization feedback matched to a specific job description
- **Multiple resumes** — upload several resumes (PDF or pasted text, e.g. "English CV" and "Hebrew CV"), record which one you sent with each application, and the AI tools use that resume for that job
- **Analytics** — response rate, offer rate, and pipeline trends over time
- **Dark mode** and a responsive mobile layout
- **Account deletion** — one button removes the account, every application and every resume
- **Privacy page** at `/privacy` covering what is stored, what is sent to the AI provider, and cookies

## Security

- **The server decides who you are.** Every API route reads the user from the Clerk session on the server and filters every query by that `userId`, so changing an id in a request can't reach another user's data. Linking a resume to an application also checks that the resume belongs to the caller.
- **Input is validated on the server:** only known fields are accepted, status must be a real status, text fields have length limits, and uploads must actually be PDFs (checked by file signature, not file name).
- **Database tables are locked.** Supabase exposes `public` tables through its REST API; this app doesn't use that API, so [`prisma/sql/lock-tables.sql`](prisma/sql/lock-tables.sql) enables row-level security and revokes all access from the API roles. Prisma connects as the table owner and is unaffected.
- **No secrets in the browser.** Only the Clerk publishable key is public (it's designed to be). Database, Clerk secret and Groq keys are server-only, and error responses never include provider error details.
- **Sign-out and deletion end the session on Clerk's servers**, not just in the browser.
- Security headers (`X-Frame-Options`, `nosniff`, HSTS, `Referrer-Policy`, `Permissions-Policy`) are set in `next.config.ts`.

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com)
- [Prisma 7](https://www.prisma.io) + PostgreSQL ([Supabase](https://supabase.com))
- [Clerk](https://clerk.com) for authentication
- [Groq SDK](https://groq.com) (Llama 3.3 70B) for AI generation
- [Recharts](https://recharts.org) for analytics charts
- [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) for the Kanban board
- [unpdf](https://github.com/unjs/unpdf) for resume PDF parsing
- Deployed on [Vercel](https://vercel.com)

## Getting started

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` with:

   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/dashboard

   DATABASE_URL=
   DIRECT_URL=
   GROQ_API_KEY=
   ```

3. Push the Prisma schema to your database, then lock the tables (Supabase → SQL Editor → run `prisma/sql/lock-tables.sql`):

   ```bash
   npx prisma db push
   ```

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/app/
  page.tsx                        # Landing page
  dashboard/                      # Table + Kanban views, resume manager
  analytics/                      # Response/offer rate charts
  api/applications/               # CRUD for applications
  api/applications/[id]/ai/       # AI generation endpoint (cover letter, prep, follow-up, optimize)
  api/resume/                     # Resume list + upload/parsing
  api/resume/[id]/                # Delete a single resume
  api/account/                    # Delete the account and all its data
  privacy/                        # Privacy & cookies page
src/lib/validation.ts              # Server-side input validation
prisma/schema.prisma               # Application & Resume models
```
