'use client';

import { useEffect, useState } from 'react';
import type { AvatarGroup } from '@/types/heygen';

export function useAvatarGroups() {
  const [groups, setGroups] = useState<AvatarGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/avatar-groups');

        if (!response.ok) {
          throw new Error('Failed to fetch avatar groups');
        }

        const data = await response.json();
        setGroups(data.avatar_group_list || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load avatar groups');
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  return { groups, loading, error };
}
