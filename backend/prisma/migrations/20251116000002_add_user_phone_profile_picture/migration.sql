-- Add phone and profilePicture fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profilePicture" TEXT;

