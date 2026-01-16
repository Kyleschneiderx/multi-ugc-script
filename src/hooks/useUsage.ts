'use client';

import { useEffect, useState } from 'react';

interface UsageData {
  hasSubscription: boolean;
  usage: number | null;
  remaining: number;
  limit: number;
  planType: 'basic' | 'pro' | null;
}

export function useUsage() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/usage/check');

      if (response.status === 401) {
        // User not authenticated - set default data
        setData({
          hasSubscription: false,
          usage: null,
          remaining: 0,
          limit: 0,
          planType: null,
        });
        setError(null);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load usage data');
      setData({
        hasSubscription: false,
        usage: null,
        remaining: 0,
        limit: 0,
        planType: null,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  return { ...data, loading, error, refetch: fetchUsage };
}
