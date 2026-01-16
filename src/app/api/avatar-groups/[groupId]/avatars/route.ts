import { fetchAvatarsInGroup } from '@/lib/heygen-client';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await params;
    const avatars = await fetchAvatarsInGroup(groupId);

    return NextResponse.json({ avatars });
  } catch (error: any) {
    console.error('Avatar group avatars fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch avatars' },
      { status: 500 }
    );
  }
}
