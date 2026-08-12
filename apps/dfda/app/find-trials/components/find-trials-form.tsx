"use client"

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Search, Filter, ChevronDown, LocateFixed, Loader2 } from 'lucide-react'
import { ConditionSuggestInput } from './ConditionSuggestInput'
import { InterventionSuggestInput } from './InterventionSuggestInput'
import {
  STUDY_STATUSES,
  STUDY_TYPES,
  AGE_GROUPS,
  SEX_OPTIONS,
  type StudyStatusKey,
  type StudyTypeKey,
  type AgeGroupKey,
  type SexKey,
} from "@/lib/constants/clinical-trial-filters"

interface FindTrialsFormProps {
  initialCondition?: string;
  initialIntervention?: string;
  initialStudyStatus?: StudyStatusKey;
  initialStudyType?: StudyTypeKey;
  initialAgeGroups?: AgeGroupKey[];
  initialSex?: SexKey;
  initialLocation?: string;
  initialLat?: number;
  initialLng?: number;
  initialRadius?: number;
}

const DEFAULT_SEARCH_RADIUS = 50; // miles

export function FindTrialsForm({
  initialCondition,
  initialIntervention,
  initialStudyStatus,
  initialStudyType,
  initialAgeGroups,
  initialSex,
  initialLocation,
  initialLat,
  initialLng,
  initialRadius
}: FindTrialsFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams() // To preserve other existing query params if any

  const [condition, setCondition] = useState(initialCondition || '')
  const [intervention, setIntervention] = useState(initialIntervention || '')
  const [studyStatus, setStudyStatus] = useState<StudyStatusKey | undefined>(initialStudyStatus)
  const [studyType, setStudyType] = useState<StudyTypeKey | undefined>(initialStudyType || "all")
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<AgeGroupKey[]>(initialAgeGroups || [])
  const [sex, setSex] = useState<SexKey | undefined>(initialSex || "all")

  const [locationQuery, setLocationQuery] = useState(initialLocation || '');
  const [latitude, setLatitude] = useState<number | undefined>(initialLat);
  const [longitude, setLongitude] = useState<number | undefined>(initialLng);
  const [searchRadius, setSearchRadius] = useState<number>(initialRadius || DEFAULT_SEARCH_RADIUS);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  useEffect(() => {
    setCondition(initialCondition || '')
    setIntervention(initialIntervention || '')
    setStudyStatus(initialStudyStatus)
    setStudyType(initialStudyType || "all")
    setSelectedAgeGroups(initialAgeGroups || [])
    setSex(initialSex || "all")
    setLocationQuery(initialLocation || '')
    setLatitude(initialLat)
    setLongitude(initialLng)
    setSearchRadius(initialRadius || DEFAULT_SEARCH_RADIUS)
  }, [initialCondition, initialIntervention, initialStudyStatus, initialStudyType, initialAgeGroups, initialSex, initialLocation, initialLat, initialLng, initialRadius])

  const handleAgeGroupChange = (ageGroupKey: AgeGroupKey) => {
    setSelectedAgeGroups((prev) =>
      prev.includes(ageGroupKey)
        ? prev.filter((key) => key !== ageGroupKey)
        : [...prev, ageGroupKey]
    )
  }

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationQuery("Current Location"); 
        setIsLocating(false);
      },
      (error) => {
        setLocationError(`Error getting location: ${error.message}`);
        setIsLocating(false);
      }
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const currentParams = new URLSearchParams(searchParams?.toString() || '')

    if (condition.trim()) {
      currentParams.set('condition', condition.trim())
    } else {
      currentParams.delete('condition')
    }

    if (intervention.trim()) {
      currentParams.set('intervention', intervention.trim())
    } else {
      currentParams.delete('intervention')
    }

    // Location parameters
    if (latitude && longitude) {
      currentParams.set('lat', latitude.toString());
      currentParams.set('lng', longitude.toString());
      currentParams.set('distance', searchRadius.toString());
      if (locationQuery.trim()) {
         currentParams.set('locStr', locationQuery.trim());
      } else {
        currentParams.set('locStr', 'Coordinates Provided');
      }
    } else if (locationQuery.trim() && locationQuery !== "Current Location") {
      // If lat/lng not set (e.g. manual text entry without using current location)
      // API might geocode this on its own if it supports direct text location without coords.
      // For now, we primarily rely on lat/lng for distance search.
      // If you want to support text-only location search without radius, you might need a different API param or handling.
      // For now, we will pass locStr if user typed something and didn't use current location
      currentParams.set('locStr', locationQuery.trim());
      currentParams.delete('lat');
      currentParams.delete('lng');
      currentParams.delete('distance');
    } else {
      currentParams.delete('lat');
      currentParams.delete('lng');
      currentParams.delete('distance');
      currentParams.delete('locStr');
    }

    if (studyStatus) {
      currentParams.set('studyStatus', studyStatus)
    } else {
      currentParams.delete('studyStatus')
    }

    if (studyType && studyType !== "all") {
      currentParams.set('studyType', studyType)
    } else {
      currentParams.delete('studyType')
    }

    if (selectedAgeGroups.length > 0) {
      currentParams.set('ageGroups', selectedAgeGroups.join(','))
    } else {
      currentParams.delete('ageGroups')
    }

    if (sex && sex !== "all") {
      currentParams.set('sex', sex)
    } else {
      currentParams.delete('sex')
    }

    currentParams.delete('from') // Reset pagination on new search

    router.push(`/find-trials?${currentParams.toString()}`)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        {/* <CardTitle>Search For Clinical Trials</CardTitle> */}
        {/* <CardDescription>
          Enter a medical condition and optionally an intervention.
        </CardDescription> */}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="condition">Medical Condition *</Label>
              <ConditionSuggestInput
                id="condition"
                value={condition}
                onChange={setCondition}
                onSelect={setCondition}
                placeholder="e.g., Type 2 Diabetes"
                aria-describedby="condition-description"
                aria-labelledby="condition-label"
              />
              <p id="condition-description" className="text-sm text-muted-foreground">
                Specify a medical condition you are interested in.
              </p>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="intervention">Intervention (Optional)</Label>
              <InterventionSuggestInput
                id="intervention"
                name="intervention"
                value={intervention}
                onChange={setIntervention}
                onSelect={setIntervention}
                placeholder="e.g., Metformin"
                aria-describedby="intervention-description"
                aria-labelledby="intervention-label"
              />
              <p id="intervention-description" className="text-sm text-muted-foreground">
                Specify a drug, device, or procedure if you are looking for trials for a specific intervention.
              </p>
            </div>
          </div>

          {/* Location Input Section */}
          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <div className="flex space-x-2">
              <Input 
                id="location"
                type="text"
                placeholder="Enter city, state, or zip code"
                value={locationQuery}
                onChange={(e) => {
                  setLocationQuery(e.target.value);
                  // Clear lat/lng if user types, as it might not match current location anymore
                  if (e.target.value !== "Current Location") {
                    setLatitude(undefined);
                    setLongitude(undefined);
                  }
                }}
                className="flex-grow"
              />
              <Button type="button" variant="outline" onClick={handleUseCurrentLocation} disabled={isLocating} className="shrink-0">
                {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LocateFixed className="mr-2 h-4 w-4" />} 
                Use Current
              </Button>
            </div>
            {locationError && <p className="text-sm text-destructive">{locationError}</p>}
            {latitude && longitude && locationQuery === "Current Location" && (
                <p className="text-sm text-muted-foreground">
                    Using current location. Radius: {searchRadius} miles.
                </p>
            )}
             <div className="grid w-full max-w-sm items-center gap-1.5 mt-2">
                <Label htmlFor="radius">Search Radius (miles)</Label>
                <Input 
                    id="radius"
                    type="number"
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(parseInt(e.target.value, 10) || DEFAULT_SEARCH_RADIUS)}
                    min="1"
                    max="500" 
                />
            </div>
          </div>

          <Button type="button" variant="outline" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className="w-full justify-center">
            <Filter className="mr-2 h-4 w-4" />
            {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
            <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`} />
          </Button>

          {showAdvancedFilters && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="studyStatus">Study Status</Label>
                  <Select 
                    value={studyStatus || "_ANY_STATUS_"}
                    onValueChange={(value) => {
                      setStudyStatus(value === "_ANY_STATUS_" ? undefined : value as StudyStatusKey);
                    }}
                  >
                    <SelectTrigger id="studyStatus"><SelectValue placeholder="Any Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_ANY_STATUS_">Any Status</SelectItem>
                      {Object.entries(STUDY_STATUSES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="studyType">Study Type</Label>
                  <Select value={studyType} onValueChange={(value) => setStudyType(value as StudyTypeKey)}>
                    <SelectTrigger id="studyType"><SelectValue placeholder="All Study Types" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STUDY_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label>Age Groups</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {selectedAgeGroups.length > 0 ? selectedAgeGroups.map(ag => AGE_GROUPS[ag]).join(', ') : "Any Age Group"}
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuLabel>Select Age Groups</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {Object.entries(AGE_GROUPS).map(([key, label]) => (
                        <DropdownMenuItem key={key} onSelect={(e) => e.preventDefault()} className="flex items-center">
                          <Checkbox
                            id={`age-${key}`}
                            checked={selectedAgeGroups.includes(key as AgeGroupKey)}
                            onCheckedChange={() => handleAgeGroupChange(key as AgeGroupKey)}
                            className="mr-2"
                          />
                          <label htmlFor={`age-${key}`} className="flex-1 cursor-pointer">{label}</label>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="sex">Sex</Label>
                  <Select value={sex} onValueChange={(value) => setSex(value as SexKey)}>
                    <SelectTrigger id="sex"><SelectValue placeholder="Any Sex" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(SEX_OPTIONS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full">
            <Search className="mr-2 h-4 w-4" /> Find Trials
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 