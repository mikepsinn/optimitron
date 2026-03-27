import { describe, it, expect } from 'vitest';
import {
  parseAppleHealthXML,
  streamParseAppleHealthXML,
  getAppleHealthTypeMapping,
  summarizeAppleHealthExport,
} from '../../importers/apple-health';
import type { ParsedHealthRecord } from '../../importers/apple-health';

// ---------------------------------------------------------------------------
// Test fixtures — valid Apple Health XML snippets
// ---------------------------------------------------------------------------

/** Minimal valid export with a few record types */
const SAMPLE_EXPORT = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE HealthData [
]>
<HealthData locale="en_US">
 <ExportDate value="2024-06-01 12:00:00 -0600"/>
 <Me HKCharacteristicTypeIdentifierDateOfBirth="1990-01-01" HKCharacteristicTypeIdentifierBiologicalSex="HKBiologicalSexMale"/>

 <Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Apple Watch" unit="count/min" creationDate="2024-01-15 08:30:00 -0600" startDate="2024-01-15 08:30:00 -0600" endDate="2024-01-15 08:30:00 -0600" value="72"/>

 <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" creationDate="2024-01-15 09:00:00 -0600" startDate="2024-01-15 08:00:00 -0600" endDate="2024-01-15 09:00:00 -0600" value="1250"/>

 <Record type="HKQuantityTypeIdentifierBodyMass" sourceName="Withings" unit="kg" creationDate="2024-01-15 07:00:00 -0600" startDate="2024-01-15 07:00:00 -0600" endDate="2024-01-15 07:00:00 -0600" value="75.5"/>

 <Record type="HKQuantityTypeIdentifierActiveEnergyBurned" sourceName="Apple Watch" unit="kcal" creationDate="2024-01-15 10:00:00 -0600" startDate="2024-01-15 09:00:00 -0600" endDate="2024-01-15 10:00:00 -0600" value="245.3"/>

 <Record type="HKQuantityTypeIdentifierBloodPressureSystolic" sourceName="Omron" unit="mmHg" creationDate="2024-01-15 07:30:00 -0600" startDate="2024-01-15 07:30:00 -0600" endDate="2024-01-15 07:30:00 -0600" value="120"/>

 <Record type="HKQuantityTypeIdentifierBloodPressureDiastolic" sourceName="Omron" unit="mmHg" creationDate="2024-01-15 07:30:00 -0600" startDate="2024-01-15 07:30:00 -0600" endDate="2024-01-15 07:30:00 -0600" value="80"/>

 <Record type="HKQuantityTypeIdentifierOxygenSaturation" sourceName="Apple Watch" unit="%" creationDate="2024-01-15 23:00:00 -0600" startDate="2024-01-15 23:00:00 -0600" endDate="2024-01-15 23:00:00 -0600" value="0.97"/>

 <Record type="HKQuantityTypeIdentifierRespiratoryRate" sourceName="Apple Watch" unit="count/min" creationDate="2024-01-15 23:00:00 -0600" startDate="2024-01-15 23:00:00 -0600" endDate="2024-01-15 23:00:00 -0600" value="14"/>

 <Record type="HKQuantityTypeIdentifierDistanceWalkingRunning" sourceName="iPhone" unit="mi" creationDate="2024-01-15 18:00:00 -0600" startDate="2024-01-15 17:00:00 -0600" endDate="2024-01-15 18:00:00 -0600" value="2.5"/>

 <Record type="HKQuantityTypeIdentifierDietaryEnergyConsumed" sourceName="MyFitnessPal" unit="kcal" creationDate="2024-01-15 12:30:00 -0600" startDate="2024-01-15 12:00:00 -0600" endDate="2024-01-15 12:30:00 -0600" value="650"/>

 <Record type="HKQuantityTypeIdentifierDietaryWater" sourceName="WaterMinder" unit="mL" creationDate="2024-01-15 14:00:00 -0600" startDate="2024-01-15 14:00:00 -0600" endDate="2024-01-15 14:00:00 -0600" value="500"/>

 <Record type="HKQuantityTypeIdentifierBodyTemperature" sourceName="Thermometer" unit="degF" creationDate="2024-01-15 08:00:00 -0600" startDate="2024-01-15 08:00:00 -0600" endDate="2024-01-15 08:00:00 -0600" value="98.6"/>

