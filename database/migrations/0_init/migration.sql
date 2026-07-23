BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[Campaign] (
    [CampaignId] INT NOT NULL IDENTITY(1,1),
    [Name] NVARCHAR(150) NOT NULL,
    [Description] NVARCHAR(1000),
    [StartDate] DATE,
    [EndDate] DATE,
    [Status] VARCHAR(30) NOT NULL CONSTRAINT [DF_Campaign_Status] DEFAULT 'PLANNED',
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_Campaign_CreatedAt] DEFAULT sysutcdatetime(),
    [UpdatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_Campaign_UpdatedAt] DEFAULT sysutcdatetime(),
    CONSTRAINT [PK_Campaign] PRIMARY KEY CLUSTERED ([CampaignId])
);

-- CreateTable
CREATE TABLE [dbo].[ContentItem] (
    [ContentItemId] INT NOT NULL IDENTITY(1,1),
    [CampaignId] INT,
    [ContentKey] VARCHAR(100) NOT NULL,
    [Title] NVARCHAR(200) NOT NULL,
    [Description] NVARCHAR(1000),
    [ContentType] VARCHAR(50) NOT NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_ContentItem_IsActive] DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_ContentItem_CreatedAt] DEFAULT sysutcdatetime(),
    [UpdatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_ContentItem_UpdatedAt] DEFAULT sysutcdatetime(),
    CONSTRAINT [PK_ContentItem] PRIMARY KEY CLUSTERED ([ContentItemId]),
    CONSTRAINT [UQ_ContentItem_ContentKey] UNIQUE NONCLUSTERED ([ContentKey])
);

-- CreateTable
CREATE TABLE [dbo].[CurrentAccountMetrics] (
    [SocialAccountId] INT NOT NULL,
    [AudienceCount] BIGINT,
    [AudienceMetricType] VARCHAR(30),
    [TotalViewCount] BIGINT,
    [ContentCount] INT,
    [MetricsSource] VARCHAR(30) NOT NULL CONSTRAINT [DF_CurrentAccountMetrics_MetricsSource] DEFAULT 'MANUAL',
    [UpdatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_CurrentAccountMetrics_UpdatedAt] DEFAULT sysutcdatetime(),
    CONSTRAINT [PK_CurrentAccountMetrics] PRIMARY KEY CLUSTERED ([SocialAccountId])
);

-- CreateTable
CREATE TABLE [dbo].[CurrentPostMetrics] (
    [PlatformPostId] INT NOT NULL,
    [ReachCount] BIGINT,
    [ReachMetricType] VARCHAR(30),
    [LikeCount] BIGINT,
    [CommentCount] BIGINT,
    [ShareCount] BIGINT,
    [SaveCount] BIGINT,
    [ReactionCount] BIGINT,
    [LeadClickCount] INT NOT NULL CONSTRAINT [DF_CurrentPostMetrics_LeadClickCount] DEFAULT 0,
    [MetricsSource] VARCHAR(30) NOT NULL CONSTRAINT [DF_CurrentPostMetrics_MetricsSource] DEFAULT 'MANUAL',
    [UpdatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_CurrentPostMetrics_UpdatedAt] DEFAULT sysutcdatetime(),
    CONSTRAINT [PK_CurrentPostMetrics] PRIMARY KEY CLUSTERED ([PlatformPostId])
);

-- CreateTable
CREATE TABLE [dbo].[PlatformPost] (
    [PlatformPostId] INT NOT NULL IDENTITY(1,1),
    [ContentItemId] INT NOT NULL,
    [SocialAccountId] INT NOT NULL,
    [ExternalPostId] NVARCHAR(255),
    [PostUrl] NVARCHAR(450) NOT NULL,
    [PlatformTitle] NVARCHAR(300),
    [Caption] NVARCHAR(max),
    [PostFormat] VARCHAR(50),
    [PublishedAt] DATETIME2,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_PlatformPost_IsActive] DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_PlatformPost_CreatedAt] DEFAULT sysutcdatetime(),
    [UpdatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_PlatformPost_UpdatedAt] DEFAULT sysutcdatetime(),
    CONSTRAINT [PK_PlatformPost] PRIMARY KEY CLUSTERED ([PlatformPostId]),
    CONSTRAINT [UQ_PlatformPost_PostUrl] UNIQUE NONCLUSTERED ([PostUrl])
);

