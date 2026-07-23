import { prisma } from "../services/database/prismaClient";

const RAMSEY_PROFILE_URL = "https://www.youtube.com/@TheRamseyShow";
const LEGACY_YOUTUBE_PROFILE_URL = "https://www.youtube.com/@demo-mortgage";
const LEGACY_YOUTUBE_POST_URL =
  "https://www.youtube.com/watch?v=demo-first-time-buyer";
const PRIMARY_CONTENT_KEY = "first-time-buyer-five-things";
const SECONDARY_CONTENT_KEY = "ramsey-show-highlights-p-dcmr6e73u";
const PRIMARY_VIDEO_ID = "HLEEwG3dNcg";
const SECONDARY_VIDEO_ID = "P_DcMR6e73U";

async function main(): Promise<void> {
  const now = new Date();

  const youtubePlatform = await prisma.socialPlatform.upsert({
    where: { PlatformCode: "YOUTUBE" },
    update: {
      DisplayName: "YouTube",
      IsActive: true,
    },
    create: {
      PlatformCode: "YOUTUBE",
      DisplayName: "YouTube",
      IsActive: true,
    },
  });

  const instagramPlatform = await prisma.socialPlatform.upsert({
    where: { PlatformCode: "INSTAGRAM" },
    update: {
      DisplayName: "Instagram",
      IsActive: true,
    },
    create: {
      PlatformCode: "INSTAGRAM",
      DisplayName: "Instagram",
      IsActive: true,
    },
  });

  let campaign = await prisma.campaign.findFirst({
    where: { Name: "First-Time Buyer Series" },
  });

  if (campaign) {
    campaign = await prisma.campaign.update({
      where: { CampaignId: campaign.CampaignId },
      data: {
        Description:
          "Demonstration campaign containing public mortgage and personal-finance video analytics.",
        Status: "ACTIVE",
        UpdatedAt: now,
      },
    });
  } else {
    campaign = await prisma.campaign.create({
      data: {
        Name: "First-Time Buyer Series",
        Description:
          "Demonstration campaign containing public mortgage and personal-finance video analytics.",
        Status: "ACTIVE",
      },
    });
  }

  const primaryContent = await upsertContentItem({
    campaignId: campaign.CampaignId,
    contentKey: PRIMARY_CONTENT_KEY,
    placeholderTitle: `Ramsey Show Highlights — Video ${PRIMARY_VIDEO_ID}`,
    description:
      "Central content item linked to a real Ramsey Show Highlights YouTube post and the existing manual Instagram demonstration post. The YouTube refresh replaces this placeholder title with the public API title.",
    legacyTitle: "5 Things Every First-Time Buyer Should Know",
    now,
  });

  const secondaryContent = await upsertContentItem({
    campaignId: campaign.CampaignId,
    contentKey: SECONDARY_CONTENT_KEY,
    placeholderTitle: `Ramsey Show Highlights — Video ${SECONDARY_VIDEO_ID}`,
    description:
      "Secondary content item used to verify that YouTube metrics are matched to the correct external video ID.",
    now,
  });

  const youtubeAccount = await getOrMigrateRamseyAccount(
    youtubePlatform.PlatformId,
    now,
  );

  const instagramAccount = await prisma.socialAccount.upsert({
    where: {
      ProfileUrl: "https://www.instagram.com/demo.mortgage/",
    },
    update: {
      PlatformId: instagramPlatform.PlatformId,
      DisplayName: "Demo Mortgage Instagram",
      ExternalAccountId: "demo-instagram-account",
      IsActive: true,
      UpdatedAt: now,
    },
    create: {
      PlatformId: instagramPlatform.PlatformId,
      DisplayName: "Demo Mortgage Instagram",
      ProfileUrl: "https://www.instagram.com/demo.mortgage/",
      ExternalAccountId: "demo-instagram-account",
      IsActive: true,
    },
  });

  const primaryYouTubePost = await getOrMigrateYouTubePost({
    contentItemId: primaryContent.ContentItemId,
    socialAccountId: youtubeAccount.SocialAccountId,
    videoId: PRIMARY_VIDEO_ID,
    placeholderTitle: primaryContent.Title,
    legacyPostUrl: LEGACY_YOUTUBE_POST_URL,
    now,
  });

  const secondaryYouTubePost = await getOrMigrateYouTubePost({
    contentItemId: secondaryContent.ContentItemId,
    socialAccountId: youtubeAccount.SocialAccountId,
    videoId: SECONDARY_VIDEO_ID,
    placeholderTitle: secondaryContent.Title,
    now,
  });

  await prisma.platformPost.updateMany({
    where: {
      PostUrl: LEGACY_YOUTUBE_POST_URL,
      PlatformPostId: {
        not: primaryYouTubePost.PlatformPostId,
      },
    },
    data: {
      IsActive: false,
      UpdatedAt: now,
    },
  });

  const instagramPost = await prisma.platformPost.upsert({
    where: {
      PostUrl: "https://www.instagram.com/reel/demo-first-time-buyer/",
    },
    update: {
      ContentItemId: primaryContent.ContentItemId,
      SocialAccountId: instagramAccount.SocialAccountId,
      ExternalPostId: "demo-instagram-post-001",
      PlatformTitle: primaryContent.Title,
      PostFormat: "REEL",
      IsActive: true,
      UpdatedAt: now,
    },
    create: {
      ContentItemId: primaryContent.ContentItemId,
      SocialAccountId: instagramAccount.SocialAccountId,
      ExternalPostId: "demo-instagram-post-001",
      PostUrl: "https://www.instagram.com/reel/demo-first-time-buyer/",
      PlatformTitle: primaryContent.Title,
      PostFormat: "REEL",
      IsActive: true,
    },
  });

  await seedYouTubeMetricsIfNotLive({
    platformPostId: primaryYouTubePost.PlatformPostId,
    reach: 11_800n,
    likes: 520n,
    comments: 74n,
    leadClicks: 18,
    now,
  });

  await seedYouTubeMetricsIfNotLive({
    platformPostId: secondaryYouTubePost.PlatformPostId,
    reach: 0n,
    likes: 0n,
    comments: 0n,
    leadClicks: 0,
    now,
  });

  await prisma.currentPostMetrics.upsert({
    where: { PlatformPostId: instagramPost.PlatformPostId },
    update: {
      ReachCount: 6800n,
      ReachMetricType: "VIEWS",
      LikeCount: 330n,
      CommentCount: 52n,
      ShareCount: 20n,
      SaveCount: 10n,
      ReactionCount: null,
      LeadClickCount: 9,
      MetricsSource: "MANUAL",
      UpdatedAt: now,
    },
    create: {
      PlatformPostId: instagramPost.PlatformPostId,
      ReachCount: 6800n,
      ReachMetricType: "VIEWS",
      LikeCount: 330n,
      CommentCount: 52n,
      ShareCount: 20n,
      SaveCount: 10n,
      LeadClickCount: 9,
      MetricsSource: "MANUAL",
    },
  });

  console.log("Demo database seed completed successfully.");
  console.log(`Primary YouTube video: ${PRIMARY_VIDEO_ID}`);
  console.log(`Secondary YouTube video: ${SECONDARY_VIDEO_ID}`);
}

