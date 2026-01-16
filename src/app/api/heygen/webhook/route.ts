import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log('HeyGen webhook received:', body);

    // HeyGen webhook payload typically includes:
    // - video_id
    // - status (completed, failed, etc.)
    // - video_url (if completed)
    // - thumbnail_url (if completed)
    // - error (if failed)

    const { video_id, status, video_url, thumbnail_url, error } = body;

    if (!video_id) {
      return NextResponse.json(
        { error: 'Missing video_id in webhook payload' },
        { status: 400 }
      );
    }

    // Create a Supabase admin client with service role to bypass RLS
    const supabase = createAdminClient();

    // Update video status in database based on status
    let dbError;

    if (status === 'completed') {
      const result = await (supabase
        .from('videos') as any)
        .update({
          status: 'completed',
          video_url: video_url || null,
          thumbnail_url: thumbnail_url || null,
          completed_at: new Date().toISOString(),
        })
        .eq('heygen_video_id', video_id);
      dbError = result.error;
    } else if (status === 'failed') {
      const result = await (supabase
        .from('videos') as any)
        .update({
          status: 'failed',
          error_message: error?.message || 'Video generation failed',
          completed_at: new Date().toISOString(),
        })
        .eq('heygen_video_id', video_id);
      dbError = result.error;
    } else {
      const result = await (supabase
        .from('videos') as any)
        .update({ status: status || 'processing' })
        .eq('heygen_video_id', video_id);
      dbError = result.error;
    }

    if (dbError) {
      console.error('Database update error:', dbError);
      throw dbError;
    }

    console.log(`Video ${video_id} status updated to ${status}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('HeyGen webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
