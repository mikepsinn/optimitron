export interface ZonedDateParts {
  day: number;
  hour: number;
  minute: number;
  month: number;
  second: number;
  year: number;
}

function padNumber(value: number) {
  return String(value).padStart(2, "0");
}

export function getZonedDateParts(
  date: Date,
  timeZone: string,
): ZonedDateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));

  return {
    day: Number(values.get("day")),
    hour: Number(values.get("hour")),
    minute: Number(values.get("minute")),
    month: Number(values.get("month")),
    second: Number(values.get("second")),
    year: Number(values.get("year")),
  };
}

export function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getZonedDateParts(date, timeZone);
  return (
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ) - date.getTime()
  );
}

export function getZonedDateTimeUtc(
  parts: Pick<
    ZonedDateParts,
    "year" | "month" | "day" | "hour" | "minute" | "second"
  >,
  timeZone: string,
) {
  const utcGuess = new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ),
  );
  let result = new Date(
    utcGuess.getTime() - getTimeZoneOffsetMs(utcGuess, timeZone),
  );
  const correctedOffset = getTimeZoneOffsetMs(result, timeZone);
  result = new Date(utcGuess.getTime() - correctedOffset);
  return result;
}

export function getStartOfZonedDayUtc(
  parts: Pick<ZonedDateParts, "year" | "month" | "day">,
  timeZone: string,
) {
  return getZonedDateTimeUtc(
    { ...parts, hour: 0, minute: 0, second: 0 },
    timeZone,
  );
}

export function getZonedDateKey(date: Date, timeZone: string) {
  const parts = getZonedDateParts(date, timeZone);
  return `${parts.year}-${padNumber(parts.month)}-${padNumber(parts.day)}`;
}

export function getTimeZoneOffsetMinutes(date: Date, timeZone: string) {
  return Math.round(getTimeZoneOffsetMs(date, timeZone) / 60_000);
}

/**
 * Format an instant as an ISO 8601 string in the given zone, offset included.
 * `2026-08-03T08:00:00-05:00` names the same instant as its UTC form but reads
 * as the wall-clock time the user set the reminder for.
 */
export function formatZonedIsoString(date: Date, timeZone: string) {
  const parts = getZonedDateParts(date, timeZone);
  const offsetMinutes = getTimeZoneOffsetMinutes(date, timeZone);
  const sign = offsetMinutes < 0 ? "-" : "+";
  const absolute = Math.abs(offsetMinutes);
  const offset = `${sign}${padNumber(Math.floor(absolute / 60))}:${padNumber(absolute % 60)}`;
  return `${parts.year}-${padNumber(parts.month)}-${padNumber(parts.day)}T${padNumber(parts.hour)}:${padNumber(parts.minute)}:${padNumber(parts.second)}${offset}`;
}

export function parseDateKey(dateKey: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const test = new Date(Date.UTC(year, month - 1, day));
  if (
    test.getUTCFullYear() !== year ||
    test.getUTCMonth() !== month - 1 ||
    test.getUTCDate() !== day
  ) {
    return null;
  }
  return { day, month, year };
}

export function shiftDateKey(dateKey: string, days: number) {
  const parts = parseDateKey(dateKey);
  if (!parts) return null;
  const shifted = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day + days),
  );
  return `${shifted.getUTCFullYear()}-${padNumber(shifted.getUTCMonth() + 1)}-${padNumber(shifted.getUTCDate())}`;
}
