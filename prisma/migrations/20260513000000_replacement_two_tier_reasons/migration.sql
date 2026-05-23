-- Replacement two-tier reason taxonomy + items affected
-- Per Aina's testing feedback (May 13, 2026): replace the single
-- `reason` string with multi-select Main + Sub arrays, and break out
-- `itemsAffected` from the old `itemsToShip` field. Old columns are
-- preserved for backwards compatibility with existing rows.

ALTER TABLE "Replacement"
  ADD COLUMN "reasonMains"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "reasonSubs"    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "itemsAffected" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
