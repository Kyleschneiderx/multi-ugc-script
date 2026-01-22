'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Video {
  id: string;
  user_id: string;
  heygen_video_id: string;
  script_title: string | null;
  script_text: string;
  avatar_id: string;
  voice_id: string;
  orientation: 'landscape' | 'portrait';
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

    // Set up real-time subscription for video updates
    const supabase = createClient();

    const channel = supabase
      .channel('videos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'videos',
        },
        (payload) => {
          console.log('Real-time video update:', payload);

          if (payload.eventType === 'INSERT') {
            // Add new video to the list
            setVideos((prev) => [payload.new as Video, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            // Update existing video
            setVideos((prev) =>
              prev.map((video) =>
                video.id === payload.new.id ? (payload.new as Video) : video
              )
            );
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted video
            setVideos((prev) => prev.filter((video) => video.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVideos]);

  return {
    videos,
    loading,
    error,
    refetch: fetchVideos,
  };
}
