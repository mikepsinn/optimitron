-- Promote MCP OAuth scopes from text[] to a typed enum.
-- The enum labels match the existing wire format ("tasks:read" etc.) so any
-- previously stored rows cast cleanly via the USING clause.
--
-- Idempotent guards handle environments where prior `prisma db push` runs
-- already created either the enum type or enum-typed columns.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'McpScope') THEN
    CREATE TYPE "McpScope" AS ENUM (
      'tasks:read',
      'tasks:write',
      'tasks:personal',
      'agent:run',
      'search'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF (
    SELECT data_type FROM information_schema.columns
    WHERE table_name = 'OAuthAuthCode' AND column_name = 'scopes'
  ) = 'ARRAY' AND (
    SELECT udt_name FROM information_schema.columns
    WHERE table_name = 'OAuthAuthCode' AND column_name = 'scopes'
  ) <> '_McpScope' THEN
    ALTER TABLE "OAuthAuthCode"
      ALTER COLUMN "scopes" DROP DEFAULT,
      ALTER COLUMN "scopes" TYPE "McpScope"[]
        USING "scopes"::text[]::"McpScope"[];
  END IF;
END $$;

DO $$ BEGIN
  IF (
    SELECT data_type FROM information_schema.columns
    WHERE table_name = 'OAuthGrant' AND column_name = 'scopes'
  ) = 'ARRAY' AND (
    SELECT udt_name FROM information_schema.columns
    WHERE table_name = 'OAuthGrant' AND column_name = 'scopes'
  ) <> '_McpScope' THEN
    ALTER TABLE "OAuthGrant"
      ALTER COLUMN "scopes" DROP DEFAULT,
      ALTER COLUMN "scopes" TYPE "McpScope"[]
        USING "scopes"::text[]::"McpScope"[];
  END IF;
END $$;
