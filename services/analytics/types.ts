export type PlatformName = "YouTube" | "Instagram";

export type PlatformClassName = "youtube" | "instagram";

export type AnalyticsSource = "simulated" | "manual" | "unavailable";

export interface PlatformPostMetrics {
  platform: PlatformName;
  platformClassName: PlatformClassName;
  postUrl: string | null;
  externalPostId: string;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reactions: number;
  leads: number;
  source: AnalyticsSource;
  updatedLabel: string;
}

export interface CombinedMetrics {
  reach: number;
  engagements: number;
  leads: number;
  engagementRate: number;
  leadRate: number;
}

export interface DashboardData {
  contentKey: string;
  contentTitle: string;
  contentDescription: string;
  contentTypeLabel: string;
  campaignName: string | null;
  platformMetrics: PlatformPostMetrics[];
  combinedMetrics: CombinedMetrics;
}
