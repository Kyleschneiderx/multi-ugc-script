'use client';

import { useEffect, useState } from 'react';
import type { Voice } from '@/types/heygen';

export function useVoices() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVoices() {
      try {
        setLoading(true);
        const response = await fetch('/api/voices');

        if (!response.ok) {
          throw new Error('Failed to fetch voices');
        }

        const data = await response.json();
        setVoices(data.voices || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load voices');
        setVoices([]);
      } finally {
        setLoading(false);
      }
    }

    fetchVoices();
  }, []);

  return { voices, loading, error };
}
