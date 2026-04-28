-- Zero-user cleanup: remove obsolete OAuth permission values from McpScope.
-- Public task reads and manual search are no-scope tools; admin Earth-task
-- writes use tasks:admin.

DELETE FROM "OAuthAuthCode"
WHERE "scopes" && ARRAY['tasks:read'::"McpScope", 'search'::"McpScope"];

DELETE FROM "OAuthGrant"
WHERE "scopes" && ARRAY['tasks:read'::"McpScope", 'search'::"McpScope"];

ALTER TYPE "McpScope" RENAME TO "McpScope_old";

CREATE TYPE "McpScope" AS ENUM (
  'tasks:admin',
  'tasks:personal',
  'agent:run'
);

ALTER TABLE "OAuthAuthCode"
  ALTER COLUMN "scopes" TYPE "McpScope"[]
  USING "scopes"::text[]::"McpScope"[];

ALTER TABLE "OAuthGrant"
  ALTER COLUMN "scopes" TYPE "McpScope"[]
  USING "scopes"::text[]::"McpScope"[];

DROP TYPE "McpScope_old";