</HealthData>`;

/** Sleep analysis record (category type with duration) */
const SLEEP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
 <Record type="HKCategoryTypeIdentifierSleepAnalysis" sourceName="Apple Watch" unit="" creationDate="2024-01-15 06:00:00 -0600" startDate="2024-01-14 22:30:00 -0600" endDate="2024-01-15 06:00:00 -0600" value="1"/>
</HealthData>`;

/** Mindful session record */
const MINDFUL_XML = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
 <Record type="HKCategoryTypeIdentifierMindfulSession" sourceName="Headspace" unit="" creationDate="2024-01-15 07:30:00 -0600" startDate="2024-01-15 07:00:00 -0600" endDate="2024-01-15 07:20:00 -0600" value="0"/>
</HealthData>`;

/** Weight in pounds (needs unit conversion) */
const WEIGHT_LB_XML = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
 <Record type="HKQuantityTypeIdentifierBodyMass" sourceName="Health" unit="lb" creationDate="2024-01-15 07:00:00 -0600" startDate="2024-01-15 07:00:00 -0600" endDate="2024-01-15 07:00:00 -0600" value="165"/>
</HealthData>`;

/** Temperature in Celsius (needs unit conversion) */
const TEMP_CELSIUS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
 <Record type="HKQuantityTypeIdentifierBodyTemperature" sourceName="Thermometer" unit="degC" creationDate="2024-01-15 08:00:00 -0600" startDate="2024-01-15 08:00:00 -0600" endDate="2024-01-15 08:00:00 -0600" value="37"/>
</HealthData>`;

/** Walking distance in miles (needs conversion to km) */
const DISTANCE_MI_XML = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
 <Record type="HKQuantityTypeIdentifierDistanceWalkingRunning" sourceName="iPhone" unit="mi" creationDate="2024-01-15 18:00:00 -0600" startDate="2024-01-15 17:00:00 -0600" endDate="2024-01-15 18:00:00 -0600" value="3.1"/>
</HealthData>`;

/** Water in fluid ounces (needs conversion to mL) */
const WATER_FLOZ_XML = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
 <Record type="HKQuantityTypeIdentifierDietaryWater" sourceName="WaterMinder" unit="fl_oz_us" creationDate="2024-01-15 14:00:00 -0600" startDate="2024-01-15 14:00:00 -0600" endDate="2024-01-15 14:00:00 -0600" value="16"/>
</HealthData>`;

/** Height in inches (needs conversion to cm) */
const HEIGHT_IN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
 <Record type="HKQuantityTypeIdentifierHeight" sourceName="Health" unit="in" creationDate="2024-01-15 07:00:00 -0600" startDate="2024-01-15 07:00:00 -0600" endDate="2024-01-15 07:00:00 -0600" value="70"/>
</HealthData>`;

/** Unknown/unmapped type — should be skipped */
const UNKNOWN_TYPE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
 <Record type="HKQuantityTypeIdentifierSomeFutureType" sourceName="FutureApp" unit="count" creationDate="2024-01-15 08:00:00 -0600" startDate="2024-01-15 08:00:00 -0600" endDate="2024-01-15 08:00:00 -0600" value="42"/>
</HealthData>`;

/** Empty export */
const EMPTY_XML = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
 <ExportDate value="2024-06-01 12:00:00 -0600"/>
</HealthData>`;

/** XML with mixed mapped and unmapped types */
const MIXED_XML = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
 <Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Apple Watch" unit="count/min" creationDate="2024-01-15 08:30:00 -0600" startDate="2024-01-15 08:30:00 -0600" endDate="2024-01-15 08:30:00 -0600" value="72"/>
 <Record type="HKQuantityTypeIdentifierSomeFutureType" sourceName="FutureApp" unit="count" creationDate="2024-01-15 08:00:00 -0600" startDate="2024-01-15 08:00:00 -0600" endDate="2024-01-15 08:00:00 -0600" value="42"/>
 <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" creationDate="2024-01-15 09:00:00 -0600" startDate="2024-01-15 08:00:00 -0600" endDate="2024-01-15 09:00:00 -0600" value="5000"/>
