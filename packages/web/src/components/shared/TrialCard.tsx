'use client';

import Link from 'next/link';
import type { ClinicalTrialStudy } from '@/lib/schemas/clinical-trial.schema';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/retroui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ExternalLink,
  Users,
  MapPin,
  Calendar,
  FlaskConical,
  Tag,
  ListChecks,
  Microscope,
  ClipboardList,
  Sigma,
  PersonStanding,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  PauseCircle,
  HelpCircle,
} from 'lucide-react';
import { stripHtmlTags } from '@/lib/utils/strip-html';
import { generateConditionPagePath, nameToSlug } from '@/lib/path-helpers';
import { generateOutcomeLabelPagePath } from '@/lib/path-helpers';
import { formatNumberShort } from '@/lib/formatters';

interface TrialCardProps {
  study: ClinicalTrialStudy;
  variant?: 'compact' | 'detailed';
  showConditionsLinks?: boolean;
  showInterventionsLinks?: boolean;
}

// Helper to format date strings
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

// Status configuration with icons
const getStatusDisplay = (status?: string) => {
  const statusConfig: Record<string, { icon: typeof FlaskConical; variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    RECRUITING: { icon: Users, variant: 'default', label: 'Recruiting' },
    COMPLETED: { icon: CheckCircle2, variant: 'secondary', label: 'Completed' },
    TERMINATED: { icon: XCircle, variant: 'destructive', label: 'Terminated' },
    ACTIVE_NOT_RECRUITING: { icon: PauseCircle, variant: 'outline', label: 'Active, Not Recruiting' },
    NOT_YET_RECRUITING: { icon: Clock, variant: 'outline', label: 'Not Yet Recruiting' },
    ENROLLING_BY_INVITATION: { icon: Users, variant: 'default', label: 'Enrolling by Invitation' },
    SUSPENDED: { icon: PauseCircle, variant: 'outline', label: 'Suspended' },
    WITHDRAWN: { icon: XCircle, variant: 'destructive', label: 'Withdrawn' },
    UNKNOWN: { icon: HelpCircle, variant: 'outline', label: 'Unknown' },
  };

  const normalizedStatus = status?.toUpperCase().replace(/\s+/g, '_') || 'UNKNOWN';
  return statusConfig[normalizedStatus] || {
    icon: HelpCircle,
    variant: 'outline' as const,
    label: status?.replace(/_/g, ' ') || 'Unknown',
  };
};

