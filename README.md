# yourlifeinweeks

## TLDR

A reminder that life is short — see your life visualized in weeks. Add journal entries + photos to note moments for each week.

## Set up

This project uses [Convex](https://www.convex.dev/) for the backend and [Clerk](https://clerk.com/) for auth so running locally would require accounts there. To start locally, run `npm run dev`, initialize the Convex app, and then add the appropriate env variables for Clerk (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to .env.local and CLERK_JWT_ISSUER_DOMAIN to the Convex environment variables).

# Product improvements

Account: more clear navbar, rename/delete accounts
Views: toggle to certain views (ex: full life, full width, these few weeks, etc)
Command bar: search for moments, search by year/week, override this/next week to align with bday-indexed week
Onboarding: get more info from user to encourage reflection (ex: hopes and dreams), better onboarding of features
QOL: Better grabbing and cursor when holding option
