export type PlanType = 'basic' | 'pro';

export interface SubscriptionPlan {
  name: string;
  price: number;
  priceId: string;
  videoLimit: number;
  features: string[];
}

export const PLANS: Record<PlanType, SubscriptionPlan> = {
  basic: {
    name: 'Basic',
    price: 99,
    priceId: process.env.STRIPE_BASIC_PRICE_ID || '',
    videoLimit: 50,
    features: [
      '50 videos per month',
      'All avatar options',
      'All voice options',
      'CSV bulk upload',
      'Video history',
      'Email support',
    ],
  },
  pro: {
    name: 'Pro',
    price: 599,
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    videoLimit: 350,
    features: [
      '350 videos per month',
      'All avatar options',
      'All voice options',
      'CSV bulk upload',
      'Video history',
      'Priority email support',
      'Advanced analytics',
    ],
  },
};

export function getPlanByPriceId(priceId: string): PlanType | null {
  if (priceId === PLANS.basic.priceId) return 'basic';
  if (priceId === PLANS.pro.priceId) return 'pro';
  return null;
}

export function getVideoLimit(planType: PlanType): number {
  return PLANS[planType].videoLimit;
}
