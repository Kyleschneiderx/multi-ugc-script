import { createClient } from '@/lib/supabase/server';
import { fetchVoices } from '@/lib/heygen-client';
import { NextResponse } from 'next/server';

export async function GET() {
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

    // Fetch voices from HeyGen
    const voices = await fetchVoices();

    return NextResponse.json({ voices });
  } catch (error: any) {
    console.error('Voices fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch voices' },
      { status: 500 }
    );
  }
}
