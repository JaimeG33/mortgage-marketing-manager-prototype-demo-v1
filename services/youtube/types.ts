export interface YouTubeApiErrorResponse {
  error?: {
    code?: number;
    message?: string;
    errors?: Array<{
      reason?: string;
      message?: string;
    }>;
  };
}

export interface YouTubeVideoListResponse extends YouTubeApiErrorResponse {
  items?: YouTubeVideoResource[];
}

export interface YouTubeVideoResource {
  id?: string;
  snippet?: {
    channelId?: string;
    title?: string;
    publishedAt?: string;
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
}

export interface YouTubeChannelListResponse extends YouTubeApiErrorResponse {
  items?: YouTubeChannelResource[];
}

export interface YouTubeChannelResource {
  id?: string;
  snippet?: {
    title?: string;
  };
  statistics?: {
    hiddenSubscriberCount?: boolean;
    subscriberCount?: string;
    viewCount?: string;
    videoCount?: string;
  };
}

export interface PublicYouTubeVideo {
  id: string;
  title: string;
  channelId: string;
  publishedAt: Date;
  viewCount: bigint;
  likeCount: bigint | null;
  commentCount: bigint | null;
}

export interface PublicYouTubeChannel {
  id: string;
  title: string;
  subscriberCount: bigint | null;
  totalViewCount: bigint | null;
  contentCount: number | null;
}