</HealthData>`;

/** Multiple records across different dates for summary testing */
const MULTI_DATE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
 <Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Apple Watch" unit="count/min" creationDate="2024-01-10 08:30:00 -0600" startDate="2024-01-10 08:30:00 -0600" endDate="2024-01-10 08:30:00 -0600" value="68"/>
 <Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Apple Watch" unit="count/min" creationDate="2024-01-15 08:30:00 -0600" startDate="2024-01-15 08:30:00 -0600" endDate="2024-01-15 08:30:00 -0600" value="72"/>
 <Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Fitbit" unit="count/min" creationDate="2024-01-20 08:30:00 -0600" startDate="2024-01-20 08:30:00 -0600" endDate="2024-01-20 08:30:00 -0600" value="75"/>
 <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" creationDate="2024-01-15 18:00:00 -0600" startDate="2024-01-15 09:00:00 -0600" endDate="2024-01-15 18:00:00 -0600" value="8500"/>
 <Record type="HKQuantityTypeIdentifierBodyMass" sourceName="Withings" unit="kg" creationDate="2024-01-12 07:00:00 -0600" startDate="2024-01-12 07:00:00 -0600" endDate="2024-01-12 07:00:00 -0600" value="74.2"/>
</HealthData>`;

/** Body fat and oxygen saturation (stored as 0–1, should convert to %) */
const PERCENTAGE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
 <Record type="HKQuantityTypeIdentifierBodyFatPercentage" sourceName="Scale" unit="%" creationDate="2024-01-15 07:00:00 -0600" startDate="2024-01-15 07:00:00 -0600" endDate="2024-01-15 07:00:00 -0600" value="0.22"/>
 <Record type="HKQuantityTypeIdentifierOxygenSaturation" sourceName="Apple Watch" unit="%" creationDate="2024-01-15 23:00:00 -0600" startDate="2024-01-15 23:00:00 -0600" endDate="2024-01-15 23:00:00 -0600" value="0.98"/>
</HealthData>`;

/** Nutrition records */
const NUTRITION_XML = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
 <Record type="HKQuantityTypeIdentifierDietaryProtein" sourceName="MyFitnessPal" unit="g" creationDate="2024-01-15 12:30:00 -0600" startDate="2024-01-15 12:00:00 -0600" endDate="2024-01-15 12:30:00 -0600" value="30"/>
 <Record type="HKQuantityTypeIdentifierDietaryCarbohydrates" sourceName="MyFitnessPal" unit="g" creationDate="2024-01-15 12:30:00 -0600" startDate="2024-01-15 12:00:00 -0600" endDate="2024-01-15 12:30:00 -0600" value="45"/>
 <Record type="HKQuantityTypeIdentifierDietaryFatTotal" sourceName="MyFitnessPal" unit="g" creationDate="2024-01-15 12:30:00 -0600" startDate="2024-01-15 12:00:00 -0600" endDate="2024-01-15 12:30:00 -0600" value="12"/>
 <Record type="HKQuantityTypeIdentifierDietaryCaffeine" sourceName="MyFitnessPal" unit="mg" creationDate="2024-01-15 08:00:00 -0600" startDate="2024-01-15 08:00:00 -0600" endDate="2024-01-15 08:00:00 -0600" value="95"/>
</HealthData>`;

// ---------------------------------------------------------------------------
// Helper: convert string to ReadableStream for streaming tests
// ---------------------------------------------------------------------------

function stringToStream(str: string, chunkSize = 256): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let offset = 0;

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= bytes.length) {
        controller.close();
        return;
      }
      const chunk = bytes.slice(offset, offset + chunkSize);
      controller.enqueue(chunk);
      offset += chunkSize;
    },
  });
}

