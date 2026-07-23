/*
    Mortgage Marketing Manager Prototype
    Phase 2 - Initial SQL Server schema

    Run this script in SQL Server Management Studio while connected with
    an account that can create databases and tables.

    The script is safe to rerun for initial setup: it creates only missing
    database objects and seeds only missing platform lookup rows.
*/

USE [master];
GO

IF DB_ID(N'MortgageMarketingPrototype') IS NULL
BEGIN
    CREATE DATABASE [MortgageMarketingPrototype];
END;
GO

USE [MortgageMarketingPrototype];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    /* 1. Social-media platform lookup */
    IF OBJECT_ID(N'dbo.SocialPlatform', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.SocialPlatform
        (
            PlatformId     INT IDENTITY(1,1) NOT NULL,
            PlatformCode   VARCHAR(30) NOT NULL,
            DisplayName    NVARCHAR(100) NOT NULL,
            IsActive       BIT NOT NULL
                CONSTRAINT DF_SocialPlatform_IsActive DEFAULT (1),
            CreatedAt      DATETIME2(0) NOT NULL
                CONSTRAINT DF_SocialPlatform_CreatedAt DEFAULT (SYSUTCDATETIME()),

            CONSTRAINT PK_SocialPlatform PRIMARY KEY (PlatformId),
            CONSTRAINT UQ_SocialPlatform_PlatformCode UNIQUE (PlatformCode)
        );
    END;

    /* 2. Marketing campaigns */
    IF OBJECT_ID(N'dbo.Campaign', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.Campaign
        (
            CampaignId     INT IDENTITY(1,1) NOT NULL,
            Name           NVARCHAR(150) NOT NULL,
            Description    NVARCHAR(1000) NULL,
            StartDate      DATE NULL,
            EndDate        DATE NULL,
            Status         VARCHAR(30) NOT NULL
                CONSTRAINT DF_Campaign_Status DEFAULT ('PLANNED'),
            CreatedAt      DATETIME2(0) NOT NULL
                CONSTRAINT DF_Campaign_CreatedAt DEFAULT (SYSUTCDATETIME()),
            UpdatedAt      DATETIME2(0) NOT NULL
                CONSTRAINT DF_Campaign_UpdatedAt DEFAULT (SYSUTCDATETIME()),

            CONSTRAINT PK_Campaign PRIMARY KEY (CampaignId),
            CONSTRAINT CK_Campaign_DateRange CHECK
                (EndDate IS NULL OR StartDate IS NULL OR EndDate >= StartDate)
        );
    END;

    /* 3. Central content identity */
    IF OBJECT_ID(N'dbo.ContentItem', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.ContentItem
        (
            ContentItemId  INT IDENTITY(1,1) NOT NULL,
            CampaignId     INT NULL,
            ContentKey     VARCHAR(100) NOT NULL,
            Title          NVARCHAR(200) NOT NULL,
            Description    NVARCHAR(1000) NULL,
            ContentType    VARCHAR(50) NOT NULL,
            IsActive       BIT NOT NULL
                CONSTRAINT DF_ContentItem_IsActive DEFAULT (1),
            CreatedAt      DATETIME2(0) NOT NULL
                CONSTRAINT DF_ContentItem_CreatedAt DEFAULT (SYSUTCDATETIME()),
            UpdatedAt      DATETIME2(0) NOT NULL
                CONSTRAINT DF_ContentItem_UpdatedAt DEFAULT (SYSUTCDATETIME()),

            CONSTRAINT PK_ContentItem PRIMARY KEY (ContentItemId),
            CONSTRAINT UQ_ContentItem_ContentKey UNIQUE (ContentKey),
            CONSTRAINT FK_ContentItem_Campaign FOREIGN KEY (CampaignId)
                REFERENCES dbo.Campaign (CampaignId)
                ON DELETE SET NULL
        );
    END;

    /* 4. Social account/channel/page */
    IF OBJECT_ID(N'dbo.SocialAccount', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.SocialAccount
        (
            SocialAccountId   INT IDENTITY(1,1) NOT NULL,
            PlatformId        INT NOT NULL,
            DisplayName       NVARCHAR(150) NOT NULL,
            ProfileUrl        NVARCHAR(450) NOT NULL,
            ExternalAccountId NVARCHAR(255) NULL,
            IsActive          BIT NOT NULL
                CONSTRAINT DF_SocialAccount_IsActive DEFAULT (1),
            CreatedAt         DATETIME2(0) NOT NULL
                CONSTRAINT DF_SocialAccount_CreatedAt DEFAULT (SYSUTCDATETIME()),
            UpdatedAt         DATETIME2(0) NOT NULL
                CONSTRAINT DF_SocialAccount_UpdatedAt DEFAULT (SYSUTCDATETIME()),

            CONSTRAINT PK_SocialAccount PRIMARY KEY (SocialAccountId),
            CONSTRAINT UQ_SocialAccount_ProfileUrl UNIQUE (ProfileUrl),
            CONSTRAINT FK_SocialAccount_SocialPlatform FOREIGN KEY (PlatformId)
                REFERENCES dbo.SocialPlatform (PlatformId)
        );
    END;

    IF NOT EXISTS
    (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UX_SocialAccount_Platform_ExternalAccountId'
          AND object_id = OBJECT_ID(N'dbo.SocialAccount')
    )
    BEGIN
        CREATE UNIQUE INDEX UX_SocialAccount_Platform_ExternalAccountId
            ON dbo.SocialAccount (PlatformId, ExternalAccountId)
            WHERE ExternalAccountId IS NOT NULL;
    END;

    /* 5. One platform publication of a central content item */
    IF OBJECT_ID(N'dbo.PlatformPost', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.PlatformPost
        (
            PlatformPostId  INT IDENTITY(1,1) NOT NULL,
            ContentItemId   INT NOT NULL,
            SocialAccountId INT NOT NULL,
            ExternalPostId  NVARCHAR(255) NULL,
            PostUrl         NVARCHAR(450) NOT NULL,
            PlatformTitle   NVARCHAR(300) NULL,
            Caption         NVARCHAR(MAX) NULL,
            PostFormat      VARCHAR(50) NULL,
            PublishedAt     DATETIME2(0) NULL,
            IsActive        BIT NOT NULL
                CONSTRAINT DF_PlatformPost_IsActive DEFAULT (1),
            CreatedAt       DATETIME2(0) NOT NULL
                CONSTRAINT DF_PlatformPost_CreatedAt DEFAULT (SYSUTCDATETIME()),
            UpdatedAt       DATETIME2(0) NOT NULL
                CONSTRAINT DF_PlatformPost_UpdatedAt DEFAULT (SYSUTCDATETIME()),

            CONSTRAINT PK_PlatformPost PRIMARY KEY (PlatformPostId),
            CONSTRAINT UQ_PlatformPost_PostUrl UNIQUE (PostUrl),
            CONSTRAINT FK_PlatformPost_ContentItem FOREIGN KEY (ContentItemId)
                REFERENCES dbo.ContentItem (ContentItemId)
                ON DELETE CASCADE,
            CONSTRAINT FK_PlatformPost_SocialAccount FOREIGN KEY (SocialAccountId)
                REFERENCES dbo.SocialAccount (SocialAccountId)
        );
    END;

    IF NOT EXISTS
    (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_PlatformPost_ContentItemId'
          AND object_id = OBJECT_ID(N'dbo.PlatformPost')
    )
    BEGIN
        CREATE INDEX IX_PlatformPost_ContentItemId
            ON dbo.PlatformPost (ContentItemId);
    END;

    IF NOT EXISTS
    (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_PlatformPost_SocialAccountId'
          AND object_id = OBJECT_ID(N'dbo.PlatformPost')
    )
    BEGIN
        CREATE INDEX IX_PlatformPost_SocialAccountId
            ON dbo.PlatformPost (SocialAccountId);
    END;

    IF NOT EXISTS
    (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UX_PlatformPost_Account_ExternalPostId'
          AND object_id = OBJECT_ID(N'dbo.PlatformPost')
    )
    BEGIN
        CREATE UNIQUE INDEX UX_PlatformPost_Account_ExternalPostId
            ON dbo.PlatformPost (SocialAccountId, ExternalPostId)
            WHERE ExternalPostId IS NOT NULL;
    END;

    /* 6. Current metrics for one platform post */
    IF OBJECT_ID(N'dbo.CurrentPostMetrics', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.CurrentPostMetrics
        (
            PlatformPostId  INT NOT NULL,
            ReachCount      BIGINT NULL,
            ReachMetricType VARCHAR(30) NULL,
            LikeCount       BIGINT NULL,
            CommentCount    BIGINT NULL,
            ShareCount      BIGINT NULL,
            SaveCount       BIGINT NULL,
            ReactionCount   BIGINT NULL,
            LeadClickCount  INT NOT NULL
                CONSTRAINT DF_CurrentPostMetrics_LeadClickCount DEFAULT (0),
            MetricsSource   VARCHAR(30) NOT NULL
                CONSTRAINT DF_CurrentPostMetrics_MetricsSource DEFAULT ('MANUAL'),
            UpdatedAt       DATETIME2(0) NOT NULL
                CONSTRAINT DF_CurrentPostMetrics_UpdatedAt DEFAULT (SYSUTCDATETIME()),

            CONSTRAINT PK_CurrentPostMetrics PRIMARY KEY (PlatformPostId),
            CONSTRAINT FK_CurrentPostMetrics_PlatformPost FOREIGN KEY (PlatformPostId)
                REFERENCES dbo.PlatformPost (PlatformPostId)
                ON DELETE CASCADE,
            CONSTRAINT CK_CurrentPostMetrics_NonNegative CHECK
            (
                (ReachCount IS NULL OR ReachCount >= 0) AND
                (LikeCount IS NULL OR LikeCount >= 0) AND
                (CommentCount IS NULL OR CommentCount >= 0) AND
                (ShareCount IS NULL OR ShareCount >= 0) AND
                (SaveCount IS NULL OR SaveCount >= 0) AND
                (ReactionCount IS NULL OR ReactionCount >= 0) AND
                LeadClickCount >= 0
            )
        );
    END;

    /* 7. Current metrics for one social account/channel/page */
    IF OBJECT_ID(N'dbo.CurrentAccountMetrics', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.CurrentAccountMetrics
        (
            SocialAccountId   INT NOT NULL,
            AudienceCount     BIGINT NULL,
            AudienceMetricType VARCHAR(30) NULL,
            TotalViewCount    BIGINT NULL,
            ContentCount      INT NULL,
            MetricsSource     VARCHAR(30) NOT NULL
                CONSTRAINT DF_CurrentAccountMetrics_MetricsSource DEFAULT ('MANUAL'),
            UpdatedAt         DATETIME2(0) NOT NULL
                CONSTRAINT DF_CurrentAccountMetrics_UpdatedAt DEFAULT (SYSUTCDATETIME()),

            CONSTRAINT PK_CurrentAccountMetrics PRIMARY KEY (SocialAccountId),
            CONSTRAINT FK_CurrentAccountMetrics_SocialAccount FOREIGN KEY (SocialAccountId)
                REFERENCES dbo.SocialAccount (SocialAccountId)
                ON DELETE CASCADE,
            CONSTRAINT CK_CurrentAccountMetrics_NonNegative CHECK
            (
                (AudienceCount IS NULL OR AudienceCount >= 0) AND
                (TotalViewCount IS NULL OR TotalViewCount >= 0) AND
                (ContentCount IS NULL OR ContentCount >= 0)
            )
        );
    END;

    /* Seed the platform lookup table */
    MERGE dbo.SocialPlatform AS target
    USING
    (
        VALUES
            ('YOUTUBE',   N'YouTube'),
            ('INSTAGRAM', N'Instagram'),
            ('FACEBOOK',  N'Facebook'),
            ('LINKEDIN',  N'LinkedIn')
    ) AS source (PlatformCode, DisplayName)
        ON target.PlatformCode = source.PlatformCode
    WHEN MATCHED THEN
        UPDATE SET
            target.DisplayName = source.DisplayName,
            target.IsActive = 1
    WHEN NOT MATCHED THEN
        INSERT (PlatformCode, DisplayName)
        VALUES (source.PlatformCode, source.DisplayName);

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO

/* Verification */
SELECT
    TABLE_SCHEMA,
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_SCHEMA, TABLE_NAME;
GO

SELECT
    PlatformId,
    PlatformCode,
    DisplayName,
    IsActive
FROM dbo.SocialPlatform
ORDER BY PlatformId;
GO