interface ContentItemSeedInput {
  campaignId: number;
  contentKey: string;
  placeholderTitle: string;
  description: string;
  legacyTitle?: string;
  now: Date;
}

async function upsertContentItem(input: ContentItemSeedInput) {
  const existingContent = await prisma.contentItem.findUnique({
    where: {
      ContentKey: input.contentKey,
    },
  });

  if (!existingContent) {
    return prisma.contentItem.create({
      data: {
        CampaignId: input.campaignId,
        ContentKey: input.contentKey,
        Title: input.placeholderTitle,
        Description: input.description,
        ContentType: "VIDEO",
        IsActive: true,
      },
    });
  }

  const existingPosts = await prisma.platformPost.findMany({
    where: {
      ContentItemId: existingContent.ContentItemId,
    },
    include: {
      CurrentPostMetrics: true,
    },
  });
  const hasLiveYouTubeTitle = existingPosts.some(
    (post) =>
      post.CurrentPostMetrics?.MetricsSource.toUpperCase() === "YOUTUBE_API",
  );
  const shouldReplaceLegacyTitle =
    input.legacyTitle !== undefined &&
    existingContent.Title === input.legacyTitle;
  const title =
    hasLiveYouTubeTitle && !shouldReplaceLegacyTitle
      ? existingContent.Title
      : input.placeholderTitle;

  return prisma.contentItem.update({
    where: {
      ContentItemId: existingContent.ContentItemId,
    },
    data: {
      CampaignId: input.campaignId,
      Title: title,
      Description: input.description,
      ContentType: "VIDEO",
      IsActive: true,
      UpdatedAt: input.now,
    },
  });
}

async function getOrMigrateRamseyAccount(
  youtubePlatformId: number,
  now: Date,
) {
  const existingRamseyAccount = await prisma.socialAccount.findUnique({
    where: {
      ProfileUrl: RAMSEY_PROFILE_URL,
    },
  });

  if (existingRamseyAccount) {
    const updatedAccount = await prisma.socialAccount.update({
      where: {
        SocialAccountId: existingRamseyAccount.SocialAccountId,
      },
      data: {
        PlatformId: youtubePlatformId,
        DisplayName: "The Ramsey Show Highlights",
        IsActive: true,
        UpdatedAt: now,
      },
    });

    await deactivateSeparateLegacyAccount(updatedAccount.SocialAccountId, now);
    return updatedAccount;
  }

  const legacyAccount = await prisma.socialAccount.findUnique({
    where: {
      ProfileUrl: LEGACY_YOUTUBE_PROFILE_URL,
    },
  });

  if (legacyAccount) {
    return prisma.socialAccount.update({
      where: {
        SocialAccountId: legacyAccount.SocialAccountId,
      },
      data: {
        PlatformId: youtubePlatformId,
        DisplayName: "The Ramsey Show Highlights",
        ProfileUrl: RAMSEY_PROFILE_URL,
        ExternalAccountId: null,
        IsActive: true,
        UpdatedAt: now,
      },
    });
  }

  return prisma.socialAccount.create({
    data: {
      PlatformId: youtubePlatformId,
      DisplayName: "The Ramsey Show Highlights",
      ProfileUrl: RAMSEY_PROFILE_URL,
      ExternalAccountId: null,
      IsActive: true,
    },
  });
}

