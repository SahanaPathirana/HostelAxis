-- Migration: Add Staff, VisitorLog, Notification tables + enum values if missing
-- Safe to run: uses IF NOT EXISTS everywhere, won't touch existing data

-- Add missing enum values (PostgreSQL requires IF NOT EXISTS syntax)
DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'Notice';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'Payment';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'Verification';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'Visitor';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create Staff table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Staff" (
    "id"              TEXT NOT NULL,
    "user_id"         TEXT NOT NULL,
    "department"      TEXT,
    "whatsapp_number" TEXT NOT NULL,
    "active"          BOOLEAN NOT NULL DEFAULT true,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Staff_user_id_key" ON "Staff"("user_id");

-- Create VisitorLog table if it doesn't exist
CREATE TABLE IF NOT EXISTS "VisitorLog" (
    "id"           TEXT NOT NULL,
    "student_id"   TEXT NOT NULL,
    "visitor_name" TEXT NOT NULL,
    "relation"     TEXT,
    "in_at"        TIMESTAMP(3) NOT NULL,
    "out_at"       TIMESTAMP(3),
    "notes"        TEXT,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VisitorLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "VisitorLog_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create Notification table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Notification" (
    "id"         TEXT NOT NULL,
    "user_id"    TEXT NOT NULL,
    "type"       "NotificationType" NOT NULL DEFAULT 'General',
    "title"      TEXT NOT NULL,
    "message"    TEXT NOT NULL,
    "read"       BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
