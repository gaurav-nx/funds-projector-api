-- Add extended profile fields to users table
-- Based on loan application form requirements

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other')),
ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20) CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed')),
ADD COLUMN IF NOT EXISTS father_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS residential_status VARCHAR(20) CHECK (residential_status IN ('Owned', 'Rental', 'Parental')),
ADD COLUMN IF NOT EXISTS duration_of_stay_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration_of_stay_months INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS number_of_dependents INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS educational_qualification VARCHAR(255);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on gender and marital_status for filtering
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender);
CREATE INDEX IF NOT EXISTS idx_users_marital_status ON users(marital_status);

