'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useUsage } from '@/hooks/useUsage';
import { useAvatars } from '@/hooks/useAvatars';
import { useAvatarGroups } from '@/hooks/useAvatarGroups';
import { useVoices } from '@/hooks/useVoices';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Progress } from '@/components/ui/Progress';
import type { Avatar, Voice } from '@/types/heygen';
import type { Script } from '@/types/video-job';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const usage = useUsage();
  const { avatars, loading: avatarsLoading } = useAvatars();
  const { groups, loading: groupsLoading } = useAvatarGroups();
  const { voices, loading: voicesLoading } = useVoices();

  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [newScriptTitle, setNewScriptTitle] = useState('');
  const [newScriptText, setNewScriptText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [avatarSearch, setAvatarSearch] = useState('');
  const [avatarsToShow, setAvatarsToShow] = useState(24);
  const [avatarCategory, setAvatarCategory] = useState<'all' | 'professional' | 'lifestyle' | 'ugc' | 'community'>('all');
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [groupAvatars, setGroupAvatars] = useState<Avatar[]>([]);
  const [loadingGroupAvatars, setLoadingGroupAvatars] = useState(false);
  const [voiceSearch, setVoiceSearch] = useState('');
  const [voicesToShow, setVoicesToShow] = useState(24);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handleAddScript = () => {
    if (!newScriptText.trim()) return;

    const script: Script = {
      id: crypto.randomUUID(),
      title: newScriptTitle.trim() || `Video ${scripts.length + 1}`,
      text: newScriptText.trim(),
      createdAt: new Date(),
    };

    setScripts([...scripts, script]);
    setNewScriptTitle('');
    setNewScriptText('');
  };

  const handleDeleteScript = (id: string) => {
    setScripts(scripts.filter((s) => s.id !== id));
  };

  const handleSelectGroup = async (group: any) => {
    setSelectedGroup(group);
    setLoadingGroupAvatars(true);
    setGroupAvatars([]);
    try {
      const response = await fetch(`/api/avatar-groups/${group.id}/avatars`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched avatars:', data.avatars);
        setGroupAvatars(data.avatars || []);
      } else {
        console.error('Failed to fetch avatars:', await response.text());
      }
    } catch (error) {
      console.error('Failed to fetch group avatars:', error);
    } finally {
      setLoadingGroupAvatars(false);
    }
  };

  const handleBackToGroups = () => {
    setSelectedGroup(null);
    setGroupAvatars([]);
  };

  const handlePlayVoice = async (voice: Voice, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent selecting the voice when clicking play

    console.log('Playing voice:', voice.name);
    console.log('Preview audio URL:', voice.preview_audio_url);

    // If already playing this voice, stop it
    if (playingVoiceId === voice.voice_id && audioElement) {
      audioElement.pause();
      setPlayingVoiceId(null);
      setAudioElement(null);
      return;
    }

    // Stop any currently playing audio and wait for it to finish
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    // Check if preview URL exists
    if (!voice.preview_audio_url) {
      console.error('No preview audio URL available for voice:', voice.name);
      alert('Audio preview not available for this voice');
      return;
    }

    // Create and play new audio
    const audio = new Audio(voice.preview_audio_url);
    setPlayingVoiceId(voice.voice_id);
    setAudioElement(audio);

    // Add error listener
    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      console.error('Failed to load audio from:', voice.preview_audio_url);
      setPlayingVoiceId(null);
      setAudioElement(null);
    });

    try {
      console.log('Starting audio playback...');
      await audio.play();
      console.log('Audio playback started successfully');
    } catch (error) {
      console.error('Failed to play audio:', error);
      setPlayingVoiceId(null);
      setAudioElement(null);
      return;
    }

    // Clear playing state when audio ends
    audio.addEventListener('ended', () => {
      console.log('Audio playback ended');
      setPlayingVoiceId(null);
      setAudioElement(null);
    });
  };

  // Auto-select default voice when avatar is selected
  useEffect(() => {
    if (selectedAvatar?.default_voice_id && voices.length > 0) {
      const defaultVoice = voices.find(
        (voice) => voice.voice_id === selectedAvatar.default_voice_id
      );
      if (defaultVoice) {
        setSelectedVoice(defaultVoice);
        console.log('Auto-selected default voice:', defaultVoice.name);
      }
    }
  }, [selectedAvatar, voices]);

  // Filter avatar groups by category and search
  const filteredGroups = groups.filter((group) => {
    const matchesSearch = group.name.toLowerCase().includes(avatarSearch.toLowerCase());
    if (!matchesSearch) return false;

    if (avatarCategory === 'all') return true;
    if (avatarCategory === 'professional') return group.group_type === 'PUBLIC' || group.group_type === 'PUBLIC_KIT';
    if (avatarCategory === 'lifestyle') return group.group_type === 'PUBLIC_PHOTO';
    if (avatarCategory === 'ugc') return group.group_type === 'GENERATED_PHOTO' || group.group_type === 'PHOTO';
    if (avatarCategory === 'community') return group.group_type === 'COMMUNITY_PHOTO';

    return true;
  });

  // Filter voices by search
  const filteredVoices = voices.filter((voice) =>
    voice.name.toLowerCase().includes(voiceSearch.toLowerCase()) ||
    voice.language.toLowerCase().includes(voiceSearch.toLowerCase())
  );

  const handleGenerateVideos = async () => {
    if (!selectedAvatar || !selectedVoice || scripts.length === 0) {
      alert('Please select an avatar, voice, and add at least one script');
      return;
    }

    if (usage.remaining !== undefined && scripts.length > usage.remaining) {
      alert(
        `You only have ${usage.remaining} videos remaining this month. You're trying to generate ${scripts.length} videos.`
      );
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch('/api/videos-bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatarId: selectedAvatar.avatar_id,
          voiceId: selectedVoice.voice_id,
          scripts,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate videos');
      }

      alert(
        `Successfully submitted ${data.successful} out of ${data.total} videos for generation!`
      );
      setScripts([]);
      usage.refetch();
      router.push('/dashboard/history');
    } catch (error: any) {
      alert(error.message || 'Failed to generate videos');
    } finally {
      setGenerating(false);
    }
  };

  if (userLoading || usage.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!usage.hasSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              You need an active subscription to create videos.
            </p>
            <Button onClick={() => router.push('/pricing')}>
              View Pricing Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Usage */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Create Videos
            </h1>
            <p className="text-gray-600">
              Generate multiple AI videos with HeyGen
            </p>
          </div>
          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">Usage this month</div>
            <div className="text-2xl font-bold text-gray-900">
              {usage.usage || 0} / {usage.limit || 0}
            </div>
            <Progress
              value={usage.usage || 0}
              max={usage.limit || 100}
              className="mt-2"
            />
            <div className="text-xs text-gray-500 mt-1">
              {usage.remaining || 0} videos remaining
            </div>
          </Card>
        </div>

        {/* Step 1: Select Avatar */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {selectedGroup ? (
                  <>1. Select Avatar Look from {selectedGroup.name}</>
                ) : (
                  <>1. Select Avatar ({filteredGroups.length} available)</>
                )}
              </CardTitle>
              {selectedGroup && (
                <Button onClick={handleBackToGroups} variant="secondary" size="sm">
                  ← Back to Groups
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {groupsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : selectedGroup ? (
              // Show individual avatar looks
              <>
                {loadingGroupAvatars ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : groupAvatars.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No avatar looks available for this group
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {groupAvatars.map((avatar, index) => (
                        <div
                          key={avatar.avatar_id || `avatar-${index}`}
                          onClick={() => setSelectedAvatar(avatar)}
                          className={`cursor-pointer rounded-lg border-2 p-2 transition ${
                            selectedAvatar?.avatar_id === avatar.avatar_id
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-gray-200 hover:border-indigo-300'
                          }`}
                        >
                          <img
                            src={avatar.preview_image_url}
                            alt={avatar.avatar_name}
                            className="w-full h-32 object-cover rounded-lg mb-2"
                          />
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {avatar.avatar_name}
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedAvatar && (
                      <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                        <span className="text-sm font-medium text-indigo-900">
                          Selected: {selectedAvatar.avatar_name}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              // Show avatar groups
              <>
                {/* Category Filters */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  <button
                    onClick={() => {
                      setAvatarCategory('all');
                      setAvatarsToShow(24);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      avatarCategory === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => {
                      setAvatarCategory('professional');
                      setAvatarsToShow(24);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      avatarCategory === 'professional'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Professional
                  </button>
                  <button
                    onClick={() => {
                      setAvatarCategory('lifestyle');
                      setAvatarsToShow(24);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      avatarCategory === 'lifestyle'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Lifestyle
                  </button>
                  <button
                    onClick={() => {
                      setAvatarCategory('ugc');
                      setAvatarsToShow(24);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      avatarCategory === 'ugc'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    UGC
                  </button>
                  <button
                    onClick={() => {
                      setAvatarCategory('community');
                      setAvatarsToShow(24);
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      avatarCategory === 'community'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Community
                  </button>
                </div>

                <input
                  type="text"
                  value={avatarSearch}
                  onChange={(e) => setAvatarSearch(e.target.value)}
                  placeholder="Search avatars by name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredGroups.slice(0, avatarsToShow).map((group) => (
                    <div
                      key={group.id}
                      onClick={() => handleSelectGroup(group)}
                      className="cursor-pointer rounded-lg border-2 p-2 transition border-gray-200 hover:border-indigo-300"
                    >
                      <img
                        src={group.preview_image}
                        alt={group.name}
                        className="w-full h-32 object-cover rounded-lg mb-2"
                      />
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {group.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {group.num_looks} look{group.num_looks !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>
                {filteredGroups.length > avatarsToShow && (
                  <div className="mt-4 text-center">
                    <Button
                      onClick={() => setAvatarsToShow(avatarsToShow + 24)}
                      variant="secondary"
                    >
                      Load More Avatars ({filteredGroups.length - avatarsToShow} remaining)
                    </Button>
                  </div>
                )}
              </>
            )}

            {selectedAvatar && !selectedGroup && (
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                <span className="text-sm font-medium text-indigo-900">
                  Selected: {selectedAvatar.avatar_name}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Select Voice */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>2. Select Voice ({filteredVoices.length} available)</CardTitle>
          </CardHeader>
          <CardContent>
            {voicesLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={voiceSearch}
                  onChange={(e) => setVoiceSearch(e.target.value)}
                  placeholder="Search voices by name or language..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredVoices.slice(0, voicesToShow).map((voice) => (
                    <div
                      key={voice.voice_id}
                      onClick={() => setSelectedVoice(voice)}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition ${
                        selectedVoice?.voice_id === voice.voice_id
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{voice.name}</div>
                          <div className="text-sm text-gray-600">
                            {voice.language} • {voice.gender}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handlePlayVoice(voice, e)}
                          className={`ml-2 p-2 rounded-full transition hover:bg-gray-200 ${
                            playingVoiceId === voice.voice_id ? 'bg-indigo-100' : ''
                          }`}
                          title={playingVoiceId === voice.voice_id ? 'Stop preview' : 'Play preview'}
                        >
                          {playingVoiceId === voice.voice_id ? (
                            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {filteredVoices.length > voicesToShow && (
                  <div className="mt-4 text-center">
                    <Button
                      onClick={() => setVoicesToShow(voicesToShow + 24)}
                      variant="secondary"
                    >
                      Load More Voices ({filteredVoices.length - voicesToShow} remaining)
                    </Button>
                  </div>
                )}
              </>
            )}
            {selectedVoice && (
              <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                <span className="text-sm font-medium text-indigo-900">
                  Selected: {selectedVoice.name} ({selectedVoice.language})
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Add Scripts */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>3. Add Scripts ({scripts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <input
                type="text"
                value={newScriptTitle}
                onChange={(e) => setNewScriptTitle(e.target.value)}
                placeholder="Video title (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
              />
              <textarea
                value={newScriptText}
                onChange={(e) => setNewScriptText(e.target.value)}
                placeholder="Enter your script here..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
              />
              <Button onClick={handleAddScript} disabled={!newScriptText.trim()}>
                Add Script
              </Button>
            </div>

            {scripts.length > 0 && (
              <div className="space-y-3">
                {scripts.map((script) => (
                  <div
                    key={script.id}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{script.title}</h4>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteScript(script.id)}
                      >
                        Delete
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {script.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleGenerateVideos}
            disabled={
              generating ||
              !selectedAvatar ||
              !selectedVoice ||
              scripts.length === 0
            }
            className="px-12"
          >
            {generating ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Generating...
              </>
            ) : (
              `Generate ${scripts.length} Video${scripts.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
