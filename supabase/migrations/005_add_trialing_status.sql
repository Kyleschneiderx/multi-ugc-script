-- Add 'trialing' status to subscriptions table
-- This is needed because Stripe can send subscriptions with trialing status

ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_status_check;

ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing', 'unpaid'));
