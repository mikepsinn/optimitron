-- Deploy only after every grant consumer uses explicit resource identity.
-- Keep all records and the additive (clientId, userId, resource) unique index.
DROP INDEX "OAuthGrant_clientId_userId_key";
