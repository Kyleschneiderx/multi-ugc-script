import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const CLEANVOICE_API_URL = 'https://api.cleanvoice.ai/v2/edits';
const CLEANVOICE_API_KEY = process.env.CLEANVOICE_API_KEY;

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

    const { videoUrls } = await request.json();

    if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
      return NextResponse.json(
        { error: 'No video URLs provided' },
        { status: 400 }
      );
    }

    if (!CLEANVOICE_API_KEY) {
      return NextResponse.json(
        { error: 'CleanVoice API key not configured' },
        { status: 500 }
      );
    }

    // Call CleanVoice API
    const response = await fetch(CLEANVOICE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CLEANVOICE_API_KEY,
      },
      body: JSON.stringify({
        input: {
          files: videoUrls,
          config: {
            long_silences: true,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('CleanVoice API error:', errorData);
      return NextResponse.json(
        { error: errorData.message || `CleanVoice API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('CleanVoice response:', data);

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error('CleanVoice processing error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process with CleanVoice' },
      { status: 500 }
    );
  }
}
