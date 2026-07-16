# Job Tracker

An AI-powered job application tracker. Log every application, manage your pipeline with a Kanban board, and use AI to generate cover letters, interview prep, follow-up emails, and resume feedback tailored to each role.

**Live demo:** _add your Vercel URL here_

## Features

- **Auth** — sign up / sign in with Clerk
- **Application tracking** — table and Kanban views across Applied, Phone Screen, Interview, Offer, Rejected
- **AI tools** (Groq / Llama 3.3 70B) — generate a cover letter, interview prep questions, or a follow-up email for any application; get resume-optimization feedback matched to a specific job description
- **Resume upload** — parses an uploaded PDF resume so the AI tools can personalize output
- **Analytics** — response rate, offer rate, and pipeline trends over time
- **Dark mode** and a responsive mobile layout

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

3. Push the Prisma schema to your database:

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
  dashboard/                      # Table + Kanban views, resume upload
  analytics/                      # Response/offer rate charts
  api/applications/                # CRUD for applications
  api/applications/[id]/ai/       # AI generation endpoint (cover letter, prep, follow-up, optimize)
  api/resume/                     # Resume upload/parsing
prisma/schema.prisma               # Application & Resume models
```
