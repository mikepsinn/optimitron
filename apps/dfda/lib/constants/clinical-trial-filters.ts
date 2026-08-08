export const STUDY_STATUSES = {
  "not yet recruiting": "Not Yet Recruiting",
  recruiting: "Recruiting",
  enrolling: "Enrolling by Invitation",
  active: "Active, Not Recruiting",
  suspended: "Suspended",
  terminated: "Terminated",
  completed: "Completed",
  "withdrawn": "Withdrawn",
  unknown: "Unknown Status",
  "available": "Available", // For expanded access
  "no longer available": "No Longer Available", // For expanded access
  "approved for marketing": "Approved for Marketing", // For device trials
} as const;

export const STUDY_TYPES = {
  int: "Interventional",
  obs: "Observational",
  pat: "Expanded Access", // Patient Registry is usually under obs, this is for expanded access status
  all: "All Study Types",
} as const;

// Values from ClinicalTrials.gov advanced search. Multiple can be selected.
export const AGE_GROUPS = {
  child: "Child (birth-17)",
  adult: "Adult (18-64)",
  older_adult: "Older Adult (65+)",
} as const;

export const SEX_OPTIONS = {
  all: "All",
  female: "Female",
  male: "Male",
} as const;

export type StudyStatusKey = keyof typeof STUDY_STATUSES;
export type StudyTypeKey = keyof typeof STUDY_TYPES;
export type AgeGroupKey = keyof typeof AGE_GROUPS;
export type SexKey = keyof typeof SEX_OPTIONS; 