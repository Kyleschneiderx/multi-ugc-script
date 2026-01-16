import { createClient } from '@/lib/supabase/server';
import {
  getMonthlyUsage,
  getRemainingVideos,
  getUserSubscription,
} from '@/lib/usage-tracker';
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

    const subscription = await getUserSubscription(user.id);

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        usage: null,
        remaining: 0,
        limit: 0,
        planType: null,
      });
    }

    const usage = await getMonthlyUsage(user.id);
    const remaining = await getRemainingVideos(
      user.id,
      subscription.plan_type
    );

    return NextResponse.json({
      hasSubscription: true,
      usage: usage.videos_generated,
      remaining,
      limit: subscription.plan_type === 'basic' ? 50 : 350,
      planType: subscription.plan_type,
    });
  } catch (error: any) {
    console.error('Usage check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check usage' },
      { status: 500 }
    );
  }
}
