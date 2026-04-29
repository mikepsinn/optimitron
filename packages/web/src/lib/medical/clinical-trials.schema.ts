import { z } from 'zod';

// Based on https://clinicaltrials.gov/api/gui/ref/study_structure and observed /api/int/studies responses

const IdentificationModuleSchema = z.object({
  nctId: z.string().optional(),
  orgStudyIdInfo: z.record(z.any()).optional(), // Simplified for now
  secondaryIdInfos: z.array(z.record(z.any())).optional(), // Simplified for now
  briefTitle: z.string().optional(),
  officialTitle: z.string().optional(),
  acronym: z.string().optional(), // Note: Acronym also exists as a top-level requested field
}).partial().passthrough();

const StatusModuleSchema = z.object({
  overallStatus: z.string().optional(),
  lastKnownStatus: z.string().optional(),
  statusVerifiedDate: z.string().optional(),
  startDateStruct: z.record(z.any()).optional(), // Simplified for now
  primaryCompletionDateStruct: z.record(z.any()).optional(), // Simplified for now
  completionDateStruct: z.record(z.any()).optional(), // Simplified for now
  studyFirstPostDate: z.string().optional(), // Matches top-level field name
  studyFirstPostType: z.string().optional(),
  resultsFirstPostDate: z.string().optional(), // Matches top-level field name
  resultsFirstPostType: z.string().optional(),
  lastUpdatePostDate: z.string().optional(), // Matches top-level field name
  lastUpdatePostType: z.string().optional(),
}).partial().passthrough();

const ConditionsModuleSchema = z.object({
  conditions: z.array(z.string()).optional(),
}).partial().passthrough();

const DesignModuleSchema = z.object({
  studyType: z.string().optional(),
  phases: z.array(z.string()).optional(),
  designInfo: z.object({
    allocation: z.string().optional(),
    interventionModel: z.string().optional(),
    primaryPurpose: z.string().optional(),
    maskingInfo: z.record(z.any()).optional(), // Simplified
  }).partial().passthrough().optional(),
  enrollmentInfo: z.object({
    count: z.number().optional(),
    type: z.string().optional(),
  }).partial().passthrough().optional(),
}).partial().passthrough();

const InterventionSchema = z.object({
  type: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
}).partial().passthrough();

const ArmsInterventionsModuleSchema = z.object({
  interventions: z.array(InterventionSchema).optional(),
  // armGroups can be added here if needed
}).partial().passthrough();

const EligibilityModuleSchema = z.object({
  sex: z.string().optional(),
  minimumAge: z.string().optional(), // e.g., "18 Years"
  maximumAge: z.string().optional(), // e.g., "64 Years", can be absent
  stdAges: z.array(z.string()).optional(),
  healthyVolunteers: z.boolean().optional(),
  eligibilityCriteria: z.string().optional(), // Text block
}).partial().passthrough();

const ContactSchema = z.object({
  name: z.string().optional(),
  role: z.string().optional(), // In OAS, this is an enum ContactRole
  phone: z.string().optional(),
  phoneExt: z.string().optional(),
  email: z.string().optional(),
}).partial().passthrough();

const LocationSchema = z.object({
  facility: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  status: z.string().optional(), // Recruiting status for the location
  contacts: z.array(ContactSchema).optional(), // Added contacts array
  geoPoint: z.object({
    lat: z.number().optional(),
    lon: z.number().optional(),
  }).partial().passthrough().optional(),
}).partial().passthrough();

const ContactsLocationsModuleSchema = z.object({
  locations: z.array(LocationSchema).optional(),
  centralContacts: z.array(ContactSchema).optional(), // Updated to use ContactSchema
}).partial().passthrough();

// Add other module schemas here as needed, e.g., ConditionsModule, InterventionsModule etc.
// For now, keeping it minimal to address the immediate issue.

const ProtocolSectionSchema = z.object({
  identificationModule: IdentificationModuleSchema.optional(),
  statusModule: StatusModuleSchema.optional(),
  conditionsModule: ConditionsModuleSchema.optional(),
  designModule: DesignModuleSchema.optional(),
  armsInterventionsModule: ArmsInterventionsModuleSchema.optional(),
  eligibilityModule: EligibilityModuleSchema.optional(),
  contactsLocationsModule: ContactsLocationsModuleSchema.optional(),
  // Other modules can be added as needed:
  // sponsorCollaboratorsModule, oversightModule, descriptionModule, 
  // outcomesModule, referencesModule
}).partial().passthrough();

// Schema for the 'columns' part of the response, which seems to provide pre-formatted data
const ColumnsConditionItemSchema = z.string(); // Items are strings like "<mark>Condition</mark>"
const ColumnsInterventionItemSchema = z.object({
    type: z.string().optional(),
    name: z.string().optional(),
}).partial().passthrough();

const ColumnsDataSchema = z.object({
    conditions: z.object({
        total: z.number().optional(),
        items: z.array(ColumnsConditionItemSchema).optional(),
    }).partial().passthrough().optional(),
    interventions: z.object({
        total: z.number().optional(),
        items: z.array(ColumnsInterventionItemSchema).optional(),
    }).partial().passthrough().optional(),
    // Other column data like collaborators can be added
}).partial().passthrough();

