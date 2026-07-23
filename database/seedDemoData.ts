import { prisma } from "../services/database/prismaClient";

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
        Description: "Demonstration campaign for first-time homebuyer content.",
        Status: "ACTIVE",
        UpdatedAt: now,
      },
    });
  } else {
    campaign = await prisma.campaign.create({
      data: {
        Name: "First-Time Buyer Series",
        Description: "Demonstration campaign for first-time homebuyer content.",
        Status: "ACTIVE",
      },
    });
  }

  const contentItem = await prisma.contentItem.upsert({
    where: {
      ContentKey: "first-time-buyer-five-things",
    },
    update: {
      CampaignId: campaign.CampaignId,
      Title: "5 Things Every First-Time Buyer Should Know",
      Description:
        "One central content item represented by matching YouTube and Instagram posts.",
      ContentType: "SHORT_VIDEO",
      IsActive: true,
      UpdatedAt: now,
    },
    create: {
      CampaignId: campaign.CampaignId,
      ContentKey: "first-time-buyer-five-things",
      Title: "5 Things Every First-Time Buyer Should Know",
      Description:
        "One central content item represented by matching YouTube and Instagram posts.",
      ContentType: "SHORT_VIDEO",
      IsActive: true,
    },
  });

  const youtubeAccount = await prisma.socialAccount.upsert({
    where: {
      ProfileUrl: "https://www.youtube.com/@demo-mortgage",
    },
    update: {
      PlatformId: youtubePlatform.PlatformId,
      DisplayName: "Demo Mortgage YouTube",
      ExternalAccountId: "demo-youtube-channel",
      IsActive: true,
      UpdatedAt: now,
    },
    create: {
      PlatformId: youtubePlatform.PlatformId,
      DisplayName: "Demo Mortgage YouTube",
      ProfileUrl: "https://www.youtube.com/@demo-mortgage",
      ExternalAccountId: "demo-youtube-channel",
      IsActive: true,
    },
  });

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

  const youtubePost = await prisma.platformPost.upsert({
    where: {
      PostUrl:
        "https://www.youtube.com/watch?v=demo-first-time-buyer",
    },
    update: {
      ContentItemId: contentItem.ContentItemId,
      SocialAccountId: youtubeAccount.SocialAccountId,
      ExternalPostId: "demo-youtube-post-001",
      PlatformTitle: contentItem.Title,
      PostFormat: "SHORT",
      IsActive: true,
      UpdatedAt: now,
    },
    create: {
      ContentItemId: contentItem.ContentItemId,
      SocialAccountId: youtubeAccount.SocialAccountId,
      ExternalPostId: "demo-youtube-post-001",
      PostUrl:
        "https://www.youtube.com/watch?v=demo-first-time-buyer",
      PlatformTitle: contentItem.Title,
      PostFormat: "SHORT",
      IsActive: true,
    },
  });

  const instagramPost = await prisma.platformPost.upsert({
    where: {
      PostUrl:
        "https://www.instagram.com/reel/demo-first-time-buyer/",
    },
    update: {
      ContentItemId: contentItem.ContentItemId,
      SocialAccountId: instagramAccount.SocialAccountId,
      ExternalPostId: "demo-instagram-post-001",
      PlatformTitle: contentItem.Title,
      PostFormat: "REEL",
      IsActive: true,
      UpdatedAt: now,
    },
    create: {
      ContentItemId: contentItem.ContentItemId,
      SocialAccountId: instagramAccount.SocialAccountId,
      ExternalPostId: "demo-instagram-post-001",
      PostUrl:
        "https://www.instagram.com/reel/demo-first-time-buyer/",
      PlatformTitle: contentItem.Title,
      PostFormat: "REEL",
      IsActive: true,
    },
  });

  await prisma.currentPostMetrics.upsert({
    where: { PlatformPostId: youtubePost.PlatformPostId },
    update: {
      ReachCount: 11800n,
      ReachMetricType: "VIEWS",
      LikeCount: 520n,
      CommentCount: 74n,
      ShareCount: 30n,
      SaveCount: null,
      ReactionCount: null,
      LeadClickCount: 18,
      MetricsSource: "SIMULATED",
      UpdatedAt: now,
    },
    create: {
      PlatformPostId: youtubePost.PlatformPostId,
      ReachCount: 11800n,
      ReachMetricType: "VIEWS",
      LikeCount: 520n,
      CommentCount: 74n,
      ShareCount: 30n,
      LeadClickCount: 18,
      MetricsSource: "SIMULATED",
    },
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