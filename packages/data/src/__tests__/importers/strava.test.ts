import { describe, it, expect } from 'vitest';
import { parseStravaActivitiesCsv, summarizeStravaExport } from '../../importers/strava';

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const ACTIVITIES_CSV = `Activity ID,Activity Date,Activity Name,Activity Type,Elapsed Time,Moving Time,Distance,Elevation Gain,Average Heart Rate,Max Heart Rate,Calories,Average Speed,Max Speed,Average Cadence,Average Watts
12345,2024-01-15 07:30:00,Morning Run,Run,1800,1750,5.2,45,155,175,350,10.4,14.2,85,
12346,2024-01-15 17:00:00,Evening Ride,Ride,3600,3400,25.5,280,142,168,600,25.5,42.0,80,185
12347,2024-01-16 06:00:00,Pool Swim,Swim,2400,2200,1.5,,120,140,280,,,`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Strava importer', () => {
  describe('parseStravaActivitiesCsv', () => {
    it('parses activity type, duration, distance', () => {
      const records = parseStravaActivitiesCsv(ACTIVITIES_CSV);
      expect(records.length).toBeGreaterThan(0);

      // Activity type records
      const runActivity = records.find((r) => r.variableName === 'Run');
      expect(runActivity).toBeDefined();
      expect(runActivity!.sourceName).toBe('Strava');

      // Duration
      const runDuration = records.find((r) => r.variableName === 'Run Duration');
      expect(runDuration).toBeDefined();
      expect(runDuration!.value).toBe(30); // 1800s = 30 min

      // Distance
      const runDistance = records.find((r) => r.variableName === 'Run Distance');
      expect(runDistance).toBeDefined();
      expect(runDistance!.value).toBe(5.2);
      expect(runDistance!.unitName).toBe('Kilometres');
    });

    it('parses elevation gain', () => {
      const records = parseStravaActivitiesCsv(ACTIVITIES_CSV);
      const elev = records.filter((r) => r.variableName === 'Elevation Gain');
      expect(elev.length).toBe(2); // Run and Ride have elevation
      expect(elev[0]!.value).toBe(45);
      expect(elev[0]!.unitName).toBe('Metres');
    });

    it('parses heart rate', () => {
      const records = parseStravaActivitiesCsv(ACTIVITIES_CSV);
      const avgHr = records.filter((r) => r.variableName === 'Average Heart Rate During Exercise');
      expect(avgHr.length).toBe(3);
      expect(avgHr[0]!.value).toBe(155);

      const maxHr = records.filter((r) => r.variableName === 'Max Heart Rate During Exercise');
      expect(maxHr.length).toBe(3);
    });

    it('parses calories', () => {
      const records = parseStravaActivitiesCsv(ACTIVITIES_CSV);
      const cal = records.filter((r) => r.variableName === 'Calories Burned');
      expect(cal.length).toBe(3);
      expect(cal[0]!.value).toBe(350);
    });

    it('parses speed', () => {
      const records = parseStravaActivitiesCsv(ACTIVITIES_CSV);
      const avgSpeed = records.find((r) => r.variableName === 'Run Average Speed');
      expect(avgSpeed).toBeDefined();
      expect(avgSpeed!.value).toBe(10.4);
    });

    it('parses power (cycling)', () => {
      const records = parseStravaActivitiesCsv(ACTIVITIES_CSV);
      const power = records.find((r) => r.variableName === 'Ride Average Power');
      expect(power).toBeDefined();
      expect(power!.value).toBe(185);
      expect(power!.unitName).toBe('Watts');
    });

    it('includes activity name in notes', () => {
      const records = parseStravaActivitiesCsv(ACTIVITIES_CSV);
      const morningRun = records.find(
        (r) => r.variableName === 'Run' && r.note === 'Morning Run',
      );
      expect(morningRun).toBeDefined();
    });

    it('handles missing optional fields (swim has no elevation)', () => {
      const records = parseStravaActivitiesCsv(ACTIVITIES_CSV);
      // Swim should not have elevation
      const swimElev = records.find(
        (r) => r.variableName === 'Elevation Gain' && r.note === 'Pool Swim',
      );
      expect(swimElev).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('returns empty for empty CSV', () => {
      expect(parseStravaActivitiesCsv('')).toEqual([]);
    });

    it('returns empty for headers only', () => {
      expect(parseStravaActivitiesCsv('Activity Date,Activity Type')).toEqual([]);
    });
  });

  describe('summarizeStravaExport', () => {
    it('produces correct summary', () => {
      const records = parseStravaActivitiesCsv(ACTIVITIES_CSV);
      const summary = summarizeStravaExport(records);

      expect(summary.totalRecords).toBe(records.length);
      expect(summary.sourceNames).toEqual(['Strava']);
      expect(summary.dateRange).not.toBeNull();
    });
  });
});
