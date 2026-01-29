import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const SILENCE_REMOVER_API_URL = 'https://silenceremover-14a00b007e5f.herokuapp.com';

export async function POST(request: Request) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId, videoUrl } = await request.json();

    if (!videoId || !videoUrl) {
      return NextResponse.json(
        { error: 'videoId and videoUrl are required' },
        { status: 400 }
      );
    }

    // Verify user owns this video
    const { data: video, error: videoError } = await (supabase
      .from('videos') as any)
      .select('id')
      .eq('id', videoId)
      .eq('user_id', user.id)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Submit to silence remover API
    const response = await fetch(`${SILENCE_REMOVER_API_URL}/remove-silence`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.SILENCE_REMOVER_API_KEY || '',
      },
      body: JSON.stringify({ video_url: videoUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      jobId: data.job_id,
      message: data.message,
    });
  } catch (error: any) {
    console.error('Silence remover process error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process video' },
      { status: 500 }
    );
  }
}
