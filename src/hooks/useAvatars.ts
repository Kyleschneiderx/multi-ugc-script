'use client';

import { useEffect, useState } from 'react';
import type { Avatar } from '@/types/heygen';

export function useAvatars() {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAvatars() {
      try {
        setLoading(true);
        const response = await fetch('/api/avatars');

        if (!response.ok) {
          throw new Error('Failed to fetch avatars');
        }

        const data = await response.json();
        setAvatars(data.avatars || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load avatars');
        setAvatars([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAvatars();
  }, []);

  return { avatars, loading, error };
}