export function TrialCard({ study, variant = 'detailed', showConditionsLinks = true, showInterventionsLinks = true }: TrialCardProps) {
  const protocolSection = study.protocolSection;
  const identification = protocolSection?.identificationModule;
  const status = protocolSection?.statusModule;
  const design = protocolSection?.designModule;
  const contactsLocations = protocolSection?.contactsLocationsModule;
  const conditions = protocolSection?.conditionsModule;
  const interventions = protocolSection?.armsInterventionsModule;

  // Extract data
  const nctId = identification?.nctId || study.NCTId?.[0];
  const rawTitle = identification?.briefTitle || identification?.officialTitle || study.BriefTitle?.[0];
  const title = stripHtmlTags(rawTitle) || 'Untitled Study';
  const overallStatus = status?.overallStatus || study.OverallStatus?.[0] || 'Unknown';
  const lastKnownStatus = stripHtmlTags(status?.lastKnownStatus || study.LastKnownStatus?.[0]);
  const studyType = design?.studyType || study.StudyType?.[0];
  const phases = design?.phases || study.Phase;
  const phaseDisplay = phases && phases.length > 0 ? stripHtmlTags(phases.join(', ')) : undefined;
  const enrollment = design?.enrollmentInfo?.count || study.EnrollmentCount?.[0];
  const enrollmentDisplay = enrollment ? enrollment.toString() : undefined;
  const locations = contactsLocations?.locations;
  const primaryLocation = locations?.[0];
  const startDate = status?.startDateStruct?.date || study.StartDate?.[0];

  // Conditions
  let conditionsList: (string | undefined)[] = [];
  if (conditions?.conditions) {
    conditionsList = conditions.conditions;
  } else if (study.Condition) {
    conditionsList = study.Condition;
  }
  const cleanedConditions = (conditionsList.map(c => stripHtmlTags(c)).filter(Boolean) as string[])
    .concat((study.columns?.conditions?.items?.map(item => stripHtmlTags(item)).filter(Boolean) as string[] || []))
    .filter((value, index, self) => self.indexOf(value) === index);

  // Interventions
  let interventionNames: (string | undefined)[] = [];
  if (interventions?.interventions) {
    interventionNames = interventions.interventions.map(i => stripHtmlTags(i.name));
  } else if (study.InterventionName) {
    interventionNames = study.InterventionName.map(name => stripHtmlTags(name));
  }
  if (interventionNames.filter(Boolean).length === 0 && study.columns?.interventions?.items) {
    interventionNames = study.columns.interventions.items.map(i => stripHtmlTags(i.name));
  }
  const cleanedInterventionNames = interventionNames.filter(Boolean) as string[];

  // Eligibility
  const eligibility = protocolSection?.eligibilityModule;
  const minAge = stripHtmlTags(eligibility?.minimumAge || study.MinimumAge?.[0]);
  const maxAge = stripHtmlTags(eligibility?.maximumAge || study.MaximumAge?.[0]);
  let ageDisplay = 'N/A';
  if (minAge && maxAge) {
    ageDisplay = `${minAge} - ${maxAge}`;
  } else if (minAge) {
    ageDisplay = `From ${minAge}`;
  } else if (maxAge) {
    ageDisplay = `Up to ${maxAge}`;
  }
  if (ageDisplay === 'N/A' && study.StdAge?.length) {
    ageDisplay = study.StdAge.map(sa => stripHtmlTags(sa)).filter(Boolean).join(', ') || 'N/A';
  }
  const genderDisplay = stripHtmlTags(eligibility?.sex || study.Gender?.[0]);

  // Locations
  let rawLocations = locations?.map(l => stripHtmlTags(l.facility)).filter(Boolean);
  if (!rawLocations || rawLocations.length === 0) {
    rawLocations = study.LocationFacility?.map(lf => stripHtmlTags(lf)).filter(Boolean);
  }
  let locationsDisplay = rawLocations?.slice(0, 2).join('; ') || study.LocationFacility?.slice(0, 2).join('; ');
  if (rawLocations && rawLocations.length > 2) {
    locationsDisplay += `; +${rawLocations.length - 2} more`;
  }

  // Contact information
  let contactEmail: string | undefined = undefined;
  let contactPhone: string | undefined = undefined;
  let contactName: string | undefined = undefined;

  const centralContacts = contactsLocations?.centralContacts;
  if (centralContacts && centralContacts.length > 0) {
    const primaryContact = centralContacts.find(c => c.email) || centralContacts[0];
    contactEmail = primaryContact?.email;
    contactPhone = primaryContact?.phone;
    contactName = primaryContact?.name;
  }

  if (!contactEmail && !contactPhone) {
    if (locations && locations.length > 0) {
      const firstLocationWithContact = locations.find(l => l.contacts && l.contacts.length > 0);
      if (firstLocationWithContact?.contacts) {
        const locationContact = firstLocationWithContact.contacts.find(lc => lc.email) || firstLocationWithContact.contacts[0];
        contactEmail = locationContact?.email;
        contactPhone = locationContact?.phone;
        contactName = locationContact?.name;
      }
    }
  }

  if (!contactEmail && !contactPhone) {
    contactEmail = study.CentralContactEMail?.[0] || study.LocationContactEMail?.[0];
    contactPhone = study.CentralContactPhone?.[0] || study.LocationContactPhone?.[0];
    contactName = study.CentralContactName?.[0] || study.LocationContactName?.[0];
  }

  // Has Results
  let actualHasResults: boolean | undefined = undefined;
  if (typeof study.hasResults === 'boolean') {
    actualHasResults = study.hasResults;
  } else if (Array.isArray(study.HasResults) && typeof study.HasResults[0] === 'boolean') {
    actualHasResults = study.HasResults[0];
  }

  const studyTypeDisplay = stripHtmlTags(studyType);
  const StudyTypeIcon = studyTypeDisplay?.toUpperCase() === 'INTERVENTIONAL' ? Microscope : studyTypeDisplay?.toUpperCase() === 'OBSERVATIONAL' ? ClipboardList : Sigma;

  const displayStatus = getStatusDisplay(overallStatus);
  const StatusIcon = displayStatus.icon;
  const studyUrl = `https://clinicaltrials.gov/study/${nctId}`;

  // Compact variant (simpler display)
  if (variant === 'compact') {
    const statusColor =
      overallStatus === 'RECRUITING' ? 'default' :
      overallStatus === 'ACTIVE_NOT_RECRUITING' ? 'secondary' :
      overallStatus === 'COMPLETED' ? 'outline' : 'destructive';

    return (
      <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-tight mb-2">{title}</h3>
              <div className="flex flex-wrap items-center gap-2">
                {nctId && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {nctId}
                  </Badge>
                )}
                <Badge variant={statusColor} className="text-xs">
                  {overallStatus.replace(/_/g, ' ')}
                </Badge>
                {phaseDisplay && (
                  <Badge variant="secondary" className="text-xs">
                    {phaseDisplay}
                  </Badge>
                )}
              </div>
            </div>
            {nctId && (
              <Link
                href={studyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 text-xs whitespace-nowrap"
              >
                View Study
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            {enrollmentDisplay && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{formatNumberShort(parseInt(enrollmentDisplay))} participants</span>
              </div>
            )}
            {studyTypeDisplay && (
              <div className="flex items-center gap-1">
                <FlaskConical className="h-3 w-3" />
                <span>{studyTypeDisplay}</span>
              </div>
            )}
            {primaryLocation?.city && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>
                  {primaryLocation.city}
                  {primaryLocation.country ? `, ${primaryLocation.country}` : ''}
                  {locations && locations.length > 1 && ` +${locations.length - 1} more`}
                </span>
              </div>
            )}
            {startDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Started: {formatDate(startDate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Detailed variant (full featured)
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-xl font-semibold">
            <Link
              href={studyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary hover:underline transition-colors"
            >
              {title}
            </Link>
          </CardTitle>
          {nctId && (
            <Link
              href={studyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs"
            >
              <Button variant="outline" size="sm" className="flex-shrink-0">
                {nctId} <ExternalLink className="ml-1.5 h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <Badge variant={displayStatus.variant} className="py-1">
            <StatusIcon className="h-4 w-4 mr-1.5" />
            {displayStatus.label}
          </Badge>
          {lastKnownStatus && lastKnownStatus !== overallStatus && (
            <Badge variant="outline" className="py-1">Last Known: {lastKnownStatus}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm pt-4">
        <div className="flex items-start">
          <Tag className="h-4 w-4 mr-2 mt-0.5 text-sky-600 flex-shrink-0" />
          <div>
            <strong className="font-medium">Conditions:</strong>
            {cleanedConditions.length > 0 ? (
              <span className="ml-1">
                {cleanedConditions.map((conditionName, index) => (
                  showConditionsLinks ? (
                    <Button key={index} variant="outline" size="sm" asChild className="mr-1 mb-1 py-0 px-2 h-6 text-xs rounded-md">
                      <Link href={generateConditionPagePath(nameToSlug(conditionName))}>
                        {conditionName}
                      </Link>
                    </Button>
                  ) : (
                    <Badge key={index} variant="outline" className="mr-1 mb-1">
                      {conditionName}
                    </Badge>
                  )
                ))}
              </span>
            ) : 'N/A'}
          </div>
        </div>
        <div className="flex items-start">
          <ListChecks className="h-4 w-4 mr-2 mt-0.5 text-rose-600 flex-shrink-0" />
          <div>
            <strong className="font-medium">Interventions:</strong>
            {cleanedInterventionNames.length > 0 ? (
              <span className="ml-1">
                {cleanedInterventionNames.map((name, index) => (
                  showInterventionsLinks ? (
                    <Button key={index} variant="outline" size="sm" asChild className="mr-1 mb-1 py-0 px-2 h-6 text-xs rounded-md">
                      <Link href={generateOutcomeLabelPagePath(name)}>
                        {name}
                      </Link>
                    </Button>
                  ) : (
                    <Badge key={index} variant="outline" className="mr-1 mb-1">
                      {name}
                    </Badge>
                  )
                ))}
              </span>
            ) : 'N/A'}
          </div>
        </div>
        <div className="flex items-start">
          <StudyTypeIcon className="h-4 w-4 mr-2 mt-0.5 text-indigo-600 flex-shrink-0" />
          <div><strong className="font-medium">Study Type:</strong> {studyTypeDisplay ? <Badge variant="outline">{studyTypeDisplay}</Badge> : 'N/A'}</div>
        </div>
        <div className="flex items-start">
          <Sigma className="h-4 w-4 mr-2 mt-0.5 text-lime-600 flex-shrink-0" />
          <div><strong className="font-medium">Phase:</strong> {phaseDisplay ? <Badge variant="outline">{phaseDisplay}</Badge> : 'N/A'}</div>
        </div>
        <div className="flex items-start">
          <Users className="h-4 w-4 mr-2 mt-0.5 text-teal-600 flex-shrink-0" />
          <div><strong className="font-medium">Enrollment:</strong> {enrollmentDisplay || 'N/A'}</div>
        </div>
        <div className="flex items-start">
          <PersonStanding className="h-4 w-4 mr-2 mt-0.5 text-amber-600 flex-shrink-0" />
          <div><strong className="font-medium">Age:</strong> {ageDisplay}</div>
        </div>
        <div className="flex items-start">
          <Users className="h-4 w-4 mr-2 mt-0.5 text-cyan-600 flex-shrink-0" />
          <div><strong className="font-medium">Gender:</strong> {genderDisplay || 'N/A'}</div>
        </div>
        <div className="flex items-start">
          <MapPin className="h-4 w-4 mr-2 mt-0.5 text-purple-600 flex-shrink-0" />
          <div><strong className="font-medium">Locations:</strong> {locationsDisplay || 'N/A'}</div>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground bg-muted/30 p-3 flex flex-col sm:flex-row justify-between items-center mt-4 space-y-2 sm:space-y-0">
        <div className="flex-grow">
          {actualHasResults && (
            <Badge variant="secondary" className="text-green-700 border-green-500 py-1 ml-2">
              <FileText className="h-3.5 w-3.5 mr-1" /> Has Results
            </Badge>
          )}
        </div>
        <div className="flex-shrink-0">
          {contactEmail ? (
            <Button asChild size="sm">
              <Link href={`mailto:${contactEmail}?subject=Inquiry about study ${nctId}${contactName ? `&body=Dear ${contactName},\n\nI am interested in joining the study ${nctId} as a participant. Please let me know how to proceed.\n\nThank you,\n[Your Name]` : ''}`}>
                Join Study
                <ExternalLink className="ml-1.5 h-3 w-3" />
              </Link>
            </Button>
          ) : contactPhone ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`tel:${contactPhone}`}>
                Call: {contactPhone}
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href={studyUrl} target="_blank" rel="noopener noreferrer">
                View Study Details
                <ExternalLink className="ml-1.5 h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
