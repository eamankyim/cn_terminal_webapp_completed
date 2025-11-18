-- Add VETTED status to JobStatus enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'VETTED' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'JobStatus')
    ) THEN
        ALTER TYPE "JobStatus" ADD VALUE IF NOT EXISTS 'VETTED';
    END IF;
END $$;

-- Add VETTING_OFFICER role to UserRole enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'VETTING_OFFICER' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
    ) THEN
        ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'VETTING_OFFICER';
    END IF;
END $$;