async function collectStream(
  gen: AsyncGenerator<ParsedHealthRecord>,
): Promise<ParsedHealthRecord[]> {
  const results: ParsedHealthRecord[] = [];
  for await (const record of gen) {
    results.push(record);
  }
  return results;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getAppleHealthTypeMapping', () => {
  it('returns a Map with at least 20 type mappings', () => {
    const mapping = getAppleHealthTypeMapping();
    expect(mapping).toBeInstanceOf(Map);
    expect(mapping.size).toBeGreaterThanOrEqual(20);
  });

  it('includes all required types from the spec', () => {
    const mapping = getAppleHealthTypeMapping();

    expect(mapping.get('HKQuantityTypeIdentifierBodyMass')?.variableName).toBe('Weight');
    expect(mapping.get('HKQuantityTypeIdentifierHeartRate')?.variableName).toBe('Heart Rate');
    expect(mapping.get('HKQuantityTypeIdentifierStepCount')?.variableName).toBe('Steps');
    expect(mapping.get('HKQuantityTypeIdentifierBloodPressureSystolic')?.variableName).toBe('Blood Pressure Systolic');
    expect(mapping.get('HKQuantityTypeIdentifierBloodPressureDiastolic')?.variableName).toBe('Blood Pressure Diastolic');
    expect(mapping.get('HKQuantityTypeIdentifierBodyTemperature')?.variableName).toBe('Body Temperature');
    expect(mapping.get('HKQuantityTypeIdentifierDietaryEnergyConsumed')?.variableName).toBe('Calories');
    expect(mapping.get('HKQuantityTypeIdentifierDietaryWater')?.variableName).toBe('Water');
    expect(mapping.get('HKCategoryTypeIdentifierSleepAnalysis')?.variableName).toBe('Sleep Duration');
    expect(mapping.get('HKQuantityTypeIdentifierActiveEnergyBurned')?.variableName).toBe('Active Energy');
    expect(mapping.get('HKQuantityTypeIdentifierDistanceWalkingRunning')?.variableName).toBe('Walking Distance');
    expect(mapping.get('HKQuantityTypeIdentifierOxygenSaturation')?.variableName).toBe('Blood Oxygen');
    expect(mapping.get('HKQuantityTypeIdentifierRespiratoryRate')?.variableName).toBe('Respiratory Rate');
    expect(mapping.get('HKCategoryTypeIdentifierMindfulSession')?.variableName).toBe('Meditation');
  });

  it('every mapping has all required fields', () => {
    const mapping = getAppleHealthTypeMapping();
    for (const [key, val] of mapping) {
      expect(val.variableName, `${key} missing variableName`).toBeTruthy();
      expect(val.variableCategoryName, `${key} missing variableCategoryName`).toBeTruthy();
      expect(val.unitName, `${key} missing unitName`).toBeTruthy();
      expect(val.unitAbbreviation, `${key} missing unitAbbreviation`).toBeTruthy();
    }
  });
});

