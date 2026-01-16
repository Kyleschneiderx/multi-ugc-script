# Subscription Flow Audit Report

**Date:** 2026-01-16
**Status:** Complete

## Executive Summary

The subscription flow has been thoroughly audited. The system is **functional but has robustness issues** that can cause silent failures. New users can sign up for subscriptions, but webhook delivery failures from Stripe can prevent subscription records from being created in the database.

## Current Status

✅ **Working Components:**
- User signup and profile creation (automated via database trigger)
- Checkout session creation with proper user ID linking
- Subscription query logic correctly checks for active/incomplete/trialing status
- Frontend properly gates access based on subscription status

⚠️ **Issues Identified:**
1. Webhook delivery failures from Stripe (root cause of recent issues)
2. Database schema too strict for edge cases
3. Silent webhook failures that return 200 OK without creating subscriptions

## Detailed Flow Analysis

### 1. User Signup → Profile Creation ✅

**Location:** `supabase/migrations/001_initial_schema.sql:82-94`

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Status:** Working correctly. Profiles are automatically created when users sign up.

---

### 2. Checkout Session Creation ✅

**Location:** `src/lib/stripe-client.ts:10-38`

The checkout session properly includes user ID in two places:
- `client_reference_id`: userId
- `metadata.userId`: userId

This redundancy is good for reliability.

**Status:** Working correctly.

---

### 3. Stripe Webhook Processing ⚠️

**Location:** `src/app/api/stripe/webhook/route.ts:42-178`

**Flow:**
1. Verify webhook signature ✅
2. Handle `customer.subscription.created` and `customer.subscription.updated` events
3. Look up user profile by `stripe_customer_id`
4. If not found, retrieve user ID from checkout session metadata
5. Update profile with `stripe_customer_id`
6. Insert/upsert subscription record

**Issues Found:**

#### Issue A: Silent Failures
**Lines:** 79-80, 90-91, 99-100

The webhook uses `break` statements that exit early and return 200 OK even when subscription creation fails:

```typescript
if ('deleted' in customer) {
  console.error('Customer deleted:', customerId);
  break;  // Returns 200 OK but subscription not created!
}
```

**Impact:** Stripe thinks the webhook succeeded, so it won't retry. Subscription never gets created in database.

**Recommendation:** Return 500 error so Stripe retries:
```typescript
if ('deleted' in customer) {
  console.error('Customer deleted:', customerId);
  return NextResponse.json(
    { error: 'Customer deleted' },
    { status: 500 }
  );
}
```

#### Issue B: Webhook Delivery Failures
**Root Cause:** Unknown - Stripe may have failed to deliver webhooks for recent subscriptions (kyle+3 and kyle+4).

**Evidence:**
- Subscriptions exist in Stripe (verified via API)
- No subscription records in database (verified via query)
- No webhook logs in Vercel (checked recent logs)

**Recommendation:**
1. Monitor Stripe webhook dashboard for delivery failures
2. Add backup sync mechanism (see recommendations below)

---

### 4. Database Schema Issue ⚠️

**Location:** `supabase/migrations/001_initial_schema.sql:20-21`

```sql
current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
```

**Issue:** These columns are marked NOT NULL, but incomplete subscriptions may not have period dates.

**Status:** Webhook handler has null checks (lines 131-141) to work around this, but the schema is still too strict.

**Fix Created:** `supabase/migrations/002_allow_null_subscription_periods.sql`

**Action Required:** You need to apply this migration manually via Supabase dashboard SQL editor:

```sql
ALTER TABLE subscriptions
  ALTER COLUMN current_period_start DROP NOT NULL,
  ALTER COLUMN current_period_end DROP NOT NULL;
```

---

### 5. Subscription Query Logic ✅

**Location:** `src/lib/usage-tracker.ts:92-109`

```typescript
.in('status', ['active', 'incomplete', 'trialing'])
```

**Status:** Correctly queries for multiple subscription statuses. This was fixed earlier to include 'incomplete' and 'trialing'.

---

### 6. Frontend Access Control ✅

**Location:** `src/app/(dashboard)/dashboard/page.tsx:262-280`

The dashboard properly checks `usage.hasSubscription` and shows a clear message when no subscription is found.

