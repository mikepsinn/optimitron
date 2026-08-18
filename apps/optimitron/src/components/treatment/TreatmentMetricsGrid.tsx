import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { Activity, Shield, Users, FlaskConical } from 'lucide-react';
import { SafetyScale } from '@/components/treatment/SafetyScale';
import { formatNumberShort } from '@/lib/formatters';

interface TreatmentMetricsGridProps {
  effectiveness: number;
  safetyScore: number;
  trials: number;
  participants: number;
  showSafetyScale?: boolean; // Option to show safety scale below grid
}

export function TreatmentMetricsGrid({
  effectiveness,
  safetyScore,
  trials,
  participants,
  showSafetyScale = false,
}: TreatmentMetricsGridProps) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2 text-xs">
              <Activity className="h-4 w-4" />
              Effectiveness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{effectiveness}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2 text-xs">
              <Shield className="h-4 w-4" />
              Safety Score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safetyScore}%</div>
          </CardContent>
        </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription className="flex items-center gap-2 text-xs">
            <FlaskConical className="h-4 w-4" />
            Clinical Trials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{trials.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription className="flex items-center gap-2 text-xs">
            <Users className="h-4 w-4" />
            Participants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumberShort(participants)}
          </div>
        </CardContent>
      </Card>
      </div>
      {showSafetyScale && (
        <div className="mt-4">
          <SafetyScale safetyScore={safetyScore} />
        </div>
      )}
    </>
  );
}
