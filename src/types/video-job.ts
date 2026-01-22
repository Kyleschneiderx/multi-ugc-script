export interface Script {
  id: string;
  title: string;
  text: string;
  orientation?: 'landscape' | 'portrait';
  createdAt: Date;
}

export interface VideoJob {
  id: string;
  scriptId: string;
  scriptTitle: string;
  videoId: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl: string | null;
  thumbnailUrl: string | null;
  error: string | null;
  createdAt: Date;
  completedAt: Date | null;
}
