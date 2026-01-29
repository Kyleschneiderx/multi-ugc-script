-- Add processed_url column to videos table for silence-removed versions
ALTER TABLE videos ADD COLUMN IF NOT EXISTS processed_url TEXT;
