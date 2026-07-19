-- Preview database anonymization SETUP.
--
-- Runs via `psql --file` before the direct masking updates. Sets up the
-- anon extension and helper functions they reference. Must be idempotent.
--
-- Column updates live in anonymization-updates.sql. Direct updates avoid
-- SECURITY LABEL session-preload requirements on managed Neon branches.

-- Neon ships `anon` (postgresql_anonymizer) as a beta/unstable extension
-- and refuses to install it unless the session opts in. Acknowledge that
-- before CREATE EXTENSION. See https://neon.com/docs/extensions/postgresql-anonymizer
SET neon.allow_unstable_extensions = 'true';
CREATE EXTENSION IF NOT EXISTS anon CASCADE;
SELECT anon.init();

-- Neon-managed `anon` extension does not grant CREATE on its schema to the
-- database role, so we install our placeholder helper in `public` (which we
-- own) and use it from anonymization-updates.sql.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'dummy_safe_text'
      AND p.pronargs = 0
  ) THEN
    EXECUTE $fn$
      CREATE FUNCTION public.dummy_safe_text()
      RETURNS text
      LANGUAGE sql
      STABLE
      AS $body$ SELECT '[preview redacted]'::text $body$
    $fn$;
  END IF;
END $$;
