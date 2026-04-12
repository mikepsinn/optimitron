ALTER TABLE "Person"
ADD COLUMN IF NOT EXISTS "handle" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Person_handle_key" ON "Person"("handle");
