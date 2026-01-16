export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          stripe_customer_id?: string | null;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_price_id: string;
          plan_type: 'basic' | 'pro';
          status: 'active' | 'canceled' | 'past_due' | 'incomplete';
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_price_id: string;
          plan_type: 'basic' | 'pro';
          status: 'active' | 'canceled' | 'past_due' | 'incomplete';
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          stripe_price_id?: string;
          plan_type?: 'basic' | 'pro';
          status?: 'active' | 'canceled' | 'past_due' | 'incomplete';
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          updated_at?: string;
        };
      };
      video_usage: {
        Row: {
          id: string;
          user_id: string;
          year: number;
          month: number;
          videos_generated: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          year: number;
          month: number;
          videos_generated?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          videos_generated?: number;
          updated_at?: string;
        };
      };
      videos: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          heygen_video_id: string;
          script_title?: string | null;
          script_text: string;
          avatar_id: string;
          voice_id: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          video_url?: string | null;
          thumbnail_url?: string | null;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          video_url?: string | null;
          thumbnail_url?: string | null;
          error_message?: string | null;
          completed_at?: string | null;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type VideoUsage = Database['public']['Tables']['video_usage']['Row'];
export type Video = Database['public']['Tables']['videos']['Row'];
