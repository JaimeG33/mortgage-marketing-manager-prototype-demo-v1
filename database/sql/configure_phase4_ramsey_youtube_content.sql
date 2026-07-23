USE MortgageMarketingPrototype;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @Now DATETIME2 = SYSUTCDATETIME();
    DECLARE @YouTubePlatformId INT;
    DECLARE @CampaignId INT;
    DECLARE @YouTubeAccountId INT;
    DECLARE @LegacyYouTubeAccountId INT;
    DECLARE @PrimaryContentItemId INT;
    DECLARE @SecondaryContentItemId INT;
    DECLARE @PrimaryPlatformPostId INT;
    DECLARE @SecondaryPlatformPostId INT;

    DECLARE @RamseyProfileUrl NVARCHAR(450) =
        N'https://www.youtube.com/@TheRamseyShow';
    DECLARE @LegacyProfileUrl NVARCHAR(450) =
        N'https://www.youtube.com/@demo-mortgage';
    DECLARE @LegacyPostUrl NVARCHAR(450) =
        N'https://www.youtube.com/watch?v=demo-first-time-buyer';

    DECLARE @PrimaryContentKey VARCHAR(100) =
        'first-time-buyer-five-things';
    DECLARE @SecondaryContentKey VARCHAR(100) =
        'ramsey-show-highlights-p-dcmr6e73u';
    DECLARE @PrimaryVideoId NVARCHAR(255) = N'HLEEwG3dNcg';
    DECLARE @SecondaryVideoId NVARCHAR(255) = N'P_DcMR6e73U';
    DECLARE @PrimaryPostUrl NVARCHAR(450) =
        N'https://www.youtube.com/watch?v=HLEEwG3dNcg';
    DECLARE @SecondaryPostUrl NVARCHAR(450) =
        N'https://www.youtube.com/watch?v=P_DcMR6e73U';

    SELECT @YouTubePlatformId = PlatformId
    FROM dbo.SocialPlatform
    WHERE PlatformCode = 'YOUTUBE';

    IF @YouTubePlatformId IS NULL
    BEGIN
        INSERT INTO dbo.SocialPlatform
            (PlatformCode, DisplayName, IsActive)
        VALUES
            ('YOUTUBE', N'YouTube', 1);

        SET @YouTubePlatformId = SCOPE_IDENTITY();
    END;

    SELECT TOP (1) @CampaignId = CampaignId
    FROM dbo.Campaign
    WHERE Name = N'First-Time Buyer Series'
    ORDER BY CampaignId;

    IF @CampaignId IS NULL
    BEGIN
        INSERT INTO dbo.Campaign
            (Name, Description, Status)
        VALUES
            (
                N'First-Time Buyer Series',
                N'Demonstration campaign containing public mortgage and personal-finance video analytics.',
                'ACTIVE'
            );

        SET @CampaignId = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE dbo.Campaign
        SET
            Description = N'Demonstration campaign containing public mortgage and personal-finance video analytics.',
            Status = 'ACTIVE',
            UpdatedAt = @Now
        WHERE CampaignId = @CampaignId;
    END;

    SELECT @YouTubeAccountId = SocialAccountId
    FROM dbo.SocialAccount
    WHERE ProfileUrl = @RamseyProfileUrl;

    SELECT @LegacyYouTubeAccountId = SocialAccountId
    FROM dbo.SocialAccount
    WHERE ProfileUrl = @LegacyProfileUrl;

    IF @YouTubeAccountId IS NULL AND @LegacyYouTubeAccountId IS NOT NULL
    BEGIN
        UPDATE dbo.SocialAccount
        SET
            PlatformId = @YouTubePlatformId,
            DisplayName = N'The Ramsey Show Highlights',
            ProfileUrl = @RamseyProfileUrl,
            ExternalAccountId = NULL,
            IsActive = 1,
            UpdatedAt = @Now
        WHERE SocialAccountId = @LegacyYouTubeAccountId;

        SET @YouTubeAccountId = @LegacyYouTubeAccountId;
    END;

    IF @YouTubeAccountId IS NULL
    BEGIN
        INSERT INTO dbo.SocialAccount
            (
                PlatformId,
                DisplayName,
                ProfileUrl,
                ExternalAccountId,
                IsActive
            )
        VALUES
            (
                @YouTubePlatformId,
                N'The Ramsey Show Highlights',
                @RamseyProfileUrl,
                NULL,
                1
            );

        SET @YouTubeAccountId = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE dbo.SocialAccount
        SET
            PlatformId = @YouTubePlatformId,
            DisplayName = N'The Ramsey Show Highlights',
            IsActive = 1,
            UpdatedAt = @Now
        WHERE SocialAccountId = @YouTubeAccountId;
    END;

    IF @LegacyYouTubeAccountId IS NOT NULL
       AND @LegacyYouTubeAccountId <> @YouTubeAccountId
    BEGIN
        UPDATE dbo.PlatformPost
        SET IsActive = 0, UpdatedAt = @Now
        WHERE SocialAccountId = @LegacyYouTubeAccountId;

        UPDATE dbo.SocialAccount
        SET IsActive = 0, UpdatedAt = @Now
        WHERE SocialAccountId = @LegacyYouTubeAccountId;
    END;

    SELECT @PrimaryContentItemId = ContentItemId
    FROM dbo.ContentItem
    WHERE ContentKey = @PrimaryContentKey;

    IF @PrimaryContentItemId IS NULL
    BEGIN
        INSERT INTO dbo.ContentItem
            (
                CampaignId,
                ContentKey,
                Title,
                Description,
                ContentType,
                IsActive
            )
        VALUES
            (
                @CampaignId,
                @PrimaryContentKey,
                N'Ramsey Show Highlights — Video HLEEwG3dNcg',
                N'Central content item linked to a real Ramsey Show Highlights YouTube post and the existing manual Instagram demonstration post. The YouTube refresh replaces this placeholder title with the public API title.',
                'VIDEO',
                1
            );

        SET @PrimaryContentItemId = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE dbo.ContentItem
        SET
            CampaignId = @CampaignId,
            Title = CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM dbo.PlatformPost AS ExistingPost
                    INNER JOIN dbo.CurrentPostMetrics AS ExistingMetrics
                        ON ExistingMetrics.PlatformPostId = ExistingPost.PlatformPostId
                    WHERE ExistingPost.ContentItemId = @PrimaryContentItemId
                      AND UPPER(ExistingMetrics.MetricsSource) = 'YOUTUBE_API'
                ) THEN Title
                ELSE N'Ramsey Show Highlights — Video HLEEwG3dNcg'
            END,
            Description = N'Central content item linked to a real Ramsey Show Highlights YouTube post and the existing manual Instagram demonstration post. The YouTube refresh replaces this placeholder title with the public API title.',
            ContentType = 'VIDEO',
            IsActive = 1,
            UpdatedAt = @Now
        WHERE ContentItemId = @PrimaryContentItemId;
    END;

    SELECT @SecondaryContentItemId = ContentItemId
    FROM dbo.ContentItem
    WHERE ContentKey = @SecondaryContentKey;

    IF @SecondaryContentItemId IS NULL
    BEGIN
        INSERT INTO dbo.ContentItem
            (
                CampaignId,
                ContentKey,
                Title,
                Description,
                ContentType,
                IsActive
            )
        VALUES
            (
                @CampaignId,
                @SecondaryContentKey,
                N'Ramsey Show Highlights — Video P_DcMR6e73U',
                N'Secondary content item used to verify that YouTube metrics are matched to the correct external video ID.',
                'VIDEO',
                1
            );

        SET @SecondaryContentItemId = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE dbo.ContentItem
        SET
            CampaignId = @CampaignId,
            Title = CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM dbo.PlatformPost AS ExistingPost
                    INNER JOIN dbo.CurrentPostMetrics AS ExistingMetrics
                        ON ExistingMetrics.PlatformPostId = ExistingPost.PlatformPostId
                    WHERE ExistingPost.ContentItemId = @SecondaryContentItemId
                      AND UPPER(ExistingMetrics.MetricsSource) = 'YOUTUBE_API'
                ) THEN Title
                ELSE N'Ramsey Show Highlights — Video P_DcMR6e73U'
            END,
            Description = N'Secondary content item used to verify that YouTube metrics are matched to the correct external video ID.',
            ContentType = 'VIDEO',
            IsActive = 1,
            UpdatedAt = @Now
        WHERE ContentItemId = @SecondaryContentItemId;
    END;

    SELECT @PrimaryPlatformPostId = PlatformPostId
    FROM dbo.PlatformPost
    WHERE PostUrl = @PrimaryPostUrl;

    IF @PrimaryPlatformPostId IS NULL
    BEGIN
        SELECT @PrimaryPlatformPostId = PlatformPostId
        FROM dbo.PlatformPost
        WHERE PostUrl = @LegacyPostUrl;
    END;

    IF @PrimaryPlatformPostId IS NULL
    BEGIN
        INSERT INTO dbo.PlatformPost
            (
                ContentItemId,
                SocialAccountId,
                ExternalPostId,
                PostUrl,
                PlatformTitle,
                PostFormat,
                IsActive
            )
        VALUES
            (
                @PrimaryContentItemId,
                @YouTubeAccountId,
                @PrimaryVideoId,
                @PrimaryPostUrl,
                N'Ramsey Show Highlights — Video HLEEwG3dNcg',
                'VIDEO',
                1
            );

        SET @PrimaryPlatformPostId = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE dbo.PlatformPost
        SET
            ContentItemId = @PrimaryContentItemId,
            SocialAccountId = @YouTubeAccountId,
            ExternalPostId = @PrimaryVideoId,
            PostUrl = @PrimaryPostUrl,
            PlatformTitle = COALESCE(
                PlatformTitle,
                N'Ramsey Show Highlights — Video HLEEwG3dNcg'
            ),
            PostFormat = 'VIDEO',
            IsActive = 1,
            UpdatedAt = @Now
        WHERE PlatformPostId = @PrimaryPlatformPostId;
    END;

    UPDATE dbo.PlatformPost
    SET
        IsActive = 0,
        UpdatedAt = @Now
    WHERE PostUrl = @LegacyPostUrl
      AND PlatformPostId <> @PrimaryPlatformPostId;

    SELECT @SecondaryPlatformPostId = PlatformPostId
    FROM dbo.PlatformPost
    WHERE PostUrl = @SecondaryPostUrl;

    IF @SecondaryPlatformPostId IS NULL
    BEGIN
        INSERT INTO dbo.PlatformPost
            (
                ContentItemId,
                SocialAccountId,
                ExternalPostId,
                PostUrl,
                PlatformTitle,
                PostFormat,
                IsActive
            )
        VALUES
            (
                @SecondaryContentItemId,
                @YouTubeAccountId,
                @SecondaryVideoId,
                @SecondaryPostUrl,
                N'Ramsey Show Highlights — Video P_DcMR6e73U',
                'VIDEO',
                1
            );

        SET @SecondaryPlatformPostId = SCOPE_IDENTITY();
    END
    ELSE
    BEGIN
        UPDATE dbo.PlatformPost
        SET
            ContentItemId = @SecondaryContentItemId,
            SocialAccountId = @YouTubeAccountId,
            ExternalPostId = @SecondaryVideoId,
            PlatformTitle = COALESCE(
                PlatformTitle,
                N'Ramsey Show Highlights — Video P_DcMR6e73U'
            ),
            PostFormat = 'VIDEO',
            IsActive = 1,
            UpdatedAt = @Now
        WHERE PlatformPostId = @SecondaryPlatformPostId;
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.CurrentPostMetrics
        WHERE PlatformPostId = @PrimaryPlatformPostId
    )
    BEGIN
        INSERT INTO dbo.CurrentPostMetrics
            (
                PlatformPostId,
                ReachCount,
                ReachMetricType,
                LikeCount,
                CommentCount,
                ShareCount,
                SaveCount,
                ReactionCount,
                LeadClickCount,
                MetricsSource
            )
        VALUES
            (
                @PrimaryPlatformPostId,
                11800,
                'VIEWS',
                520,
                74,
                NULL,
                NULL,
                NULL,
                18,
                'SIMULATED'
            );
    END
    ELSE IF NOT EXISTS (
        SELECT 1
        FROM dbo.CurrentPostMetrics
        WHERE PlatformPostId = @PrimaryPlatformPostId
          AND UPPER(MetricsSource) = 'YOUTUBE_API'
    )
    BEGIN
        UPDATE dbo.CurrentPostMetrics
        SET
            ReachCount = 11800,
            ReachMetricType = 'VIEWS',
            LikeCount = 520,
            CommentCount = 74,
            ShareCount = NULL,
            SaveCount = NULL,
            ReactionCount = NULL,
            LeadClickCount = 18,
            MetricsSource = 'SIMULATED',
            UpdatedAt = @Now
        WHERE PlatformPostId = @PrimaryPlatformPostId;
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.CurrentPostMetrics
        WHERE PlatformPostId = @SecondaryPlatformPostId
    )
    BEGIN
        INSERT INTO dbo.CurrentPostMetrics
            (
                PlatformPostId,
                ReachCount,
                ReachMetricType,
                LikeCount,
                CommentCount,
                ShareCount,
                SaveCount,
                ReactionCount,
                LeadClickCount,
                MetricsSource
            )
        VALUES
            (
                @SecondaryPlatformPostId,
                0,
                'VIEWS',
                0,
                0,
                NULL,
                NULL,
                NULL,
                0,
                'SIMULATED'
            );
    END
    ELSE IF NOT EXISTS (
        SELECT 1
        FROM dbo.CurrentPostMetrics
        WHERE PlatformPostId = @SecondaryPlatformPostId
          AND UPPER(MetricsSource) = 'YOUTUBE_API'
    )
    BEGIN
        UPDATE dbo.CurrentPostMetrics
        SET
            ReachCount = 0,
            ReachMetricType = 'VIEWS',
            LikeCount = 0,
            CommentCount = 0,
            ShareCount = NULL,
            SaveCount = NULL,
            ReactionCount = NULL,
            LeadClickCount = 0,
            MetricsSource = 'SIMULATED',
            UpdatedAt = @Now
        WHERE PlatformPostId = @SecondaryPlatformPostId;
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO

SELECT
    ci.ContentKey,
    ci.Title AS ContentTitle,
    sp.PlatformCode,
    sa.DisplayName AS AccountName,
    sa.ProfileUrl,
    sa.ExternalAccountId,
    pp.PlatformPostId,
    pp.ExternalPostId,
    pp.PostUrl,
    pp.PlatformTitle,
    m.ReachCount,
    m.LikeCount,
    m.CommentCount,
    m.ShareCount,
    m.SaveCount,
    m.ReactionCount,
    m.LeadClickCount,
    m.MetricsSource,
    m.UpdatedAt
FROM dbo.ContentItem AS ci
INNER JOIN dbo.PlatformPost AS pp
    ON pp.ContentItemId = ci.ContentItemId
INNER JOIN dbo.SocialAccount AS sa
    ON sa.SocialAccountId = pp.SocialAccountId
INNER JOIN dbo.SocialPlatform AS sp
    ON sp.PlatformId = sa.PlatformId
LEFT JOIN dbo.CurrentPostMetrics AS m
    ON m.PlatformPostId = pp.PlatformPostId
WHERE ci.ContentKey IN (
    'first-time-buyer-five-things',
    'ramsey-show-highlights-p-dcmr6e73u'
)
ORDER BY ci.ContentKey, pp.PlatformPostId;
GO
