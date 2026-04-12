export const TREATY_PARENT_TASK_ID = "1-pct-treaty";
export const TREATY_PARENT_TASK_KEY = "program:one-percent-treaty:ratify";
export const TREATY_PARENT_TASK_TITLE = "Ratify the 1% Treaty";
export const TREATY_SIGNER_TASK_ID_PREFIX = "1-pct-treaty-signer";
export const TREATY_SIGNER_TASK_KEY_PREFIX = "program:one-percent-treaty:signer";
export const TREATY_SIGNER_TASK_TITLE = "Sign the 1% Treaty";

export function getTreatyParentTaskHref() {
  return `/tasks/${TREATY_PARENT_TASK_ID}`;
}

export function getTreatySignerTaskKey(input: { countryCode: string }) {
  return `${TREATY_SIGNER_TASK_KEY_PREFIX}:${input.countryCode.toLowerCase()}`;
}

export function getTreatySignerTaskId(input: { countryCode: string }) {
  return `${TREATY_SIGNER_TASK_ID_PREFIX}-${input.countryCode.toLowerCase()}`;
}

export function isTreatyParentTaskKey(taskKey: string | null | undefined) {
  return taskKey === TREATY_PARENT_TASK_KEY;
}

export function isTreatySignerTaskKey(taskKey: string | null | undefined) {
  return taskKey != null && /^program:one-percent-treaty:signer:[a-z0-9-]+$/i.test(taskKey);
}