**Status:** Working correctly.

---

## Recommendations

### High Priority

1. **Fix Silent Webhook Failures**

   Replace `break` statements with proper error responses in the webhook handler:

   ```typescript
   // Lines 79-80, 90-91, 99-100
   // BEFORE:
   if (!userId) {
     console.error('No user ID found');
     break;
   }

   // AFTER:
   if (!userId) {
     console.error('No user ID found for customer:', customerId);
     return NextResponse.json(
       { error: 'User ID not found in session metadata' },
       { status: 500 }
     );
   }
   ```

2. **Apply Database Schema Fix**

   Run this SQL in Supabase dashboard → SQL Editor:
   ```sql
   ALTER TABLE subscriptions
     ALTER COLUMN current_period_start DROP NOT NULL,
     ALTER COLUMN current_period_end DROP NOT NULL;
   ```

3. **Monitor Stripe Webhook Dashboard**

   Check https://dashboard.stripe.com/webhooks to see if webhooks are being delivered. Look for:
   - Delivery failures
   - 4xx/5xx responses
   - Timeout errors

### Medium Priority

4. **Add Backup Sync Mechanism**

   Create an API endpoint that syncs missing subscriptions from Stripe:

   ```typescript
   // src/app/api/admin/sync-subscriptions/route.ts
   export async function POST() {
     // 1. Get all Stripe customers
     // 2. For each customer, get active subscriptions
     // 3. Check if subscription exists in database
     // 4. If not, create it
   }
   ```

5. **Add Webhook Monitoring**

   Log all webhook events to a separate table for debugging:
   ```sql
   CREATE TABLE webhook_logs (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     event_type TEXT NOT NULL,
     event_id TEXT NOT NULL,
     status TEXT NOT NULL,
     error TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

### Low Priority

6. **Add Email Notifications**

   Send confirmation email when subscription is successfully created.

7. **Add Admin Dashboard**

   Create admin view to see all subscriptions and manually sync if needed.

---

## Test Plan for New Users

To verify the complete flow works:

1. **Sign up with a new email**
   - Verify profile is created automatically
   - Check `profiles` table for new record

2. **Go to /pricing and click "Subscribe"**
   - Should redirect to Stripe checkout
   - Verify checkout session has userId in metadata

3. **Complete payment with test card**
   - Card: 4242 4242 4242 4242
   - Expiry: Any future date
   - CVC: Any 3 digits

4. **Check Stripe Dashboard**
   - Verify customer was created
   - Verify subscription is active
   - Check webhook delivery status

5. **Check Database**
   - Query: `SELECT * FROM profiles WHERE email = 'test@example.com'`
   - Verify `stripe_customer_id` is populated
   - Query: `SELECT * FROM subscriptions WHERE user_id = '<user_id>'`
   - Verify subscription record exists with status 'active'

6. **Check Frontend**
   - Verify user can access /dashboard
   - Should NOT see "No Active Subscription" message
   - Should see usage stats and video creation form

---

## Recent Issues Resolved

✅ Fixed subscription query to include 'incomplete' and 'trialing' statuses
✅ Manually synced 2 missing subscriptions (kyle+3, kyle+4) from Stripe to database
✅ Added extensive logging to webhook handler for debugging
✅ Created database migration to allow NULL period dates

---

## Files Modified

- `src/lib/usage-tracker.ts` (line 99) - Added 'incomplete', 'trialing' to status query
- `src/app/api/stripe/webhook/route.ts` (lines 40-156) - Added debug logging
- `supabase/migrations/002_allow_null_subscription_periods.sql` - New migration file

---

## Conclusion

**Can new users sign up for subscriptions?** Yes, the flow works for most cases.

**What's the risk?** If Stripe webhooks fail to deliver or time out, subscriptions won't be created in the database even though payment succeeded. This results in users paying but not getting access.

**Next Steps:**
1. Apply database schema fix (manual SQL in Supabase dashboard)
2. Fix silent webhook failures (replace break with return 500)
3. Monitor Stripe webhook dashboard for delivery issues
4. Consider adding backup sync mechanism for resilience

The immediate fix (syncing missing subscriptions manually) resolved the current issues. The recommended improvements will prevent future issues and make the system more robust.
