-- Migration: drop the now-obsolete founder_age column
ALTER TABLE startups
DROP COLUMN IF EXISTS founder_age;
