import "dotenv/config";

import sql from "mssql";

interface BootstrapSettings {
  server: string;
  port: number;
  databaseName: string;
  adminUser: string;
  adminPassword: string;
  appUser: string;
  appPassword: string;
}

const PLACEHOLDER_VALUES = new Set([
  "YOUR_SQL_ADMIN_USER",
  "REPLACE_WITH_SQL_ADMIN_PASSWORD",
  "YOUR_DATABASE_USER",
  "YOUR_DATABASE_PASSWORD",
  "REPLACE_WITH_A_STRONG_APP_PASSWORD",
]);

async function main(): Promise<void> {
  const settings = readSettings();

  console.log(
    `Bootstrapping SQL Server database ${settings.databaseName} and application login ${settings.appUser}...`,
  );

  const pool = new sql.ConnectionPool({
    server: settings.server,
    port: settings.port,
    database: "master",
    user: settings.adminUser,
    password: settings.adminPassword,
    pool: {
      max: 1,
      min: 0,
      idleTimeoutMillis: 10_000,
    },
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  });

  try {
    await pool.connect();

    await pool
      .request()
      .input("DatabaseName", sql.NVarChar(128), settings.databaseName)
      .input("AppLogin", sql.NVarChar(128), settings.appUser)
      .input("AppPassword", sql.NVarChar(128), settings.appPassword)
      .query(`
SET NOCOUNT ON;

DECLARE @Sql nvarchar(max);

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
`);

    console.log("Database and application login bootstrap completed successfully.");
    console.log(
      "The application login can read/write data and apply development migrations in this database.",
    );
  } finally {
    await pool.close();
  }
}

function readSettings(): BootstrapSettings {
  const portText = requireEnvironmentVariable("DB_PORT");
  const port = Number(portText);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("DB_PORT must be an integer between 1 and 65535.");
  }

  const databaseName = requireEnvironmentVariable("DB_NAME");
  const adminUser = requireNonPlaceholder("DB_ADMIN_USER");
  const adminPassword = requireNonPlaceholder("DB_ADMIN_PASSWORD");
  const appUser = requireNonPlaceholder("DB_USER");
  const appPassword = requireNonPlaceholder("DB_PASSWORD");

  validateSqlName("DB_NAME", databaseName);
  validateSqlName("DB_USER", appUser);
  validatePassword("DB_PASSWORD", appPassword);

  if (adminUser.toLocaleLowerCase() === appUser.toLocaleLowerCase()) {
    throw new Error(
      "DB_ADMIN_USER and DB_USER must be different accounts. The web app should not run as the SQL administrator.",
    );
  }

  if (["master", "model", "msdb", "tempdb"].includes(databaseName.toLowerCase())) {
    throw new Error("DB_NAME cannot be a SQL Server system database.");
  }

  return {
    server: requireEnvironmentVariable("DB_HOST"),
    port,
    databaseName,
    adminUser,
    adminPassword,
    appUser,
    appPassword,
  };
}

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function requireNonPlaceholder(name: string): string {
  const value = requireEnvironmentVariable(name);

  if (PLACEHOLDER_VALUES.has(value.trim().toUpperCase())) {
    throw new Error(
      `${name} still contains the committed placeholder. Replace it in .env before running setup.`,
    );
  }

  return value;
}

function validateSqlName(name: string, value: string): void {
  if (value.length > 128) {
    throw new Error(`${name} cannot exceed 128 characters.`);
  }

  if (value.includes("\\")) {
    throw new Error(`${name} cannot contain a backslash for this SQL-login setup.`);
  }
}

function validatePassword(name: string, value: string): void {
  if (value.length < 12 || value.length > 128) {
    throw new Error(`${name} must be between 12 and 128 characters.`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown bootstrap error.";
  console.error("Database bootstrap failed:");
  console.error(message);
  process.exitCode = 1;
});
