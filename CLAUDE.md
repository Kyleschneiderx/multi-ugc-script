# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HeyGen Bulk Video Generator is a Next.js 15 application that allows users to create multiple HeyGen AI videos at once. It uses Supabase for authentication and database, Stripe for subscription management, and the HeyGen API for video generation.

## Development Commands

```bash
# Development
npm run dev        # Start dev server on http://localhost:3000

# Build & Production
npm run build      # Build for production
npm start          # Start production server

# Linting
npm run lint       # Run ESLint
```

## Environment Setup

Required environment variables (see `.env.example`):
- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Stripe**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_BASIC_PRICE_ID`, `STRIPE_PRO_PRICE_ID`
- **HeyGen**: `HEYGEN_API_KEY`
- **App**: `NEXT_PUBLIC_APP_URL`

## Architecture

### Authentication & Authorization

- **Middleware** (`middleware.ts`): Handles authentication via Supabase SSR
  - Protects `/dashboard/*` routes - redirects unauthenticated users to `/login`
  - Redirects authenticated users from `/login` and `/signup` to `/dashboard`
  - Uses `@supabase/ssr` with cookie-based session management

- **Supabase Clients** (`src/lib/supabase/`):
  - `client.ts`: Browser client for client components
  - `server.ts`: Server client for Server Components and Route Handlers
  - `admin.ts`: Admin client with service role key for privileged operations (usage tracking, subscriptions)

### Database Schema

Defined in `src/types/database.ts` with strongly-typed Supabase client:

- **profiles**: User data with `stripe_customer_id` linking
- **subscriptions**: Stripe subscription status, plan type (basic/pro), and billing periods
- **video_usage**: Monthly video generation tracking per user (year, month, videos_generated)
- **videos**: Complete video history with HeyGen video ID, script, avatar/voice IDs, status, and URLs

All tables use Row Level Security (RLS) policies (defined in `supabase/migrations/001_initial_schema.sql`).

### Subscription & Usage System

- **Stripe Integration** (`src/lib/stripe-client.ts`, `src/app/api/stripe/`):
  - Checkout flow creates sessions with `client_reference_id` for user linking
  - Webhook handler (`api/stripe/webhook/route.ts`) processes subscription events:
    - Creates/updates subscriptions in database
    - Links Stripe customer ID to user profile
    - Handles cancellations
  - Customer portal for subscription management

- **Usage Tracking** (`src/lib/usage-tracker.ts`):
  - `checkUsageLimit()`: Validates if user can generate N videos
  - `incrementUsage()`: Increments monthly counter using upsert with conflict resolution
  - `getRemainingVideos()`: Calculates remaining quota based on plan type
  - Plan limits defined in `src/types/subscription.ts`: Basic (50/month), Pro (500/month)

### HeyGen Integration

- **API Client** (`src/lib/heygen-client.ts`):
  - `fetchAvatarGroups()`: Lists avatar collections
  - `fetchAvatarsInGroup(groupId)`: Gets avatars in a specific group
  - `fetchVoices()`: Lists available voices
  - `createVideo()`: Generates video with avatar, voice, and script
  - `getVideoStatus(videoId)`: Polls for video completion

- **Video Generation Flow**:
  1. User selects avatar, voice, and provides script(s) (single or CSV bulk upload via `react-papaparse`)
  2. Client calls `/api/videos/create` or `/api/videos-bulk`
  3. Route handler validates usage limits via `checkUsageLimit()`
  4. Creates HeyGen video(s) via `createVideo()`, stores in database
  5. Returns video IDs for status polling
  6. Optional webhook endpoint (`/api/heygen/webhook`) for completion notifications

### Type System

All external APIs are strongly typed in `src/types/`:
- `heygen.ts`: Avatar, Voice, VideoStatus interfaces matching HeyGen API
- `subscription.ts`: PlanType enum, plan limits, helper functions
- `video-job.ts`: Internal video job tracking types
- `database.ts`: Supabase table schemas with Row/Insert/Update types

### Route Structure

- `src/app/(auth)/`: Login and signup pages (Next.js route groups)
- `src/app/(dashboard)/`: Protected dashboard pages with shared layout
  - `dashboard/page.tsx`: Main video creator interface
  - `dashboard/library/page.tsx`: Video history
  - `dashboard/settings/page.tsx`: Account settings
- `src/app/api/`: API Route Handlers
  - `auth/`: Authentication endpoints
  - `stripe/`: Subscription management
  - `avatars/`, `voices/`: HeyGen resource fetching
  - `videos/`: Video creation and status
  - `usage/`: Usage tracking and limits

### Custom Hooks

Located in `src/hooks/`:
- `useUser()`: Session management and user data
- `useAvatars()`, `useVoices()`: Fetch and cache HeyGen resources
- `useVideos()`: Video library management
- `useUsage()`: Real-time usage tracking display

## Key Patterns

1. **Always use admin client for usage tracking**: The `usage-tracker.ts` functions require the admin client to bypass RLS when incrementing counters and checking limits server-side.

2. **Three client types**: Browser client for client components, server client for Server Components, admin client for privileged operations. Never use admin client in client components.

3. **Type assertions for Supabase queries**: TypeScript requires `(supabase.from('table') as any)` when using tables defined in Database type due to current Supabase SDK limitations.

4. **Usage validation before video creation**: Always call `checkUsageLimit()` before creating videos to prevent over-generation.

5. **CSV parsing**: Use `react-papaparse` for client-side CSV upload, validated via `src/lib/csv-parser.ts`.

6. **Path aliases**: Use `@/*` to import from `src/*` (configured in `tsconfig.json`).

## Database Migrations

SQL migrations are in `supabase/migrations/`. When modifying schema:
1. Create new migration file with timestamp prefix
2. Include both DDL and RLS policies
3. Update `src/types/database.ts` to match schema

## Stripe Webhook Testing

For local development:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` in `.env.local`.

## Common Issues

- **"Type instantiation is excessively deep"**: Use `as any` type assertion on Supabase queries for complex types
- **Middleware redirects**: Ensure paths match the `matcher` config in `middleware.ts`
- **Admin client in browser**: Never import or use `admin.ts` in client components - it exposes service role key
- **Usage not incrementing**: Verify `increment_video_usage` RPC exists in database or fallback logic in `usage-tracker.ts` will handle it

Claude Code Rules:
1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information.
8. DO NOT BE LAZY. NEVER BE LAZY. IF THERE IS A BUG FIND THE ROOT CAUSE AND FIX IT. NO TEMPORARY FIXES. YOU ARE A SENIOR DEVELOPER. NEVER BE LAZY
9. MAKE ALL FIXES AND CODE CHANGES AS SIMPLE AS HUMANLY POSSIBLE. THEY SHOULD ONLY IMPACT NECESSARY CODE RELEVANT TO THE TASK AND NOTHING ELSE. IT SHOULD IMPACT AS LITTLE CODE AS POSSIBLE. YOUR GOAL IS TO NOT INTRODUCE ANY BUGS. IT'S ALL ABOUT SIMPLICITY


CRITICAL: When debugging, you MUST trace through the ENTIRE code flow step by step. No assumptions. No shortcuts.