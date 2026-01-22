-- Add orientation column to videos table
-- Allows users to specify landscape or portrait video format

ALTER TABLE videos
  ADD COLUMN orientation TEXT NOT NULL DEFAULT 'landscape' CHECK (orientation IN ('landscape', 'portrait'));
