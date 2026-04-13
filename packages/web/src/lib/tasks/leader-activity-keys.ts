export const ACCOUNTABILITY_TASK_KEY_PREFIX = "accountability";

export function getActivityTaskKey(countryCode: string, activitySlug: string) {
  return `${ACCOUNTABILITY_TASK_KEY_PREFIX}:${countryCode.toLowerCase()}:${activitySlug}`;
}
