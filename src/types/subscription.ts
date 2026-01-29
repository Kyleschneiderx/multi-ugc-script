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

// Hardcoded price IDs as fallback (must match Stripe dashboard)
const BASIC_PRICE_IDS = [
  process.env.STRIPE_BASIC_PRICE_ID,
  'price_1SpxVcROopJQkds4bzEXgbJT', // Production price ID
].filter(Boolean);

const PRO_PRICE_IDS = [
  process.env.STRIPE_PRO_PRICE_ID,
  'price_1SpxVzROopJQkds4aOfIyPuu', // Production price ID
].filter(Boolean);

export function getPlanByPriceId(priceId: string): PlanType | null {
  if (BASIC_PRICE_IDS.includes(priceId)) return 'basic';
  if (PRO_PRICE_IDS.includes(priceId)) return 'pro';
  return null;
}

export function getVideoLimit(planType: PlanType): number {
  return PLANS[planType].videoLimit;
}
