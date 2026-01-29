# Silence Remover API Integration

## Overview
Integrate custom silence remover API to process videos and provide download for silence-removed versions.

## API Details
- Base URL: https://silenceremover-14a00b007e5f.herokuapp.com
- Auth: X-API-Key header
- POST /remove-silence - Submit job
- GET /remove-silence/status/{job_id} - Check status

## Todo Items

### 1. Environment Setup
- [x] Add SILENCE_REMOVER_API_KEY to env

### 2. Database Update
- [x] Add `processed_url` column to videos table for silence-removed version

### 3. API Endpoints
- [x] Create /api/silence-remover/process - Submit video for processing
- [x] Create /api/silence-remover/status/[jobId] - Check job status

### 4. Library Page Updates
- [x] Add video selection checkboxes
- [x] Add "Remove Silence" button
- [x] Track processing jobs
- [x] Show "Download (No Silence)" button when processed_url exists

---

## Review

### Changes Made

1. **Database Migration** (`supabase/migrations/006_add_processed_url.sql`)
   - Added `processed_url` column to videos table to store the silence-removed video URL

2. **Type Updates** (`src/types/database.ts`, `src/hooks/useVideos.ts`)
   - Added `processed_url: string | null` to Video types in both files

3. **API Endpoints**
   - `src/app/api/silence-remover/process/route.ts` - POST endpoint to submit a video for silence removal
   - `src/app/api/silence-remover/status/[jobId]/route.ts` - GET endpoint to check job status and update database when complete

4. **Library Page** (`src/app/(dashboard)/dashboard/library/page.tsx`)
   - Added checkboxes on completed videos for selection
   - Added "Remove Silence" button in header (shows count of selected videos)
   - Added polling mechanism to track processing jobs
   - Shows "Removing silence..." spinner during processing
   - Shows green "Download (No Silence)" button when processed_url exists

### Deployment Steps
1. Run migration 006 in Supabase to add the `processed_url` column
2. Add `SILENCE_REMOVER_API_KEY` environment variable in Vercel

### How It Works
1. User selects completed videos using checkboxes
2. Clicks "Remove Silence" button
3. Videos are submitted to the silence remover API
4. Frontend polls for job status every 5 seconds
5. When complete, processed_url is saved to database
6. "Download (No Silence)" button appears for processed videos
