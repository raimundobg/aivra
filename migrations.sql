-- Add missing columns to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS reschedule_token VARCHAR(64) UNIQUE;

-- Add missing column to patient_files table
ALTER TABLE patient_files
ADD COLUMN IF NOT EXISTS alimentos_no_consume TEXT;

-- Create index on reschedule_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_reschedule_token ON bookings(reschedule_token);
