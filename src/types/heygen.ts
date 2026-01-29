export interface Avatar {
  avatar_id: string;
  avatar_name: string;
  gender: string;
  preview_image_url: string;
  preview_video_url?: string;
  is_public: boolean;
  default_voice_id?: string | null;
  avatar_type?: 'avatar' | 'talking_photo';
}

export interface AvatarGroup {
  id: string;
  name: string;
  created_at: number;
  num_looks: number;
  preview_image: string;
  group_type: 'GENERATED_PHOTO' | 'PHOTO' | 'PUBLIC_PHOTO' | 'PUBLIC_KIT' | 'PUBLIC' | 'COMMUNITY_PHOTO';
  train_status: string | null;
  default_voice_id: string | null;
}

export interface Voice {
  voice_id: string;
  language: string;
  language_code: string;
  gender: string;
  name: string;
  preview_audio_url: string;
  support_emotion: boolean;
  support_interactive_avatar: boolean;
}

export interface CreateVideoRequest {
  avatar_id: string;
  voice_id: string;
  script: string;
  title?: string;
}

export interface CreateVideoResponse {
  code: number;
  data: {
    video_id: string;
  };
  message?: string;
}

export interface VideoStatus {
  video_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  error?: {
    code: string;
    message: string;
  };
}
