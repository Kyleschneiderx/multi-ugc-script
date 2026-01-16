import { fetchAvatarGroups } from '@/lib/heygen-client';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groups = await fetchAvatarGroups();

    return NextResponse.json(groups);
  } catch (error: any) {
    console.error('Avatar groups fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch avatar groups' },
      { status: 500 }
    );
  }
}
