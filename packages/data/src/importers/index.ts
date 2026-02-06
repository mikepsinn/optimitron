/**
 * Data importers for health data from various sources.
 *
 * All importers produce `ParsedHealthRecord[]` — a flat, uniform format
 * that works across all data sources.
 *
 * QuantiModo connector reference: https://github.com/mikepsinn/quantimodo-api/blob/main/app/DataSources/Connectors/
 * QuantiModo uses live OAuth2 API connectors; Optomitron uses file-based export parsers.
 * QuantiModo base connector class: https://github.com/mikepsinn/quantimodo-api/blob/main/app/DataSources/OAuth2Connector.php
 *
 * Connector mapping (QuantiModo → Optomitron):
 *   FitbitConnector.php     → fitbit.ts (export parser only)
 *   OuraConnector.php       → oura.ts (export parser only)
 *   WithingsConnector.php   → withings.ts (export parser only)
 *   GoogleFitConnector.php  → google-fit.ts (export parser only)
 *   StravaConnector.php     → strava.ts (export parser only)
 *   MyFitnessPalConnector.php → myfitnesspal.ts (export parser only)
 *
 * TODO: Port from QuantiModo — live OAuth2 connector framework
 * QuantiModo has full OAuth2 flows with token refresh, rate limiting, pagination.
 * See https://github.com/mikepsinn/quantimodo-api/blob/main/app/DataSources/OAuth2Connector.php
 *
 * TODO: Port from QuantiModo — Weather connector (environmental data)
 * See https://github.com/mikepsinn/quantimodo-api/blob/main/app/DataSources/Connectors/WeatherConnector.php
 *
 * TODO: Port from QuantiModo — Air Quality connector
 * See https://github.com/mikepsinn/quantimodo-api/blob/main/app/DataSources/Connectors/AirQualityConnector.php
 */
export * from './types.js';
export * from './standard-variable-names.js';
export * from './apple-health.js';
export * from './fitbit.js';
export * from './oura.js';
export * from './myfitnesspal.js';
export * from './withings.js';
export * from './google-fit.js';
export * from './cronometer.js';
export * from './strava.js';
export * from './csv-generic.js';
