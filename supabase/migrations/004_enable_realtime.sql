-- Enable Realtime for videos table
-- This allows the frontend to subscribe to database changes in real-time

ALTER PUBLICATION supabase_realtime ADD TABLE videos;
