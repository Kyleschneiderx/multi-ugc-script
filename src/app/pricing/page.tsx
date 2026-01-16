'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';

// Note: Price IDs are configured in .env.local
const BASIC_PRICE_ID = 'price_1SpxVcROopJQkds4bzEXgbJT';
const PRO_PRICE_ID = 'price_1SpxVzROopJQkds4aOfIyPuu';

const plans = [
  {
    name: 'Basic',
    price: 99,
    priceId: BASIC_PRICE_ID,
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
  {
    name: 'Pro',
    price: 599,
    priceId: PRO_PRICE_ID,
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
    popular: true,
  },
];

export default function PricingPage() {
  const { user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleSubscribe = async (priceId: string, planName: string) => {
    if (!user) {
      router.push('/signup');
      return;
    }

    setLoading(planName);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      alert(error.message || 'Failed to start subscription');
      setLoading(null);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Start creating AI videos at scale with HeyGen
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-2xl shadow-xl p-8 relative ${
                plan.popular ? 'ring-4 ring-indigo-600' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-8 transform -translate-y-1/2">
                  <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h2>
                <div className="flex items-baseline justify-center mb-4">
                  <span className="text-5xl font-extrabold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-xl text-gray-600 ml-2">/month</span>
                </div>
                <p className="text-gray-600 font-medium">
                  {plan.videoLimit} videos per month
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.priceId, plan.name)}
                disabled={loading === plan.name}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition ${
                  plan.popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === plan.name
                  ? 'Loading...'
                  : user
                  ? 'Subscribe Now'
                  : 'Get Started'}
              </button>
            </div>
          ))}
        </div>

        {!user && (
          <p className="text-center mt-8 text-gray-600">
            Already have an account?{' '}
            <a
              href="/login"
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Log in
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
