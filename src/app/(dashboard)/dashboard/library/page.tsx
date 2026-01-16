'use client';

import { useState, useEffect } from 'react';
import { useVideos, type Video } from '@/hooks/useVideos';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

export default function LibraryPage() {
  const { videos, loading, error, refetch } = useVideos();
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
  const [pollingVideos, setPollingVideos] = useState<Set<string>>(new Set());

  // Auto-refresh processing videos
  useEffect(() => {
    const processingVideos = videos.filter(
      (v) => v.status === 'pending' || v.status === 'processing'
    );

    if (processingVideos.length === 0) {
      return;
    }

    // Poll every 10 seconds for processing videos
    const interval = setInterval(() => {
      console.log('Polling for video status updates...');
      refetch();
    }, 10000);

    return () => clearInterval(interval);
  }, [videos, refetch]);

  const filteredVideos = videos.filter((video) => {
    if (filter === 'all') return true;
    return video.status === filter;
  });

  const checkVideoStatus = async (heygenVideoId: string) => {
    setPollingVideos((prev) => new Set(prev).add(heygenVideoId));
    try {
      await fetch(`/api/videos/status/${heygenVideoId}`);
      await refetch();
    } catch (error) {
      console.error('Failed to check video status:', error);
    } finally {
      setPollingVideos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(heygenVideoId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status: Video['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusBadge = (status: Video['status']) => {
    return (
      <Badge variant={getStatusColor(status)}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Video Library</h1>
            <p className="text-gray-600">
              View and manage all your generated videos
            </p>
          </div>
          <Button onClick={refetch} variant="secondary">
            Refresh
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-200">
            {['all', 'completed', 'processing', 'failed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 font-medium transition border-b-2 ${
                  filter === status
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <span className="ml-2 text-sm text-gray-500">
                  ({videos.filter((v) => status === 'all' || v.status === status).length})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Videos Grid */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent>
              <p className="text-red-600">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {filteredVideos.length === 0 ? (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {filter === 'all'
                    ? 'No videos yet. Create your first video!'
                    : `No ${filter} videos found.`}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <Card key={video.id} className="overflow-hidden">
                {/* Video Thumbnail/Preview */}
                <div className="aspect-video bg-gray-200 relative">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.script_title || 'Video thumbnail'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <svg
                        className="w-16 h-16 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(video.status)}
                  </div>
                </div>

                {/* Video Details */}
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 truncate">
                    {video.script_title || 'Untitled Video'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {video.script_text}
                  </p>
                  <div className="text-xs text-gray-500 mb-3">
                    Created: {new Date(video.created_at).toLocaleDateString()}
                  </div>

                  {video.status === 'completed' && video.video_url && (
                    <div className="space-y-2">
                      <a
                        href={video.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full px-3 py-1.5 text-sm rounded-lg font-semibold transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        Watch Video
                      </a>
                      <a
                        href={video.video_url}
                        download
                        className="inline-flex items-center justify-center w-full px-3 py-1.5 text-sm rounded-lg font-semibold transition-colors bg-gray-200 text-gray-900 hover:bg-gray-300"
                      >
                        Download
                      </a>
                    </div>
                  )}

                  {(video.status === 'processing' || video.status === 'pending') && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Spinner size="sm" />
                        {video.status === 'pending' ? 'Pending...' : 'Processing...'}
                      </div>
                      <button
                        onClick={() => checkVideoStatus(video.heygen_video_id)}
                        disabled={pollingVideos.has(video.heygen_video_id)}
                        className="w-full px-3 py-1.5 text-sm rounded-lg font-semibold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                      >
                        {pollingVideos.has(video.heygen_video_id)
                          ? 'Checking...'
                          : 'Check Status'}
                      </button>
                    </div>
                  )}

                  {video.status === 'failed' && video.error_message && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {video.error_message}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
