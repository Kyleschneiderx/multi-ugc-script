# HeyGen Bulk Video Generator

A Next.js web application for creating multiple HeyGen AI videos at once with Supabase authentication and Stripe subscriptions.

## 🚀 Progress Update

### ✅ Completed

- ✅ Next.js 15 project setup with TypeScript and Tailwind CSS
- ✅ All dependencies installed (Supabase, Stripe, react-papaparse, etc.)
- ✅ Complete folder structure created
- ✅ TypeScript type definitions (Database, HeyGen API, Subscriptions, Video Jobs)
- ✅ Supabase client utilities (browser, server, admin)
- ✅ Authentication pages (signup and login)
- ✅ Auth callback route
- ✅ Middleware for route protection
- ✅ useUser hook for session management
- ✅ Basic dashboard placeholder

### 🔧 Environment Variables Set

Your `.env.local` has been partially configured with:
- ✅ Stripe Publishable Key
- ✅ Stripe Secret Key
- ✅ Supabase URL

### 🚨 Still Need to Configure

To complete the setup and start the application, you need:

#### 1. Supabase Setup

1. Go to your Supabase project: https://supabase.com/dashboard/project/orcerspwqjkkfheegidm

2. **Get API Keys**:
   - Go to **Settings** > **API**
   - Copy the **anon/public key** → Add to `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy the **service_role key** → Add to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

3. **Run Database Migration**:
   - Go to **SQL Editor**
   - Copy the schema from `supabase/migrations/001_initial_schema.sql` (will be created next)
   - Run the SQL to create tables: `profiles`, `subscriptions`, `video_usage`, `videos`

4. **Enable Email Auth**:
   - Go to **Authentication** > **Providers**
   - Ensure **Email** provider is enabled
   - Set **Site URL** to `http://localhost:3000`
   - Add **Redirect URLs**: `http://localhost:3000/api/auth/callback`

#### 2. Stripe Setup

1. Go to **Products** in your Stripe Dashboard
2. Create two subscription products:
   - **Basic Plan**: $99/month recurring
     - Copy the **Price ID** (starts with `price_`) → Add to `.env.local` as `STRIPE_BASIC_PRICE_ID`
   - **Pro Plan**: $599/month recurring
     - Copy the **Price ID** → Add to `.env.local` as `STRIPE_PRO_PRICE_ID`

3. For webhooks (local development):
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe

   # Login and forward webhooks
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook

   # Copy the webhook secret from the output → Add to .env.local as STRIPE_WEBHOOK_SECRET
   ```

#### 3. HeyGen API

Add your HeyGen API key to `.env.local`:
```
HEYGEN_API_KEY=your_heygen_api_key_here
```

## 🏃 Running the Application

Once you've completed the setup above:

```bash
# Start the development server
npm run dev
```

Visit http://localhost:3000

## 📁 Current Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/          ✅ Login page
│   │   └── signup/         ✅ Signup page
│   ├── (dashboard)/
│   │   └── dashboard/      ✅ Basic dashboard placeholder
│   ├── api/
│   │   └── auth/callback/  ✅ Auth callback handler
│   ├── layout.tsx          ✅ Root layout
│   ├── page.tsx            ✅ Landing page
│   └── globals.css         ✅ Global styles
├── components/             📁 Ready for UI components
├── hooks/
│   └── useUser.ts          ✅ User session hook
├── lib/
│   ├── supabase/
│   │   ├── client.ts       ✅ Browser client
│   │   ├── server.ts       ✅ Server client
│   │   └── admin.ts        ✅ Admin client
│   └── utils.ts            ✅ Utility functions
└── types/
    ├── database.ts         ✅ Database types
    ├── heygen.ts           ✅ HeyGen API types
    ├── subscription.ts     ✅ Subscription types
    └── video-job.ts        ✅ Video job types
```

## 🔜 Next Steps

After completing the setup, we'll build:

1. **Stripe Integration**:
   - Checkout session creation
   - Webhook handler
   - Customer portal
   - Pricing page

2. **Usage Tracking**:
   - Monthly limit enforcement
   - Usage display components
   - Subscription status checks

3. **HeyGen Integration**:
   - Avatar and voice fetching
   - Video generation API
   - Status polling system

4. **UI Components**:
   - Avatar selector
   - Voice selector
   - Script manager
   - CSV uploader
   - Video job tracking

5. **Dashboard Pages**:
   - Main video creator
   - Account settings
   - Video history

6. **Testing & Polish**:
   - Error handling
   - Loading states
   - Responsive design
   - Accessibility

## 📝 Database Schema

The following tables will be created in Supabase:

- **profiles**: User profiles with Stripe customer IDs
- **subscriptions**: Active subscriptions (Basic or Pro)
- **video_usage**: Monthly video generation tracking
- **videos**: Complete video generation history

## 🔐 Security Features

- Row Level Security (RLS) enabled on all tables
- API keys stored server-side only
- Protected routes with middleware
- Stripe webhook signature verification
- Input validation and sanitization

## 💡 Support

For issues or questions:
- Check the implementation plan: `.claude/plans/splendid-bubbling-charm.md`
- Review environment variables in `.env.example`
- Ensure all required API keys are configured

---

**Status**: Foundation Complete - Ready for API Integration 🎉