describe('parseAppleHealthXML', () => {
  it('parses a complete sample export', () => {
    const records = parseAppleHealthXML(SAMPLE_EXPORT);
    expect(records.length).toBe(12);
  });

  it('produces correct record structure', () => {
    const records = parseAppleHealthXML(SAMPLE_EXPORT);
    const heartRate = records.find((r) => r.variableName === 'Heart Rate');

    expect(heartRate).toBeDefined();
    expect(heartRate!.variableCategoryName).toBe('Vital Signs');
    expect(heartRate!.value).toBe(72);
    expect(heartRate!.unitName).toBe('Beats per Minute');
    expect(heartRate!.unitAbbreviation).toBe('bpm');
    expect(heartRate!.sourceName).toBe('Apple Watch');
    expect(heartRate!.startAt).toBe('2024-01-15T08:30:00-06:00');
    expect(heartRate!.endAt).toBe('2024-01-15T08:30:00-06:00');
  });

  it('parses step count correctly', () => {
    const records = parseAppleHealthXML(SAMPLE_EXPORT);
    const steps = records.find((r) => r.variableName === 'Steps');

    expect(steps).toBeDefined();
    expect(steps!.value).toBe(1250);
    expect(steps!.variableCategoryName).toBe('Physical Activity');
    expect(steps!.unitAbbreviation).toBe('count');
  });

  it('parses weight in kilograms (no conversion needed)', () => {
    const records = parseAppleHealthXML(SAMPLE_EXPORT);
    const weight = records.find((r) => r.variableName === 'Weight');

    expect(weight).toBeDefined();
    expect(weight!.value).toBe(75.5);
    expect(weight!.unitAbbreviation).toBe('kg');
  });

  it('parses blood pressure values', () => {
    const records = parseAppleHealthXML(SAMPLE_EXPORT);
    const systolic = records.find((r) => r.variableName === 'Blood Pressure Systolic');
    const diastolic = records.find((r) => r.variableName === 'Blood Pressure Diastolic');

    expect(systolic).toBeDefined();
    expect(systolic!.value).toBe(120);
    expect(diastolic).toBeDefined();
    expect(diastolic!.value).toBe(80);
  });

  it('returns empty array for empty export', () => {
    const records = parseAppleHealthXML(EMPTY_XML);
    expect(records).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    const records = parseAppleHealthXML('');
    expect(records).toEqual([]);
  });

  it('skips unknown/unmapped record types', () => {
    const records = parseAppleHealthXML(UNKNOWN_TYPE_XML);
    expect(records.length).toBe(0);
  });

  it('parses only mapped types from mixed XML', () => {
    const records = parseAppleHealthXML(MIXED_XML);
    expect(records.length).toBe(2);
    expect(records.map((r) => r.variableName).sort()).toEqual([
      'Heart Rate',
      'Steps',
    ]);
  });

  it('parses Apple date format to ISO-8601', () => {
    const records = parseAppleHealthXML(SAMPLE_EXPORT);
    const first = records[0]!;

    // Should be proper ISO-8601 with timezone
    expect(first.startAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
  });
});

describe('parseAppleHealthXML — unit conversions', () => {
  it('converts weight from pounds to kilograms', () => {
    const records = parseAppleHealthXML(WEIGHT_LB_XML);
    expect(records.length).toBe(1);
    const weight = records[0]!;

    expect(weight.variableName).toBe('Weight');
    expect(weight.unitAbbreviation).toBe('kg');
    // 165 lb ≈ 74.843 kg
    expect(weight.value).toBeCloseTo(74.843, 1);
  });

  it('converts temperature from Celsius to Fahrenheit', () => {
    const records = parseAppleHealthXML(TEMP_CELSIUS_XML);
    expect(records.length).toBe(1);
    const temp = records[0]!;

    expect(temp.variableName).toBe('Body Temperature');
    expect(temp.unitAbbreviation).toBe('°F');
    // 37°C = 98.6°F
    expect(temp.value).toBeCloseTo(98.6, 1);
  });

  it('keeps temperature in Fahrenheit when already Fahrenheit', () => {
    const records = parseAppleHealthXML(SAMPLE_EXPORT);
    const temp = records.find((r) => r.variableName === 'Body Temperature');

    expect(temp).toBeDefined();
    expect(temp!.value).toBeCloseTo(98.6, 1);
  });

  it('converts distance from miles to kilometres', () => {
    const records = parseAppleHealthXML(DISTANCE_MI_XML);
    expect(records.length).toBe(1);
    const dist = records[0]!;

    expect(dist.variableName).toBe('Walking Distance');
    expect(dist.unitAbbreviation).toBe('km');
    // 3.1 mi ≈ 4.989 km
    expect(dist.value).toBeCloseTo(4.989, 1);
  });

  it('converts walking distance from miles in sample export', () => {
    const records = parseAppleHealthXML(SAMPLE_EXPORT);
    const dist = records.find((r) => r.variableName === 'Walking Distance');

    expect(dist).toBeDefined();
    // 2.5 mi ≈ 4.023 km
    expect(dist!.value).toBeCloseTo(4.023, 1);
  });

  it('converts water from fluid ounces to millilitres', () => {
    const records = parseAppleHealthXML(WATER_FLOZ_XML);
    expect(records.length).toBe(1);
    const water = records[0]!;

    expect(water.variableName).toBe('Water');
    expect(water.unitAbbreviation).toBe('mL');
    // 16 fl oz ≈ 473.176 mL
    expect(water.value).toBeCloseTo(473.176, 0);
  });

  it('converts height from inches to centimetres', () => {
    const records = parseAppleHealthXML(HEIGHT_IN_XML);
    expect(records.length).toBe(1);
    const height = records[0]!;

    expect(height.variableName).toBe('Height');
    expect(height.unitAbbreviation).toBe('cm');
    // 70 in = 177.8 cm
    expect(height.value).toBeCloseTo(177.8, 1);
  });

  it('converts oxygen saturation from 0–1 to percentage', () => {
    const records = parseAppleHealthXML(SAMPLE_EXPORT);
    const o2 = records.find((r) => r.variableName === 'Blood Oxygen');

    expect(o2).toBeDefined();
    // 0.97 → 97%
    expect(o2!.value).toBe(97);
  });

  it('converts body fat percentage from 0–1 to percentage', () => {
    const records = parseAppleHealthXML(PERCENTAGE_XML);
    const bf = records.find((r) => r.variableName === 'Body Fat Percentage');

    expect(bf).toBeDefined();
    // 0.22 → 22%
    expect(bf!.value).toBe(22);
  });
});

describe('parseAppleHealthXML — duration-based records', () => {
  it('computes sleep duration in hours', () => {
    const records = parseAppleHealthXML(SLEEP_XML);
    expect(records.length).toBe(1);
    const sleep = records[0]!;

    expect(sleep.variableName).toBe('Sleep Duration');
    expect(sleep.variableCategoryName).toBe('Sleep');
    expect(sleep.unitAbbreviation).toBe('h');
    // 22:30 to 06:00 = 7.5 hours
    expect(sleep.value).toBe(7.5);
  });

  it('computes mindful session duration in minutes', () => {
    const records = parseAppleHealthXML(MINDFUL_XML);
    expect(records.length).toBe(1);
    const meditation = records[0]!;

    expect(meditation.variableName).toBe('Meditation');
    expect(meditation.variableCategoryName).toBe('Treatments');
    expect(meditation.unitAbbreviation).toBe('min');
    // 07:00 to 07:20 = 20 minutes
    expect(meditation.value).toBe(20);
  });
});

describe('parseAppleHealthXML — nutrition records', () => {
  it('parses protein, carbs, fat, and caffeine', () => {
    const records = parseAppleHealthXML(NUTRITION_XML);
    expect(records.length).toBe(4);

    const protein = records.find((r) => r.variableName === 'Protein');
    expect(protein).toBeDefined();
    expect(protein!.value).toBe(30);
    expect(protein!.unitAbbreviation).toBe('g');
    expect(protein!.variableCategoryName).toBe('Nutrients');

    const carbs = records.find((r) => r.variableName === 'Carbohydrates');
    expect(carbs).toBeDefined();
    expect(carbs!.value).toBe(45);

    const fat = records.find((r) => r.variableName === 'Total Fat');
    expect(fat).toBeDefined();
    expect(fat!.value).toBe(12);

    const caffeine = records.find((r) => r.variableName === 'Caffeine');
    expect(caffeine).toBeDefined();
    expect(caffeine!.value).toBe(95);
    expect(caffeine!.unitAbbreviation).toBe('mg');
  });
});

describe('streamParseAppleHealthXML', () => {
  it('yields the same records as the sync parser', async () => {
    const syncRecords = parseAppleHealthXML(SAMPLE_EXPORT);
    const stream = stringToStream(SAMPLE_EXPORT, 128);
    const streamRecords = await collectStream(streamParseAppleHealthXML(stream));

    expect(streamRecords.length).toBe(syncRecords.length);

    // Compare each record
    for (let i = 0; i < syncRecords.length; i++) {
      expect(streamRecords[i]).toEqual(syncRecords[i]);
    }
  });

  it('handles small chunk sizes (simulates slow network)', async () => {
    // Very small chunks to stress the buffer handling
    const stream = stringToStream(SAMPLE_EXPORT, 32);
    const records = await collectStream(streamParseAppleHealthXML(stream));
    expect(records.length).toBe(12);
  });

  it('handles large chunk sizes', async () => {
    // Single-chunk delivery
    const stream = stringToStream(SAMPLE_EXPORT, 100_000);
    const records = await collectStream(streamParseAppleHealthXML(stream));
    expect(records.length).toBe(12);
  });

  it('handles empty stream', async () => {
    const stream = stringToStream('');
    const records = await collectStream(streamParseAppleHealthXML(stream));
    expect(records.length).toBe(0);
  });

  it('handles stream with no Record elements', async () => {
    const stream = stringToStream(EMPTY_XML);
    const records = await collectStream(streamParseAppleHealthXML(stream));
    expect(records.length).toBe(0);
  });

  it('correctly handles unit conversions in streaming mode', async () => {
    const stream = stringToStream(WEIGHT_LB_XML, 64);
    const records = await collectStream(streamParseAppleHealthXML(stream));
    expect(records.length).toBe(1);
    expect(records[0]!.value).toBeCloseTo(74.843, 1);
  });

  it('correctly handles duration records in streaming mode', async () => {
    const stream = stringToStream(SLEEP_XML, 64);
    const records = await collectStream(streamParseAppleHealthXML(stream));
    expect(records.length).toBe(1);
    expect(records[0]!.value).toBe(7.5);
  });
});

describe('summarizeAppleHealthExport', () => {
  it('returns correct summary for multi-record export', () => {
    const records = parseAppleHealthXML(MULTI_DATE_XML);
    const summary = summarizeAppleHealthExport(records);

    expect(summary.totalRecords).toBe(5);
    expect(summary.dateRange).not.toBeNull();
    expect(summary.dateRange!.earliest).toBe('2024-01-10T08:30:00-06:00');
    expect(summary.dateRange!.latest).toBe('2024-01-20T08:30:00-06:00');
    expect(summary.variableCounts['Heart Rate']).toBe(3);
    expect(summary.variableCounts['Steps']).toBe(1);
    expect(summary.variableCounts['Weight']).toBe(1);
    expect(summary.sourceNames.sort()).toEqual(['Apple Watch', 'Fitbit', 'iPhone', 'Withings'].sort());
  });

  it('returns correct summary for sample export', () => {
    const records = parseAppleHealthXML(SAMPLE_EXPORT);
    const summary = summarizeAppleHealthExport(records);

    expect(summary.totalRecords).toBe(12);
    expect(summary.dateRange).not.toBeNull();
    expect(Object.keys(summary.variableCounts).length).toBeGreaterThanOrEqual(10);
    expect(summary.sourceNames.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty summary for empty array', () => {
    const summary = summarizeAppleHealthExport([]);

    expect(summary.totalRecords).toBe(0);
    expect(summary.dateRange).toBeNull();
    expect(summary.variableCounts).toEqual({});
    expect(summary.sourceNames).toEqual([]);
  });

  it('returns sorted source names', () => {
    const records = parseAppleHealthXML(MULTI_DATE_XML);
    const summary = summarizeAppleHealthExport(records);

    const sorted = [...summary.sourceNames].sort();
    expect(summary.sourceNames).toEqual(sorted);
  });

  it('correctly counts variables', () => {
    const records = parseAppleHealthXML(MIXED_XML);
    const summary = summarizeAppleHealthExport(records);

    expect(summary.totalRecords).toBe(2);
    expect(summary.variableCounts['Heart Rate']).toBe(1);
    expect(summary.variableCounts['Steps']).toBe(1);
  });
});

describe('edge cases', () => {
  it('handles XML with special characters in sourceName', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
 <Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Mike&apos;s Apple Watch" unit="count/min" creationDate="2024-01-15 08:30:00 -0600" startDate="2024-01-15 08:30:00 -0600" endDate="2024-01-15 08:30:00 -0600" value="72"/>
</HealthData>`;
    const records = parseAppleHealthXML(xml);
    expect(records.length).toBe(1);
    // Regex extracts the raw attribute value including XML entities
    expect(records[0]!.sourceName).toContain('Apple Watch');
  });

  it('handles records with non-numeric value gracefully', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
 <Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Watch" unit="count/min" creationDate="2024-01-15 08:30:00 -0600" startDate="2024-01-15 08:30:00 -0600" endDate="2024-01-15 08:30:00 -0600" value="NaN"/>
</HealthData>`;
    const records = parseAppleHealthXML(xml);
    // NaN value should be filtered out
    expect(records.length).toBe(0);
  });

  it('handles records with empty value', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
 <Record type="HKQuantityTypeIdentifierHeartRate" sourceName="Watch" unit="count/min" creationDate="2024-01-15 08:30:00 -0600" startDate="2024-01-15 08:30:00 -0600" endDate="2024-01-15 08:30:00 -0600" value=""/>
</HealthData>`;
    const records = parseAppleHealthXML(xml);
    // Empty value → NaN → filtered out
    expect(records.length).toBe(0);
  });

  it('handles Record elements with extra whitespace', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
 <Record
   type="HKQuantityTypeIdentifierHeartRate"
   sourceName="Apple Watch"
   unit="count/min"
   creationDate="2024-01-15 08:30:00 -0600"
   startDate="2024-01-15 08:30:00 -0600"
   endDate="2024-01-15 08:30:00 -0600"
   value="72"
 />
</HealthData>`;
    const records = parseAppleHealthXML(xml);
    expect(records.length).toBe(1);
    expect(records[0]!.value).toBe(72);
  });

  it('rounds values to 3 decimal places', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<HealthData locale="en_US">
 <Record type="HKQuantityTypeIdentifierActiveEnergyBurned" sourceName="Watch" unit="kcal" creationDate="2024-01-15 10:00:00 -0600" startDate="2024-01-15 09:00:00 -0600" endDate="2024-01-15 10:00:00 -0600" value="123.456789"/>
</HealthData>`;
    const records = parseAppleHealthXML(xml);
    expect(records.length).toBe(1);
    expect(records[0]!.value).toBe(123.457);
  });
});

describe('variable categories are correct', () => {
  it('vital signs category', () => {
    const records = parseAppleHealthXML(SAMPLE_EXPORT);
    const heartRate = records.find((r) => r.variableName === 'Heart Rate');
    const bp = records.find((r) => r.variableName === 'Blood Pressure Systolic');
    const o2 = records.find((r) => r.variableName === 'Blood Oxygen');
    const resp = records.find((r) => r.variableName === 'Respiratory Rate');

    expect(heartRate!.variableCategoryName).toBe('Vital Signs');
    expect(bp!.variableCategoryName).toBe('Vital Signs');
    expect(o2!.variableCategoryName).toBe('Vital Signs');
    expect(resp!.variableCategoryName).toBe('Vital Signs');
  });

  it('physical activity category', () => {
    const records = parseAppleHealthXML(SAMPLE_EXPORT);
    const steps = records.find((r) => r.variableName === 'Steps');
    const energy = records.find((r) => r.variableName === 'Active Energy');
    const distance = records.find((r) => r.variableName === 'Walking Distance');

    expect(steps!.variableCategoryName).toBe('Physical Activity');
    expect(energy!.variableCategoryName).toBe('Physical Activity');
    expect(distance!.variableCategoryName).toBe('Physical Activity');
  });

  it('physique category', () => {
    const records = parseAppleHealthXML(SAMPLE_EXPORT);
    const weight = records.find((r) => r.variableName === 'Weight');
    expect(weight!.variableCategoryName).toBe('Physique');
  });

  it('food and nutrition categories', () => {
    const records = parseAppleHealthXML(SAMPLE_EXPORT);
    const calories = records.find((r) => r.variableName === 'Calories');
    const water = records.find((r) => r.variableName === 'Water');

    expect(calories!.variableCategoryName).toBe('Foods');
    expect(water!.variableCategoryName).toBe('Foods');

    const nutritionRecords = parseAppleHealthXML(NUTRITION_XML);
    const protein = nutritionRecords.find((r) => r.variableName === 'Protein');
    expect(protein!.variableCategoryName).toBe('Nutrients');
  });

  it('sleep category', () => {
    const records = parseAppleHealthXML(SLEEP_XML);
    expect(records[0]!.variableCategoryName).toBe('Sleep');
  });

  it('treatments category for meditation', () => {
    const records = parseAppleHealthXML(MINDFUL_XML);
    expect(records[0]!.variableCategoryName).toBe('Treatments');
  });
});
