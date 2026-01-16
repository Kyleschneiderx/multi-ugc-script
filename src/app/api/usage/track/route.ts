import { createClient } from '@/lib/supabase/server';
import { incrementUsage } from '@/lib/usage-tracker';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { count = 1 } = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await incrementUsage(user.id, count);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Usage tracking error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to track usage' },
      { status: 500 }
    );
  }
}
