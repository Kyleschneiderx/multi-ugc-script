-- Allow NULL values for subscription period dates
-- This is needed for incomplete subscriptions that don't have period dates yet

ALTER TABLE subscriptions
  ALTER COLUMN current_period_start DROP NOT NULL,
  ALTER COLUMN current_period_end DROP NOT NULL;
