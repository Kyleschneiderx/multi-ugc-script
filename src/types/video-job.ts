export interface Script {
  id: string;
  title: string;
  text: string;
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
