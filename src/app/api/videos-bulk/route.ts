import { createClient } from '@/lib/supabase/server';
import { createVideo } from '@/lib/heygen-client';
import { checkUsageLimit, incrementUsage } from '@/lib/usage-tracker';
import { NextResponse } from 'next/server';

interface Script {
  id: string;
  title: string;
  text: string;
}

export async function POST(request: Request) {
  try {
    const { avatarId, voiceId, scripts } = await request.json();

    if (!avatarId || !voiceId || !scripts || !Array.isArray(scripts)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (scripts.length === 0) {
      return NextResponse.json(
        { error: 'No scripts provided' },
        { status: 400 }
      );
    }

    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check usage limit for all videos at once
    const usageCheck = await checkUsageLimit(user.id, scripts.length);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: usageCheck.error,
          remaining: usageCheck.remaining,
        },
        { status: 403 }
      );
    }

    // Create videos with delays between requests
    const results = [];

    // Get the base URL for callback
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const callbackUrl = `${protocol}://${host}/api/heygen/webhook`;

    console.log('Using callback URL:', callbackUrl);

    for (let i = 0; i < scripts.length; i++) {
      const script: Script = scripts[i];

      try {
        // Create video with HeyGen
        const response = await createVideo({
          avatarId,
          voiceId,
          script: script.text,
          title: script.title,
          callbackUrl,
        });

        const videoId = response.data.video_id;

        // Save video record to database
        await supabase.from('videos').insert({
          user_id: user.id,
          heygen_video_id: videoId,
          script_title: script.title || 'Untitled',
          script_text: script.text,
          avatar_id: avatarId,
          voice_id: voiceId,
          status: 'pending',
        });

        results.push({
          script_id: script.id,
          video_id: videoId,
          status: 'submitted',
          error: null,
        });

        // Add delay between requests (500ms) to avoid rate limiting
        if (i < scripts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error: any) {
        console.error(`Failed to create video for script ${script.id}:`, error);
        results.push({
          script_id: script.id,
          video_id: null,
          status: 'failed',
          error: error.message || 'Unknown error',
        });
      }
    }

    // Increment usage by the number of successfully created videos
    const successCount = results.filter((r) => r.status === 'submitted').length;
    if (successCount > 0) {
      await incrementUsage(user.id, successCount);
    }

    return NextResponse.json({
      success: true,
      total: scripts.length,
      successful: successCount,
      failed: results.filter((r) => r.status === 'failed').length,
      jobs: results,
    });
  } catch (error: any) {
    console.error('Bulk video creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create videos' },
      { status: 500 }
    );
  }
}
