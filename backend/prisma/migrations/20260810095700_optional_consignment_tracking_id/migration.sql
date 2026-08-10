-- Consignment tracking IDs are assigned only when a job is created for the consignee.
-- Until then, trackingId may be null.
ALTER TABLE "consignments" ALTER COLUMN "trackingId" DROP NOT NULL;
