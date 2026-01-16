import { createClient } from '@/lib/supabase/server';
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

    // Create a Supabase client with service role to bypass RLS
    const supabase = await createClient();

    // Update video status in database
    const updateData: any = {
      status: status || 'processing',
    };

    if (status === 'completed') {
      updateData.video_url = video_url || null;
      updateData.thumbnail_url = thumbnail_url || null;
      updateData.completed_at = new Date().toISOString();
    } else if (status === 'failed') {
      updateData.error_message = error?.message || 'Video generation failed';
      updateData.completed_at = new Date().toISOString();
    }

    const { error: dbError } = await supabase
      .from('videos')
      .update(updateData)
      .eq('heygen_video_id', video_id);

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
