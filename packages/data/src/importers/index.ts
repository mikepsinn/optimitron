/**
 * Data importers for health data from various sources.
 *
 * All importers produce `ParsedHealthRecord[]` — a flat, uniform format
 * that works across all data sources.
 *
 * Connector reference: https://github.com/mikepsinn/curedao-api/blob/main/app/DataSources/Connectors/
 * Legacy API uses live OAuth2 API connectors; Optimitron uses file-based export parsers.
 * Legacy base connector class: https://github.com/mikepsinn/curedao-api/blob/main/app/DataSources/OAuth2Connector.php
 *
 * Connector mapping (legacy API → Optimitron):
 *   FitbitConnector.php     → fitbit.ts (export parser only)
 *   OuraConnector.php       → oura.ts (export parser only)
 *   WithingsConnector.php   → withings.ts (export parser only)
 *   GoogleFitConnector.php  → google-fit.ts (export parser only)
 *   StravaConnector.php     → strava.ts (export parser only)
 *   MyFitnessPalConnector.php → myfitnesspal.ts (export parser only)
 *
 * TODO: Port from legacy API — live OAuth2 connector framework
 * Legacy API has full OAuth2 flows with token refresh, rate limiting, pagination.
 * See https://github.com/mikepsinn/curedao-api/blob/main/app/DataSources/OAuth2Connector.php
 *
 * TODO: Port from legacy API — Weather connector (environmental data)
 * See https://github.com/mikepsinn/curedao-api/blob/main/app/DataSources/Connectors/WeatherConnector.php
 *
 * TODO: Port from legacy API — Air Quality connector
 * See https://github.com/mikepsinn/curedao-api/blob/main/app/DataSources/Connectors/AirQualityConnector.php
 */
export * from './types';
export * from './standard-variable-names';
export * from './apple-health';
export * from './fitbit';
export * from './oura';
export * from './myfitnesspal';
export * from './withings';
export * from './google-fit';
export * from './cronometer';
export * from './strava';
export * from './csv-generic';
