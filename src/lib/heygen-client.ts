import type { Avatar, Voice, CreateVideoResponse, VideoStatus } from '@/types/heygen';

const HEYGEN_API_BASE = 'https://api.heygen.com';
const API_KEY = process.env.HEYGEN_API_KEY;

async function heygenFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${HEYGEN_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'x-api-key': API_KEY!,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HeyGen API error: ${response.status}`);
  }

  return response.json();
}

export async function fetchAvatarGroups() {
  const data = await heygenFetch('/v2/avatar_group.list?include_public=true');
  return data.data || { total_count: 0, avatar_group_list: [] };
}

export async function fetchAvatarsInGroup(groupId: string): Promise<Avatar[]> {
  const data = await heygenFetch(`/v2/avatar_group/${groupId}/avatars`);
  const avatarList = data.data?.avatar_list || [];

  console.log('Raw avatar list from API for group', groupId, ':', avatarList);

  // Map the response to match our Avatar interface
  const mapped = avatarList.map((avatar: any, index: number) => {
    if (!avatar.name && !avatar.avatar_name) {
      console.log('Avatar without name:', avatar);
    }
    return {
      avatar_id: avatar.id || avatar.avatar_id || `avatar-${index}`,
      avatar_name: avatar.name || avatar.avatar_name || avatar.display_name || `Look ${index + 1}`,
      gender: avatar.gender || 'unknown',
      preview_image_url: avatar.image_url || avatar.preview_image_url,
      preview_video_url: avatar.motion_preview_url || avatar.preview_video_url || undefined,
      is_public: true,
      default_voice_id: avatar.default_voice_id || null,
    };
  });

  console.log('Mapped avatars:', mapped);
  return mapped;
}

export async function fetchAvatars(): Promise<Avatar[]> {
  const data = await heygenFetch('/v2/avatars');
  return data.data.avatars || [];
}

export async function fetchVoices(): Promise<Voice[]> {
  const data = await heygenFetch('/v2/voices');
  const voiceList = data.data.voices || [];

  // Log the first voice to see the structure
  if (voiceList.length > 0) {
    console.log('Sample voice from API:', voiceList[0]);
  }

  // Map the API response to our Voice interface
  return voiceList.map((voice: any) => ({
    voice_id: voice.voice_id,
    language: voice.language,
    language_code: voice.language_code,
    gender: voice.gender,
    name: voice.name,
    preview_audio_url: voice.preview_audio || voice.preview_audio_url || voice.audio_url || '',
    support_emotion: voice.support_emotion || false,
    support_interactive_avatar: voice.support_interactive_avatar || false,
  }));
}

export async function createVideo({
  avatarId,
  voiceId,
  script,
  title,
  orientation = 'landscape',
  callbackUrl,
}: {
  avatarId: string;
  voiceId: string;
  script: string;
  title?: string;
  orientation?: 'landscape' | 'portrait';
  callbackUrl?: string;
}): Promise<CreateVideoResponse> {
  // Map orientation to dimension
  const dimension = orientation === 'portrait'
    ? { width: 720, height: 1280 }  // 9:16 portrait
    : { width: 1280, height: 720 }; // 16:9 landscape (default)

  const requestBody: any = {
    video_inputs: [
      {
        character: {
          type: 'avatar',
          avatar_id: avatarId,
        },
        voice: {
          type: 'text',
          voice_id: voiceId,
          input_text: script,
        },
      },
    ],
    dimension,
    title: title || 'Generated Video',
    test: false,
  };

  // Add callback URL if provided (correct parameter name is callback_url, not callback_id)
  if (callbackUrl) {
    requestBody.callback_url = callbackUrl;
  }

  console.log('Creating video with request body:', JSON.stringify(requestBody, null, 2));

  return await heygenFetch('/v2/video/generate', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
}

export async function getVideoStatus(videoId: string): Promise<VideoStatus> {
  const data = await heygenFetch(`/v1/video_status.get?video_id=${videoId}`);
  return {
    video_id: videoId,
    status: data.data.status,
    video_url: data.data.video_url,
    thumbnail_url: data.data.thumbnail_url,
    duration: data.data.duration,
    error: data.data.error,
  };
}
