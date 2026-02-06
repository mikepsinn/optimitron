/**
 * Measurement Validation
 *
 * Validates measurement values against:
 * 1. Unit constraints (e.g., percent can't be > 100 or < 0)
 * 2. Variable-specific ranges from standard definitions
 * 3. Physiological plausibility bounds
 *
 * Returns whether the value is valid and optionally suggests a corrected value.
 *
 * @see https://dfda-spec.warondisease.org
 */

import { getUnitDefinition, normalizeUnit } from './unit-conversion.js';
import {
  STANDARD_VARIABLES,
  type StandardVariableDefinition,
} from './importers/standard-variable-names.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationResult {
  /** Whether the measurement value is valid */
  valid: boolean;
  /** Human-readable reason if invalid */
  reason?: string;
  /** Suggested corrected value (e.g., clamped to valid range) */
  correctedValue?: number;
}

// ---------------------------------------------------------------------------
// Physiological bounds — hard limits for known variable types
// ---------------------------------------------------------------------------

/**
 * Known physiological / practical bounds for common variables.
 * These are sanity checks — values outside these ranges are almost certainly errors.
 *
 * Reference: Legacy API QMVariable::validateValue
 * https://github.com/mikepsinn/curedao-api/blob/main/app/Models/UserVariable.php
 */
const VARIABLE_BOUNDS: Record<string, { min?: number; max?: number }> = {
  // Vital Signs
  'Heart Rate':                { min: 20,    max: 300 },
  'Resting Heart Rate':        { min: 20,    max: 200 },
  'Heart Rate Variability':    { min: 0,     max: 500 },
  'Blood Pressure Systolic':   { min: 40,    max: 300 },
  'Blood Pressure Diastolic':  { min: 20,    max: 200 },
  'Blood Oxygen':              { min: 50,    max: 100 },
  'Body Temperature':          { min: 85,    max: 115 }, // °F
  'Respiratory Rate':          { min: 4,     max: 60 },
  'Blood Glucose':             { min: 20,    max: 600 },

  // Body Measurements
  'Weight':                    { min: 0.5,   max: 700 },   // kg
  'Height':                    { min: 20,    max: 300 },    // cm
  'Body Mass Index':           { min: 5,     max: 100 },
  'Body Fat Percentage':       { min: 1,     max: 70 },

  // Physical Activity
  'Steps':                     { min: 0,     max: 200000 },
  'Active Energy':             { min: 0,     max: 20000 },  // kcal
  'Exercise Time':             { min: 0,     max: 1440 },   // minutes

  // Sleep
  'Sleep Duration':            { min: 0,     max: 24 },     // hours

  // Nutrition
  'Calories':                  { min: 0,     max: 30000 },  // kcal/day
  'Water':                     { min: 0,     max: 30000 },  // mL/day
  'Protein':                   { min: 0,     max: 1000 },   // g/day
  'Total Fat':                 { min: 0,     max: 1000 },   // g/day
  'Carbohydrates':             { min: 0,     max: 2000 },   // g/day
  'Caffeine':                  { min: 0,     max: 5000 },   // mg/day
  'Sodium':                    { min: 0,     max: 30000 },  // mg/day
};

// ---------------------------------------------------------------------------
// Validation logic
// ---------------------------------------------------------------------------

/**
 * Validate a measurement value against unit constraints and variable-specific bounds.
 *
 * Checks (in order):
 * 1. Value is a finite number (not NaN, not Infinity)
 * 2. Unit minimum/maximum constraints (e.g., percent: 0–100)
 * 3. Variable-specific physiological/practical bounds
 *
 * @param value - The numeric measurement value
 * @param variableName - The canonical variable name (e.g., "Heart Rate")
 * @param unit - The unit abbreviation or name (e.g., "bpm", "Beats per Minute")
 * @returns Validation result with optional correction
 *
 * @example
 * ```typescript
 * validateMeasurement(72, 'Heart Rate', 'bpm');
 * // → { valid: true }
 *
 * validateMeasurement(500, 'Heart Rate', 'bpm');
 * // → { valid: false, reason: 'Heart Rate value 500 exceeds maximum of 300 bpm', correctedValue: 300 }
 *
 * validateMeasurement(150, 'Blood Oxygen', '%');
 * // → { valid: false, reason: 'Value 150 exceeds unit maximum of 100 for Percent', correctedValue: 100 }
 * ```
 */
