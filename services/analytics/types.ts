export type PlatformName = "YouTube" | "Instagram";

export type AnalyticsSource = "simulated" | "manual";

export interface PlatformPostMetrics {
  platform: PlatformName;
  platformClassName: "youtube" | "instagram";
  postUrl: string | null;
  externalPostId: string;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
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
