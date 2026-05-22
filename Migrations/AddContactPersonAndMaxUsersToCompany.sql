-- Migration: Add ContactPerson and MaxUsers to Company table
-- Date: 2026-05-11
-- Description: Adds ContactPerson and MaxUsers fields to support Super Admin CRUD operations

-- Add ContactPerson column
ALTER TABLE Companies 
ADD COLUMN ContactPerson VARCHAR(100) NULL;

-- Add MaxUsers column with default value of 10
ALTER TABLE Companies 
ADD COLUMN MaxUsers INT NOT NULL DEFAULT 10;

-- Update existing companies to have MaxUsers = 10 if not set
UPDATE Companies 
SET MaxUsers = 10 
WHERE MaxUsers IS NULL OR MaxUsers = 0;