export function validateMeasurement(
  value: number,
  variableName: string,
  unit: string,
): ValidationResult {
  // ── Check 1: Is it a valid number? ─────────────────────────────────────
  if (!Number.isFinite(value)) {
    return {
      valid: false,
      reason: `Value is not a finite number: ${value}`,
    };
  }

  // ── Check 2: Unit constraints ──────────────────────────────────────────
  const normalizedUnit = normalizeUnit(unit);
  const unitDef = getUnitDefinition(normalizedUnit);

  if (unitDef) {
    if (unitDef.minimumValue != null && value < unitDef.minimumValue) {
      return {
        valid: false,
        reason: `Value ${value} is below unit minimum of ${unitDef.minimumValue} for ${unitDef.name}`,
        correctedValue: unitDef.minimumValue,
      };
    }
    if (unitDef.maximumValue != null && value > unitDef.maximumValue) {
      return {
        valid: false,
        reason: `Value ${value} exceeds unit maximum of ${unitDef.maximumValue} for ${unitDef.name}`,
        correctedValue: unitDef.maximumValue,
      };
    }
  }

  // ── Check 3: Variable-specific bounds ──────────────────────────────────
  const bounds = VARIABLE_BOUNDS[variableName];
  if (bounds) {
    if (bounds.min != null && value < bounds.min) {
      return {
        valid: false,
        reason: `${variableName} value ${value} is below minimum of ${bounds.min}`,
        correctedValue: bounds.min,
      };
    }
    if (bounds.max != null && value > bounds.max) {
      return {
        valid: false,
        reason: `${variableName} value ${value} exceeds maximum of ${bounds.max}`,
        correctedValue: bounds.max,
      };
    }
  }

  // ── Check 4: Standard variable definition existence ────────────────────
  // This is informational — we don't reject unknown variables, but the
  // caller might want to know if it's a known canonical variable.
  // (Not enforced here — resolveVariableName handles mapping.)

  return { valid: true };
}

/**
 * Validate and optionally clamp a value to valid ranges.
 *
 * Like validateMeasurement, but returns the corrected value directly
 * instead of a ValidationResult.
 *
 * @param value - The numeric measurement value
 * @param variableName - The canonical variable name
 * @param unit - The unit abbreviation or name
 * @returns The value, clamped to valid ranges if necessary
 */
export function clampMeasurement(
  value: number,
  variableName: string,
  unit: string,
): number {
  const result = validateMeasurement(value, variableName, unit);
  if (result.valid) return value;
  return result.correctedValue ?? value;
}

/**
 * Get the valid range for a variable + unit combination.
 *
 * Returns the tightest bounds from both unit constraints and variable bounds.
 */
export function getValidRange(
  variableName: string,
  unit: string,
): { min?: number; max?: number } {
  const unitDef = getUnitDefinition(unit);
  const bounds = VARIABLE_BOUNDS[variableName];

  let min: number | undefined;
  let max: number | undefined;

  if (unitDef?.minimumValue != null) min = unitDef.minimumValue;
  if (bounds?.min != null) {
    min = min != null ? Math.max(min, bounds.min) : bounds.min;
  }

  if (unitDef?.maximumValue != null) max = unitDef.maximumValue;
  if (bounds?.max != null) {
    max = max != null ? Math.min(max, bounds.max) : bounds.max;
  }

  return { min, max };
}
