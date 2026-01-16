import { createAdminClient } from './supabase/admin';
import { getVideoLimit } from '@/types/subscription';
import type { PlanType } from '@/types/subscription';

export async function getMonthlyUsage(userId: string) {
  const supabase = createAdminClient();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JavaScript months are 0-indexed

  const { data, error } = await (supabase
    .from('video_usage') as any)
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('month', month)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "not found" error
    throw error;
  }

  return data || { videos_generated: 0, year, month, user_id: userId };
}

export async function incrementUsage(userId: string, count: number = 1) {
  const supabase = createAdminClient();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data, error } = await (supabase
    .from('video_usage') as any)
    .upsert({
      user_id: userId,
      year,
      month,
      videos_generated: count,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,year,month',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  // If record exists, we need to increment
  if (data) {
    const { error: updateError } = await supabase.rpc('increment_video_usage', {
      p_user_id: userId,
      p_year: year,
      p_month: month,
      p_count: count,
    });

    if (updateError) {
      // Fallback to manual increment if RPC doesn't exist
      const current = await getMonthlyUsage(userId);
      const { error: fallbackError } = await (supabase
        .from('video_usage') as any)
        .update({
          videos_generated: current.videos_generated + count,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('year', year)
        .eq('month', month);

      if (fallbackError) throw fallbackError;
    }
  }

  if (error) throw error;
}

export async function getRemainingVideos(userId: string, planType: PlanType) {
  const usage = await getMonthlyUsage(userId);
  const limit = getVideoLimit(planType);
  return Math.max(0, limit - usage.videos_generated);
}

export async function canGenerateVideos(
  userId: string,
  planType: PlanType,
  count: number
) {
  const remaining = await getRemainingVideos(userId, planType);
  return remaining >= count;
}

export async function getUserSubscription(userId: string) {
  const supabase = createAdminClient();

  const { data, error } = await (supabase
    .from('subscriptions') as any)
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

export async function checkUsageLimit(userId: string, count: number = 1) {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return {
      allowed: false,
      error: 'No active subscription found. Please subscribe to continue.',
      subscription: null,
      remaining: 0,
    };
  }

  const canGenerate = await canGenerateVideos(
    userId,
    subscription.plan_type,
    count
  );
  const remaining = await getRemainingVideos(userId, subscription.plan_type);

  if (!canGenerate) {
    return {
      allowed: false,
      error: `You have ${remaining} videos remaining this month. You're trying to generate ${count} videos.`,
      subscription,
      remaining,
    };
  }

  return {
    allowed: true,
    error: null,
    subscription,
    remaining,
  };
}