-- CreateTable
CREATE TABLE [dbo].[SocialAccount] (
    [SocialAccountId] INT NOT NULL IDENTITY(1,1),
    [PlatformId] INT NOT NULL,
    [DisplayName] NVARCHAR(150) NOT NULL,
    [ProfileUrl] NVARCHAR(450) NOT NULL,
    [ExternalAccountId] NVARCHAR(255),
    [IsActive] BIT NOT NULL CONSTRAINT [DF_SocialAccount_IsActive] DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_SocialAccount_CreatedAt] DEFAULT sysutcdatetime(),
    [UpdatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_SocialAccount_UpdatedAt] DEFAULT sysutcdatetime(),
    CONSTRAINT [PK_SocialAccount] PRIMARY KEY CLUSTERED ([SocialAccountId]),
    CONSTRAINT [UQ_SocialAccount_ProfileUrl] UNIQUE NONCLUSTERED ([ProfileUrl])
);

-- CreateTable
CREATE TABLE [dbo].[SocialPlatform] (
    [PlatformId] INT NOT NULL IDENTITY(1,1),
    [PlatformCode] VARCHAR(30) NOT NULL,
    [DisplayName] NVARCHAR(100) NOT NULL,
    [IsActive] BIT NOT NULL CONSTRAINT [DF_SocialPlatform_IsActive] DEFAULT 1,
    [CreatedAt] DATETIME2 NOT NULL CONSTRAINT [DF_SocialPlatform_CreatedAt] DEFAULT sysutcdatetime(),
    CONSTRAINT [PK_SocialPlatform] PRIMARY KEY CLUSTERED ([PlatformId]),
    CONSTRAINT [UQ_SocialPlatform_PlatformCode] UNIQUE NONCLUSTERED ([PlatformCode])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_PlatformPost_ContentItemId] ON [dbo].[PlatformPost]([ContentItemId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [IX_PlatformPost_SocialAccountId] ON [dbo].[PlatformPost]([SocialAccountId]);

-- CreateIndex
CREATE UNIQUE NONCLUSTERED INDEX [UX_PlatformPost_Account_ExternalPostId] ON [dbo].[PlatformPost]([SocialAccountId], [ExternalPostId]) WHERE ([ExternalPostId] IS NOT NULL);

-- CreateIndex
CREATE UNIQUE NONCLUSTERED INDEX [UX_SocialAccount_Platform_ExternalAccountId] ON [dbo].[SocialAccount]([PlatformId], [ExternalAccountId]) WHERE ([ExternalAccountId] IS NOT NULL);

-- AddForeignKey
ALTER TABLE [dbo].[ContentItem] ADD CONSTRAINT [FK_ContentItem_Campaign] FOREIGN KEY ([CampaignId]) REFERENCES [dbo].[Campaign]([CampaignId]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CurrentAccountMetrics] ADD CONSTRAINT [FK_CurrentAccountMetrics_SocialAccount] FOREIGN KEY ([SocialAccountId]) REFERENCES [dbo].[SocialAccount]([SocialAccountId]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[CurrentPostMetrics] ADD CONSTRAINT [FK_CurrentPostMetrics_PlatformPost] FOREIGN KEY ([PlatformPostId]) REFERENCES [dbo].[PlatformPost]([PlatformPostId]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PlatformPost] ADD CONSTRAINT [FK_PlatformPost_ContentItem] FOREIGN KEY ([ContentItemId]) REFERENCES [dbo].[ContentItem]([ContentItemId]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[PlatformPost] ADD CONSTRAINT [FK_PlatformPost_SocialAccount] FOREIGN KEY ([SocialAccountId]) REFERENCES [dbo].[SocialAccount]([SocialAccountId]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[SocialAccount] ADD CONSTRAINT [FK_SocialAccount_SocialPlatform] FOREIGN KEY ([PlatformId]) REFERENCES [dbo].[SocialPlatform]([PlatformId]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH


ALTER TABLE dbo.Campaign
ADD CONSTRAINT CK_Campaign_DateRange CHECK
(
    EndDate IS NULL
    OR StartDate IS NULL
    OR EndDate >= StartDate
);

ALTER TABLE dbo.CurrentPostMetrics
ADD CONSTRAINT CK_CurrentPostMetrics_NonNegative CHECK
(
    (ReachCount IS NULL OR ReachCount >= 0)
    AND (LikeCount IS NULL OR LikeCount >= 0)
    AND (CommentCount IS NULL OR CommentCount >= 0)
    AND (ShareCount IS NULL OR ShareCount >= 0)
    AND (SaveCount IS NULL OR SaveCount >= 0)
    AND (ReactionCount IS NULL OR ReactionCount >= 0)
    AND LeadClickCount >= 0
);

ALTER TABLE dbo.CurrentAccountMetrics
ADD CONSTRAINT CK_CurrentAccountMetrics_NonNegative CHECK
(
    (AudienceCount IS NULL OR AudienceCount >= 0)
    AND (TotalViewCount IS NULL OR TotalViewCount >= 0)
    AND (ContentCount IS NULL OR ContentCount >= 0)
);
