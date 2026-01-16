'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Video {
  id: string;
  user_id: string;
  heygen_video_id: string;
  script_title: string | null;
  script_text: string;
  avatar_id: string;
  voice_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url: string | null;
  thumbnail_url: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export function useVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/videos');

      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const data = await response.json();
      setVideos(data.videos || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return {
    videos,
    loading,
    error,
    refetch: fetchVideos,
  };
}
