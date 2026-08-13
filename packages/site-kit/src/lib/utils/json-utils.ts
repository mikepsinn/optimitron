/**
 * Utilities for JSON serialization with consistent formatting
 * Ensures clean git diffs by sorting keys alphabetically
 */

/**
 * Recursively sort object keys alphabetically
 * Arrays and primitives are returned as-is
 */
function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  const sorted: Record<string, any> = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    sorted[key] = sortObjectKeys(obj[key]);
  }

  return sorted;
}

/**
 * Stringify JSON with sorted keys for consistent git diffs
 * @param data - Data to stringify
 * @param space - Indentation (default: 2 spaces)
 * @returns JSON string with alphabetically sorted keys
 */
export function stringifyJsonSorted(data: any, space: number = 2): string {
  const sorted = sortObjectKeys(data);
  return JSON.stringify(sorted, null, space);
}

/**
 * Save JSON file with sorted keys
 * @param filePath - Path to save file
 * @param data - Data to save
 * @param space - Indentation (default: 2 spaces)
 */
export async function saveJsonSorted(
  filePath: string,
  data: any,
  space: number = 2
): Promise<void> {
  const fs = await import('fs/promises');
  const content = stringifyJsonSorted(data, space);
  await fs.writeFile(filePath, content + '\n', 'utf-8'); // Add trailing newline
}

/**
 * Save JSON file synchronously with sorted keys
 * @param filePath - Path to save file
 * @param data - Data to save
 * @param space - Indentation (default: 2 spaces)
 */
export function saveJsonSortedSync(
  filePath: string,
  data: any,
  space: number = 2
): void {
  const fs = require('fs');
  const content = stringifyJsonSorted(data, space);
  fs.writeFileSync(filePath, content + '\n', 'utf-8'); // Add trailing newline
}
