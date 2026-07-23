/*
    Mortgage Marketing Manager Prototype
    Manual first-time database and application-login bootstrap

    Run this entire script in SSMS while connected as a SQL Server administrator
    that can create databases and create or alter SQL logins.

    IMPORTANT:
    Replace @AppPassword before execution. This script deliberately stops when
    the committed placeholder is still present, preventing that placeholder from
    becoming the real application-login password.
*/

USE [master];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @DatabaseName sysname = N'MortgageMarketingPrototype';
DECLARE @AppLogin sysname = N'mortgage_app';
DECLARE @AppPassword nvarchar(128) = N'REPLACE_WITH_A_STRONG_APP_PASSWORD';
DECLARE @Sql nvarchar(max);

IF @AppPassword = N'REPLACE_WITH_A_STRONG_APP_PASSWORD'
BEGIN
    THROW 50001,
        'Replace the @AppPassword placeholder before running this script. Otherwise the placeholder would become the real password.',
        1;
END;

IF LEN(@AppPassword) < 12 OR LEN(@AppPassword) > 128
BEGIN
    THROW 50002, 'The application password must be between 12 and 128 characters.', 1;
END;

IF DB_ID(@DatabaseName) IS NULL
BEGIN
    SET @Sql = N'CREATE DATABASE ' + QUOTENAME(@DatabaseName) + N';';
    EXEC sys.sp_executesql @Sql;
END;

IF SUSER_ID(@AppLogin) IS NULL
BEGIN
    SET @Sql =
        N'CREATE LOGIN ' + QUOTENAME(@AppLogin)
        + N' WITH PASSWORD = ' + QUOTENAME(@AppPassword, '''')
        + N', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF, DEFAULT_DATABASE = '
        + QUOTENAME(@DatabaseName) + N';';
    EXEC sys.sp_executesql @Sql;
END
ELSE
BEGIN
    SET @Sql =
        N'ALTER LOGIN ' + QUOTENAME(@AppLogin)
        + N' WITH PASSWORD = ' + QUOTENAME(@AppPassword, '''') + N';';
    EXEC sys.sp_executesql @Sql;

    SET @Sql =
        N'ALTER LOGIN ' + QUOTENAME(@AppLogin)
        + N' WITH DEFAULT_DATABASE = ' + QUOTENAME(@DatabaseName) + N';';
    EXEC sys.sp_executesql @Sql;

    SET @Sql = N'ALTER LOGIN ' + QUOTENAME(@AppLogin) + N' ENABLE;';
    EXEC sys.sp_executesql @Sql;
END;

SET @Sql =
    N'USE ' + QUOTENAME(@DatabaseName) + N';

IF DATABASE_PRINCIPAL_ID(' + QUOTENAME(@AppLogin, '''') + N') IS NULL
BEGIN
    CREATE USER ' + QUOTENAME(@AppLogin) + N'
        FOR LOGIN ' + QUOTENAME(@AppLogin) + N'
        WITH DEFAULT_SCHEMA = [dbo];
END
ELSE
BEGIN
    ALTER USER ' + QUOTENAME(@AppLogin) + N'
        WITH LOGIN = ' + QUOTENAME(@AppLogin) + N', DEFAULT_SCHEMA = [dbo];
END;

IF NOT EXISTS
(
    SELECT 1
    FROM sys.database_role_members AS drm
    INNER JOIN sys.database_principals AS role_principal
        ON role_principal.principal_id = drm.role_principal_id
    INNER JOIN sys.database_principals AS member_principal
        ON member_principal.principal_id = drm.member_principal_id
    WHERE role_principal.name = N''db_datareader''
      AND member_principal.name = ' + QUOTENAME(@AppLogin, '''') + N'
)
    ALTER ROLE [db_datareader] ADD MEMBER ' + QUOTENAME(@AppLogin) + N';

IF NOT EXISTS
(
    SELECT 1
    FROM sys.database_role_members AS drm
    INNER JOIN sys.database_principals AS role_principal
        ON role_principal.principal_id = drm.role_principal_id
    INNER JOIN sys.database_principals AS member_principal
        ON member_principal.principal_id = drm.member_principal_id
    WHERE role_principal.name = N''db_datawriter''
      AND member_principal.name = ' + QUOTENAME(@AppLogin, '''') + N'
)
    ALTER ROLE [db_datawriter] ADD MEMBER ' + QUOTENAME(@AppLogin) + N';

IF NOT EXISTS
(
    SELECT 1
    FROM sys.database_role_members AS drm
    INNER JOIN sys.database_principals AS role_principal
        ON role_principal.principal_id = drm.role_principal_id
    INNER JOIN sys.database_principals AS member_principal
        ON member_principal.principal_id = drm.member_principal_id
    WHERE role_principal.name = N''db_ddladmin''
      AND member_principal.name = ' + QUOTENAME(@AppLogin, '''') + N'
)
    ALTER ROLE [db_ddladmin] ADD MEMBER ' + QUOTENAME(@AppLogin) + N';';

EXEC sys.sp_executesql @Sql;

SELECT
    @DatabaseName AS DatabaseName,
    @AppLogin AS ApplicationLogin,
    N'db_datareader, db_datawriter, db_ddladmin' AS DatabaseRoles;
GO
