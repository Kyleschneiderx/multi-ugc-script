import { createClient } from '@/lib/supabase/server';
import { getVideoStatus } from '@/lib/heygen-client';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;

    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get video status from HeyGen
    const status = await getVideoStatus(videoId);

    // Update database with latest status
    if (status.status === 'completed' || status.status === 'failed') {
      await supabase
        .from('videos')
        .update({
          status: status.status,
          video_url: status.video_url || null,
          thumbnail_url: status.thumbnail_url || null,
          error_message: status.error?.message || null,
          completed_at: new Date().toISOString(),
        })
        .eq('heygen_video_id', videoId)
        .eq('user_id', user.id);
    } else if (status.status === 'processing') {
      await supabase
        .from('videos')
        .update({
          status: 'processing',
        })
        .eq('heygen_video_id', videoId)
        .eq('user_id', user.id);
    }

    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Video status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get video status' },
      { status: 500 }
    );
  }
}
