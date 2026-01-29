'use client';

import { useState } from 'react';
import { useVideos, type Video } from '@/hooks/useVideos';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

export default function LibraryPage() {
  const { videos, loading, error, refetch } = useVideos();
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
  const [checkingVideos, setCheckingVideos] = useState<Set<string>>(new Set());
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [processingCleanVoice, setProcessingCleanVoice] = useState(false);
  const [cleanVoiceJobs, setCleanVoiceJobs] = useState<Array<{
    id: string;
    status: string;
    downloadUrl?: string;
    statistics?: any;
    error?: string;
  }>>([]);
  const [checkingJobId, setCheckingJobId] = useState<string | null>(null);

  const filteredVideos = videos.filter((video) => {
    if (filter === 'all') return true;
    return video.status === filter;
  });

  const checkVideoStatus = async (heygenVideoId: string) => {
    setCheckingVideos((prev) => new Set(prev).add(heygenVideoId));
    try {
      await fetch(`/api/videos/status/${heygenVideoId}`);
      await refetch();
    } catch (error) {
      console.error('Failed to check video status:', error);
    } finally {
      setCheckingVideos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(heygenVideoId);
        return newSet;
      });
    }
  };

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  };

  const selectAllCompleted = () => {
    const completedIds = videos
      .filter((v) => v.status === 'completed' && v.video_url)
      .map((v) => v.id);
    setSelectedVideos(new Set(completedIds));
  };

  const clearSelection = () => {
    setSelectedVideos(new Set());
  };

  const processWithCleanVoice = async () => {
    const selectedVideoUrls = videos
      .filter((v) => selectedVideos.has(v.id) && v.video_url)
      .map((v) => v.video_url!);

    if (selectedVideoUrls.length === 0) {
      alert('No videos with URLs selected');
      return;
    }

    setProcessingCleanVoice(true);

    try {
      const response = await fetch('/api/cleanvoice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrls: selectedVideoUrls }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process with CleanVoice');
      }

      // Add the new job to the list
      if (data.id) {
        setCleanVoiceJobs((prev) => [
          { id: data.id, status: 'PENDING' },
          ...prev,
        ]);
      }

      setSelectedVideos(new Set());
      alert('Videos submitted to CleanVoice for processing! Click "Check Status" to see progress.');
    } catch (error: any) {
      console.error('CleanVoice error:', error);
      alert(error.message || 'Failed to process with CleanVoice');
    } finally {
      setProcessingCleanVoice(false);
    }
  };

  const checkCleanVoiceStatus = async (jobId: string) => {
    setCheckingJobId(jobId);

    try {
      const response = await fetch(`/api/cleanvoice/status/${jobId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check status');
      }

      // Update the job in the list
      setCleanVoiceJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status: data.status || 'UNKNOWN',
                downloadUrl: data.result?.download_url,
                statistics: data.result?.statistics,
                error: data.error,
              }
            : job
        )
      );
    } catch (error: any) {
      console.error('CleanVoice status check error:', error);
      setCleanVoiceJobs((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, error: error.message } : job
        )
      );
    } finally {
      setCheckingJobId(null);
    }
  };

  const removeCleanVoiceJob = (jobId: string) => {
    setCleanVoiceJobs((prev) => prev.filter((job) => job.id !== jobId));
  };

  const completedVideosCount = videos.filter((v) => v.status === 'completed' && v.video_url).length;

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
        <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Video Library</h1>
            <p className="text-slate-600">
              View and manage all your generated videos
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedVideos.size > 0 && (
              <>
                <span className="text-sm text-slate-600">
                  {selectedVideos.size} selected
                </span>
                <Button onClick={clearSelection} variant="ghost" size="sm">
                  Clear
                </Button>
                <Button
                  onClick={processWithCleanVoice}
                  disabled={processingCleanVoice}
                  size="sm"
                >
                  {processingCleanVoice ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Process with CleanVoice'
                  )}
                </Button>
              </>
            )}
            {completedVideosCount > 0 && selectedVideos.size === 0 && (
              <Button onClick={selectAllCompleted} variant="secondary" size="sm">
                Select All Completed
              </Button>
            )}
            <Button onClick={refetch} variant="secondary" size="sm">
              Refresh
            </Button>
          </div>
        </div>

        {/* CleanVoice Jobs */}
        {cleanVoiceJobs.length > 0 && (
          <Card className="mb-6 border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-purple-900 mb-3">CleanVoice Jobs</h3>
              <div className="space-y-3">
                {cleanVoiceJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-100"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-mono text-slate-600 mb-1">
                        {job.id.slice(0, 8)}...
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            job.status === 'SUCCESS'
                              ? 'success'
                              : job.status === 'FAILURE'
                              ? 'error'
                              : 'warning'
                          }
                        >
                          {job.status}
                        </Badge>
                        {job.statistics && (
                          <span className="text-xs text-slate-500">
                            Removed: {job.statistics.DEADAIR || 0}s silence,{' '}
                            {job.statistics.FILLER_SOUND || 0} fillers
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {job.status === 'SUCCESS' && job.downloadUrl ? (
                        <a
                          href={job.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-sm rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors"
                        >
                          Download
                        </a>
                      ) : job.status !== 'SUCCESS' && job.status !== 'FAILURE' ? (
                        <Button
                          onClick={() => checkCleanVoiceStatus(job.id)}
                          disabled={checkingJobId === job.id}
                          variant="secondary"
                          size="sm"
                        >
                          {checkingJobId === job.id ? (
                            <>
                              <Spinner size="sm" className="mr-1" />
                              Checking...
                            </>
                          ) : (
                            'Check Status'
                          )}
                        </Button>
                      ) : null}
                      <Button
                        onClick={() => removeCleanVoiceJob(job.id)}
                        variant="ghost"
                        size="sm"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
              <Card key={video.id} className={`overflow-hidden transition-all ${selectedVideos.has(video.id) ? 'ring-2 ring-indigo-500' : ''}`}>
                {/* Video Thumbnail/Preview */}
                <div className="aspect-video bg-gray-200 relative">
                  {/* Selection checkbox for completed videos */}
                  {video.status === 'completed' && video.video_url && (
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={selectedVideos.has(video.id)}
                        onChange={() => toggleVideoSelection(video.id)}
                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                  )}
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
                        <span>
                          {video.status === 'pending' ? 'Pending...' : 'Processing...'}
                        </span>
                      </div>
                      <button
                        onClick={() => checkVideoStatus(video.heygen_video_id)}
                        disabled={checkingVideos.has(video.heygen_video_id)}
                        className="w-full px-3 py-1.5 text-sm rounded-lg font-semibold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {checkingVideos.has(video.heygen_video_id)
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
