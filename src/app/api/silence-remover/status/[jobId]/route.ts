import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const SILENCE_REMOVER_API_URL = 'https://silenceremover-14a00b007e5f.herokuapp.com';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the videoId from query params to update database when complete
    const url = new URL(request.url);
    const videoId = url.searchParams.get('videoId');

    // Check status from silence remover API
    const response = await fetch(
      `${SILENCE_REMOVER_API_URL}/remove-silence/status/${jobId}`,
      {
        headers: {
          'X-API-Key': process.env.SILENCE_REMOVER_API_KEY || '',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Silence remover API response:', JSON.stringify(data, null, 2));

    // Get the processed URL from the response (check multiple possible field names)
    const processedUrl = data.processed_url || data.storage_url || data.supabase_url || data.output_url || data.url || null;

    // If completed and we have a videoId, update the database
    if (data.status === 'completed' && processedUrl && videoId) {
      console.log('Updating video', videoId, 'with processed_url:', processedUrl);
      const { error: updateError } = await (supabase.from('videos') as any)
        .update({ processed_url: processedUrl })
        .eq('id', videoId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Failed to update video with processed_url:', updateError);
      }
    }

    return NextResponse.json({
      status: data.status,
      processedUrl: processedUrl,
      error: data.error || null,
    });
  } catch (error: any) {
    console.error('Silence remover status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get job status' },
      { status: 500 }
    );
  }
}
