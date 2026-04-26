-- Add DONATED ActivityType value for donation audit-trail entries (Stripe → IAM 501(c)(3)).
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'DONATED';