async function deactivateSeparateLegacyAccount(
  activeAccountId: number,
  now: Date,
): Promise<void> {
  const legacyAccount = await prisma.socialAccount.findUnique({
    where: {
      ProfileUrl: LEGACY_YOUTUBE_PROFILE_URL,
    },
  });

  if (!legacyAccount || legacyAccount.SocialAccountId === activeAccountId) {
    return;
  }

  await prisma.platformPost.updateMany({
    where: {
      SocialAccountId: legacyAccount.SocialAccountId,
    },
    data: {
      IsActive: false,
      UpdatedAt: now,
    },
  });

  await prisma.socialAccount.update({
    where: {
      SocialAccountId: legacyAccount.SocialAccountId,
    },
    data: {
      IsActive: false,
      UpdatedAt: now,
    },
  });
}

interface YouTubePostSeedInput {
  contentItemId: number;
  socialAccountId: number;
  videoId: string;
  placeholderTitle: string;
  legacyPostUrl?: string;
  now: Date;
}

async function getOrMigrateYouTubePost(input: YouTubePostSeedInput) {
  const postUrl = `https://www.youtube.com/watch?v=${input.videoId}`;
  const existingPost = await prisma.platformPost.findUnique({
    where: {
      PostUrl: postUrl,
    },
  });

  if (existingPost) {
    return prisma.platformPost.update({
      where: {
        PlatformPostId: existingPost.PlatformPostId,
      },
      data: {
        ContentItemId: input.contentItemId,
        SocialAccountId: input.socialAccountId,
        ExternalPostId: input.videoId,
        PlatformTitle: existingPost.PlatformTitle ?? input.placeholderTitle,
        PostFormat: "VIDEO",
        IsActive: true,
        UpdatedAt: input.now,
      },
    });
  }

  if (input.legacyPostUrl) {
    const legacyPost = await prisma.platformPost.findUnique({
      where: {
        PostUrl: input.legacyPostUrl,
      },
    });

    if (legacyPost) {
      return prisma.platformPost.update({
        where: {
          PlatformPostId: legacyPost.PlatformPostId,
        },
        data: {
          ContentItemId: input.contentItemId,
          SocialAccountId: input.socialAccountId,
          ExternalPostId: input.videoId,
          PostUrl: postUrl,
          PlatformTitle: input.placeholderTitle,
          PostFormat: "VIDEO",
          IsActive: true,
          UpdatedAt: input.now,
        },
      });
    }
  }

  return prisma.platformPost.create({
    data: {
      ContentItemId: input.contentItemId,
      SocialAccountId: input.socialAccountId,
      ExternalPostId: input.videoId,
      PostUrl: postUrl,
      PlatformTitle: input.placeholderTitle,
      PostFormat: "VIDEO",
      IsActive: true,
    },
  });
}

interface YouTubeMetricSeedInput {
  platformPostId: number;
  reach: bigint;
  likes: bigint;
  comments: bigint;
  leadClicks: number;
  now: Date;
}

async function seedYouTubeMetricsIfNotLive(
  input: YouTubeMetricSeedInput,
): Promise<void> {
  const existingMetrics = await prisma.currentPostMetrics.findUnique({
    where: {
      PlatformPostId: input.platformPostId,
    },
  });

  if (existingMetrics?.MetricsSource.toUpperCase() === "YOUTUBE_API") {
    return;
  }

  await prisma.currentPostMetrics.upsert({
    where: {
      PlatformPostId: input.platformPostId,
    },
    update: {
      ReachCount: input.reach,
      ReachMetricType: "VIEWS",
      LikeCount: input.likes,
      CommentCount: input.comments,
      ShareCount: null,
      SaveCount: null,
      ReactionCount: null,
      LeadClickCount: input.leadClicks,
      MetricsSource: "SIMULATED",
      UpdatedAt: input.now,
    },
    create: {
      PlatformPostId: input.platformPostId,
      ReachCount: input.reach,
      ReachMetricType: "VIEWS",
      LikeCount: input.likes,
      CommentCount: input.comments,
      ShareCount: null,
      SaveCount: null,
      ReactionCount: null,
      LeadClickCount: input.leadClicks,
      MetricsSource: "SIMULATED",
      UpdatedAt: input.now,
    },
  });
}

main()
  .catch((error: unknown) => {
    console.error("Demo database seed failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });