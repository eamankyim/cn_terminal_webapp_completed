-- Unique customer phone (required) and TIN (optional; Postgres allows multiple NULLs)
UPDATE "customers"
SET "phone" = "phone" || '-' || substr("id", 1, 6)
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id", ROW_NUMBER() OVER (PARTITION BY "phone" ORDER BY "createdAt" ASC) AS rn
    FROM "customers"
  ) ranked
  WHERE ranked.rn > 1
);

UPDATE "customers"
SET "tin" = "tin" || '-' || substr("id", 1, 6)
WHERE "tin" IS NOT NULL AND "id" IN (
  SELECT "id" FROM (
    SELECT "id", ROW_NUMBER() OVER (PARTITION BY "tin" ORDER BY "createdAt" ASC) AS rn
    FROM "customers"
    WHERE "tin" IS NOT NULL
  ) ranked
  WHERE ranked.rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS "customers_phone_key" ON "customers"("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "customers_tin_key" ON "customers"("tin");