// Schema for individual study based on /api/int/studies 'fields' parameter.
export const ClinicalTrialStudySchema = z.object({
  // Direct fields (likely from 'fields' param, but their presence/casing might vary)
  NCTId: z.array(z.string()).optional(),
  BriefTitle: z.array(z.string()).optional(),
  OverallStatus: z.array(z.string()).optional(),
  LastKnownStatus: z.array(z.string()).optional(),
  StatusVerifiedDate: z.array(z.string()).optional(),
  Acronym: z.array(z.string()).optional(),
  
  HasResults: z.array(z.boolean()).optional(), // Explicitly an array of booleans, no transform here.
  hasResults: z.boolean().optional(),         // Explicitly a direct boolean (camelCase from API observation)

  Condition: z.array(z.string()).optional(), 
  InterventionName: z.array(z.string()).optional(), 
  InterventionType: z.array(z.string()).optional(),
  LocationFacility: z.array(z.string()).optional(),
  LocationCity: z.array(z.string()).optional(),
  LocationState: z.array(z.string()).optional(),
  LocationCountry: z.array(z.string()).optional(),
  LocationStatus: z.array(z.string()).optional(),
  LocationZip: z.array(z.string()).optional(),
  LocationGeoPoint: z.array(z.string()).optional().transform(val => val?.[0]),
  LocationContactName: z.array(z.string()).optional(),
  LocationContactRole: z.array(z.string()).optional(),
  LocationContactPhone: z.array(z.string()).optional(),
  LocationContactPhoneExt: z.array(z.string()).optional(),
  LocationContactEMail: z.array(z.string()).optional(),
  CentralContactName: z.array(z.string()).optional(),
  CentralContactRole: z.array(z.string()).optional(),
  CentralContactPhone: z.array(z.string()).optional(),
  CentralContactPhoneExt: z.array(z.string()).optional(),
  CentralContactEMail: z.array(z.string()).optional(),
  Gender: z.array(z.string()).optional().transform(val => val?.[0]),
  MinimumAge: z.array(z.string()).optional().transform(val => val?.[0]),
  MaximumAge: z.array(z.string()).optional().transform(val => val?.[0]),
  StdAge: z.array(z.string()).optional(),
  StudyType: z.array(z.string()).optional().transform(val => val?.[0]),
  LeadSponsorName: z.array(z.string()).optional().transform(val => val?.[0]),
  EnrollmentCount: z.array(z.string()).optional().transform(val => val?.[0]),
  StartDate: z.array(z.string()).optional().transform(val => val?.[0]), // Consider from statusModule.startDateStruct
  PrimaryCompletionDate: z.array(z.string()).optional().transform(val => val?.[0]), // Consider from statusModule
  CompletionDate: z.array(z.string()).optional().transform(val => val?.[0]), // Consider from statusModule
  StudyFirstPostDate: z.array(z.string()).optional().transform(val => val?.[0]), // Also in StatusModule
  ResultsFirstPostDate: z.array(z.string()).optional().transform(val => val?.[0]), // Also in StatusModule
  LastUpdatePostDate: z.array(z.string()).optional().transform(val => val?.[0]), // Also in StatusModule
  OrgStudyId: z.array(z.string()).optional().transform(val => val?.[0]), // Also in IdentificationModule
  SecondaryId: z.array(z.string()).optional(), // Also in IdentificationModule
  Phase: z.array(z.string()).optional(),
  LargeDocLabel: z.array(z.string()).optional(),
  LargeDocFilename: z.array(z.string()).optional(),
  PrimaryOutcomeMeasure: z.array(z.string()).optional(),
  SecondaryOutcomeMeasure: z.array(z.string()).optional(),
  DesignAllocation: z.array(z.string()).optional().transform(val => val?.[0]),
  DesignInterventionModel: z.array(z.string()).optional().transform(val => val?.[0]),
  DesignMasking: z.array(z.string()).optional().transform(val => val?.[0]),
  DesignWhoMasked: z.array(z.string()).optional(),
  DesignPrimaryPurpose: z.array(z.string()).optional().transform(val => val?.[0]),
  DesignObservationalModel: z.array(z.string()).optional().transform(val => val?.[0]),
  DesignTimePerspective: z.array(z.string()).optional().transform(val => val?.[0]),
  LeadSponsorClass: z.array(z.string()).optional().transform(val => val?.[0]),
  CollaboratorClass: z.array(z.string()).optional(),
  highlight: z.record(z.array(z.string())).optional(),
  
  // Nested structure from API
  protocolSection: ProtocolSectionSchema.optional(),
  derivedSection: z.record(z.any()).optional(), 
  resultsSection: z.record(z.any()).optional(), 
  annotationSection: z.record(z.any()).optional(), 
  documentSection: z.record(z.any()).optional(),
  
  columns: ColumnsDataSchema.optional(),

}).passthrough();

export type ClinicalTrialStudy = z.infer<typeof ClinicalTrialStudySchema>;

const ClinicalTrialHitSchema = z.object({
  id: z.string(), 
  study: ClinicalTrialStudySchema,
});

export type ClinicalTrialHit = z.infer<typeof ClinicalTrialHitSchema>;

export const ClinicalTrialsIntApiResponseSchema = z.object({
  from: z.number(),
  limit: z.number(),
  total: z.number(),
  terms: z.array(z.string()).optional(),
  hits: z.array(ClinicalTrialHitSchema), 
  aggs: z.record(z.any()).optional(), 
  aggFilters: z.array(z.record(z.any())).optional(), 
  signals: z.record(z.any()).optional(), 
  profileResults: z.record(z.any()).optional(), 
});

export type ClinicalTrialsIntApiResponse = z.infer<typeof ClinicalTrialsIntApiResponseSchema>;

// The old ClinicalTrialsApiResponseSchema and related types are removed as they are for /api/v2/studies 