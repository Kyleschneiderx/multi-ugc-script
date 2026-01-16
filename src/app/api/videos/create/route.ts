import { createClient } from '@/lib/supabase/server';
import { createVideo } from '@/lib/heygen-client';
import { checkUsageLimit, incrementUsage } from '@/lib/usage-tracker';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { avatarId, voiceId, script, title } = await request.json();

    if (!avatarId || !voiceId || !script) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Check usage limit
    const usageCheck = await checkUsageLimit(user.id, 1);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { error: usageCheck.error },
        { status: 403 }
      );
    }

    // Create video with HeyGen
    const response = await createVideo({
      avatarId,
      voiceId,
      script,
      title,
    });

    const videoId = response.data.video_id;

    // Save video record to database
    await supabase.from('videos').insert({
      user_id: user.id,
      heygen_video_id: videoId,
      script_title: title || 'Untitled',
      script_text: script,
      avatar_id: avatarId,
      voice_id: voiceId,
      status: 'pending',
    });

    // Increment usage
    await incrementUsage(user.id, 1);

    return NextResponse.json({
      success: true,
      video_id: videoId,
    });
  } catch (error: any) {
    console.error('Video creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create video' },
      { status: 500 }
    );
  }
}
