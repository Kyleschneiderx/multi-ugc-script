import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const CLEANVOICE_API_KEY = process.env.CLEANVOICE_API_KEY;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
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

    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    if (!CLEANVOICE_API_KEY) {
      return NextResponse.json(
        { error: 'CleanVoice API key not configured' },
        { status: 500 }
      );
    }

    // Check job status
    const response = await fetch(`https://api.cleanvoice.ai/v2/edits/${jobId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': CLEANVOICE_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('CleanVoice status error:', errorData);
      return NextResponse.json(
        { error: errorData.message || `CleanVoice API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('CleanVoice status response:', data);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('CleanVoice status check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check CleanVoice status' },
      { status: 500 }
    );
  }
}
