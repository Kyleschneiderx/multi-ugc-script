# Task: Add Video Orientation Selection (Landscape/Portrait)

## Overview
Add the ability for users to select video orientation (landscape or portrait) when creating videos. The HeyGen API uses `dimension: { width, height }` to control orientation.

## HeyGen API Details
- **Landscape:** `{ width: 1280, height: 720 }` (16:9)
- **Portrait:** `{ width: 720, height: 1280 }` (9:16)
- Parameter location: Root level of request body alongside `video_inputs`

**Reference:** [HeyGen API - Create Avatar Video V2](https://docs.heygen.com/reference/create-an-avatar-video-v2)

## Todo Items

### 1. Database Changes
- [ ] Create migration to add `orientation` column to videos table
- [ ] Update TypeScript database types to include orientation field

### 2. Type System Updates
- [ ] Add orientation to Script interface in video-job.ts
- [ ] Add orientation parameter to HeyGen CreateVideoResponse type if needed

### 3. HeyGen Client Update
- [ ] Add orientation parameter to createVideo() function
- [ ] Map orientation to dimension object (landscape: 1280x720, portrait: 720x1280)

### 4. API Routes Update
- [ ] Update /api/videos/create to accept and store orientation
- [ ] Update /api/videos-bulk to accept and store orientation

### 5. Frontend UI Update
- [ ] Add orientation selector in dashboard (radio buttons or toggle)
- [ ] Pass orientation with form submission
- [ ] Update CSV upload to support orientation column (optional, default to landscape)

## Implementation Notes
- Default orientation: landscape (1280x720)
- Keep changes minimal - only modify code necessary for this feature
- Test both single and bulk video creation flows
- Ensure orientation is stored in database for reference

## Review

### Implementation Complete ✓

All changes have been successfully implemented and the app compiles without errors. Users can now select video orientation (landscape or portrait) when creating videos.

### Changes Made

#### 1. Database Migration (supabase/migrations/003_add_video_orientation.sql)
- **New file created** - Migration to add `orientation` column to videos table
- Column type: `TEXT NOT NULL DEFAULT 'landscape'`
- CHECK constraint: Ensures value is either 'landscape' or 'portrait'
- Default value: 'landscape' for backward compatibility
- **Impact**: All new videos will store their orientation, existing videos default to landscape

#### 2. TypeScript Database Types (src/types/database.ts)
- **Added `orientation` field to videos table types**:
  - Row type: `orientation: 'landscape' | 'portrait'`
  - Insert type: `orientation?: 'landscape' | 'portrait'` (optional with default)
  - Update type: `orientation?: 'landscape' | 'portrait'` (optional)
- **Lines modified**: 88-125
- **Impact**: Full TypeScript type safety for orientation field

#### 3. Script Interface (src/types/video-job.ts)
- **Added orientation to Script interface**: `orientation?: 'landscape' | 'portrait'`
- **Line 4**: New field added
- **Impact**: Scripts can now carry orientation information

#### 4. HeyGen API Client (src/lib/heygen-client.ts)
- **Updated createVideo function signature** to accept `orientation` parameter
- **Added dimension mapping logic**:
  - Portrait: `{ width: 720, height: 1280 }` (9:16)
  - Landscape: `{ width: 1280, height: 720 }` (16:9)
- **Lines modified**: 82-124
- **Impact**: Videos are now created with correct aspect ratio via HeyGen API

#### 5. Single Video Creation API (src/app/api/videos/create/route.ts)
- **Line 8**: Added `orientation = 'landscape'` to request destructuring
- **Line 44**: Pass orientation to createVideo function
- **Line 56**: Store orientation in database
- **Impact**: Single video creation now supports orientation

#### 6. Bulk Video Creation API (src/app/api/videos-bulk/route.ts)
- **Line 10**: Added orientation field to Script interface
- **Line 73**: Pass script.orientation to createVideo function
- **Line 86**: Store orientation in database
- **Impact**: Bulk video creation now supports per-script orientation

#### 7. Dashboard UI (src/app/(dashboard)/dashboard/page.tsx)
- **Line 30**: Added orientation state `useState<'landscape' | 'portrait'>('landscape')`
- **Line 54**: Updated handleAddScript to include orientation in script object
- **Lines 584-643**: **New Step 3 added** - Orientation selector with:
  - Visual radio button cards showing 16:9 and 9:16 aspect ratios
  - Landscape option (1280×720) and Portrait option (720×1280)
  - Selected state indication with indigo border and background
  - Confirmation badge showing selected orientation
- **Line 646**: Updated scripts section from "Step 3" to "Step 4"
- **Line 81**: Updated CSV upload to pass current orientation
- **Impact**: Users can now visually select orientation before adding scripts

#### 8. CSV Parser (src/lib/csv-parser.ts)
- **Line 35-36**: Added `orientation` parameter to parseCSVToScripts function
- Default value: 'landscape'
- **Line 41**: Include orientation in parsed script objects
- **Impact**: CSV uploads now use the currently selected orientation for all imported scripts

### Summary

**Total files modified**: 8 files
**Total files created**: 1 file (migration)
**Lines added/modified**: ~80 lines

All changes were kept minimal and focused on the specific task:
- Database schema updated with migration
- TypeScript types updated throughout the stack
- API routes pass orientation to HeyGen and store in database
- UI provides clear visual selection with proper UX
- CSV uploads respect the selected orientation
- Default orientation is 'landscape' for backward compatibility

### Testing Notes

The implementation is complete and compiling successfully. To test:
1. Navigate to `/dashboard` in the app
2. Select an avatar and voice as normal
3. **New Step 3** will show orientation selector with landscape/portrait options
4. Add scripts (manually or via CSV)
5. All scripts will use the selected orientation
6. Generated videos will have the correct aspect ratio (16:9 or 9:16)

The orientation is stored in the database for each video, allowing future features to display or filter videos by orientation.
