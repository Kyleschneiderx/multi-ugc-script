import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

// Handle OPTIONS request for HeyGen webhook validation
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log('HeyGen webhook received:', JSON.stringify(body, null, 2));

    // HeyGen webhook payload structure:
    // {
    //   "event_type": "avatar_video.success" | "avatar_video.fail",
    //   "event_data": {
    //     "video_id": "...",
    //     "url": "...",
    //     "gif_download_url": "...",
    //     "callback_id": "..."
    //   }
    // }

    const { event_type, event_data } = body;

    if (!event_type || !event_data) {
      return NextResponse.json(
        { error: 'Invalid webhook payload structure' },
        { status: 400 }
      );
    }

    const { video_id, url } = event_data;

    if (!video_id) {
      return NextResponse.json(
        { error: 'Missing video_id in webhook payload' },
        { status: 400 }
      );
    }

    // Create a Supabase admin client with service role to bypass RLS
    const supabase = createAdminClient();

    // Update video status based on event type
    let dbError;

    if (event_type === 'avatar_video.success') {
      const result = await (supabase
        .from('videos') as any)
        .update({
          status: 'completed',
          video_url: url || null,
          thumbnail_url: event_data.gif_download_url || null,
          completed_at: new Date().toISOString(),
        })
        .eq('heygen_video_id', video_id);
      dbError = result.error;

      console.log(`Video ${video_id} completed successfully`);
    } else if (event_type === 'avatar_video.fail') {
      const result = await (supabase
        .from('videos') as any)
        .update({
          status: 'failed',
          error_message: 'Video generation failed',
          completed_at: new Date().toISOString(),
        })
        .eq('heygen_video_id', video_id);
      dbError = result.error;

      console.log(`Video ${video_id} failed`);
    } else {
      // Unknown event type - log it but don't fail
      console.log(`Received unknown event type: ${event_type}`);
      return NextResponse.json({ success: true, message: 'Event type not handled' });
    }

    if (dbError) {
      console.error('Database update error:', dbError);
      throw dbError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('HeyGen webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
