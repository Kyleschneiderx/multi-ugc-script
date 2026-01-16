import { createClient } from '@/lib/supabase/server';
import { fetchAvatars } from '@/lib/heygen-client';
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

    // Fetch avatars from HeyGen
    const avatars = await fetchAvatars();

    return NextResponse.json({ avatars });
  } catch (error: any) {
    console.error('Avatars fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch avatars' },
      { status: 500 }
    );
  }
}
