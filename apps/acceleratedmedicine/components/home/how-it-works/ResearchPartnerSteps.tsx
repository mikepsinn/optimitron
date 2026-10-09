import { Upload, Shield, Settings, BarChart3, Package } from "lucide-react"
import { Button } from "@optimitron/neobrutalist-ui/ui/button"
import { Input } from "@optimitron/neobrutalist-ui/ui/input"
import { Label } from "@optimitron/neobrutalist-ui/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@optimitron/neobrutalist-ui/ui/select"
import { Badge } from "@optimitron/neobrutalist-ui/ui/badge"
import { ResearchPartnerStep } from "./ResearchPartnerStep"

// Share of patients improved from week 0 to week 12: a screened treatment against usual care.
const treatmentCurve = [4, 12, 21, 29, 34, 37, 38]
const usualCareCurve = [4, 7, 10, 12, 14, 15, 15]

/** The dashboard's effectiveness chart. Usual care is dashed, so the two lines differ by more than color. */
function EffectivenessChart() {
  const width = 280
  const height = 64
  const max = 40
  const points = (values: number[]) =>
    values.map((value, index) => `${(index / (values.length - 1)) * width},${height - (value / max) * height}`).join(" ")
  return (
    <figure className="rounded-lg border p-2">
      <div className="flex gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-0.5 w-3 rounded-full bg-primary" />New treatment</span>
        <span className="flex items-center gap-1"><span className="w-3 border-t-2 border-dashed border-muted-foreground" />Usual care</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="mt-1 h-16 w-full overflow-visible" role="img"
        aria-label="Patients improved over 12 weeks: more with the new treatment than with usual care">
        <line x1="0" y1={height} x2={width} y2={height} className="stroke-border" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <polyline points={points(usualCareCurve)} fill="none" className="stroke-muted-foreground" strokeWidth="2" strokeDasharray="4 3"
          strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <polyline points={points(treatmentCurve)} fill="none" className="stroke-primary" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>Week 0</span><span>Patients improved</span><span>Week 12</span>
      </figcaption>
    </figure>
  )
}

export function ResearchPartnerSteps() {
  return (
    <div className="space-y-16 relative">
      {/* Step 1: Create a Trial */}
      <ResearchPartnerStep
        stepNumber={1}
        title="Create a Trial"
        icon={<Upload className="h-5 w-5 text-primary" />}
        description="Upload protocols, pre/post-clinical data, and register your supply chain in one place."
        benefits={[
          "Start from a protocol template",
          "Submit the protocol to an independent review board",
          "Keep the protocol, data and approvals in one record",
        ]}
        preview={
          <div className="w-full max-w-[320px] rounded-lg border shadow-md overflow-hidden bg-background">
            {/* Mini Create Trial Page Preview */}
            <div className="p-3 border-b bg-muted/30">
              <div className="text-sm font-medium">Create New Trial</div>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Trial Name</Label>
                <Input placeholder="Type 2 Diabetes Treatment Study" className="h-8 text-xs" disabled />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Therapeutic Area</Label>
                <Select disabled>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Endocrinology" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="endocrinology">Endocrinology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Protocol Upload</Label>
                <div className="border border-dashed rounded-md p-2 flex items-center justify-center">
                  <div className="text-xs text-muted-foreground flex items-center">
                    <Upload className="h-3 w-3 mr-1" /> Upload Protocol
                  </div>
                </div>
              </div>
              <Button size="sm" className="w-full text-xs" disabled>
                Continue
              </Button>
            </div>
          </div>
        }
        reverse={false}
      />

      {/* Step 2: Get Insurance */}
      <ResearchPartnerStep
        stepNumber={2}
        title="Get Liability Insurance"
        icon={<Shield className="h-5 w-5 text-primary" />}
        description="See liability insurance priced per participant before you enroll anyone."
        benefits={[
          "Compare quotes side by side",
          "Priced for your trial's risks",
          "Cover starts before the first patient enrolls",
        ]}
        preview={
          <div className="w-full max-w-[320px] rounded-lg border shadow-md overflow-hidden bg-background">
            {/* Mini Insurance Page Preview */}
            <div className="p-3 border-b bg-muted/30">
              <div className="text-sm font-medium">Select Liability Insurance</div>
            </div>
            <div className="p-4 space-y-4">
              <div className="rounded-lg border p-3 bg-muted/20">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-medium">SafeTrial Liability Insurance</div>
                    <div className="text-xs text-muted-foreground mt-1">Comprehensive coverage</div>
                  </div>
                  <Badge className="text-xs">Recommended</Badge>
                </div>
                <div className="mt-2 text-xs">
                  <div className="flex justify-between">
                    <span>Per participant:</span>
                    <span className="font-medium">$45</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-medium">MedSecure Plus</div>
                    <div className="text-xs text-muted-foreground mt-1">Basic coverage</div>
                  </div>
                </div>
                <div className="mt-2 text-xs">
                  <div className="flex justify-between">
                    <span>Per participant:</span>
                    <span className="font-medium">$32</span>
                  </div>
                </div>
              </div>

              <Button size="sm" className="w-full text-xs" disabled>
                Select Plan
              </Button>
            </div>
          </div>
        }
        reverse={true}
      />

      {/* Step 3: Set Parameters */}
      <ResearchPartnerStep
        stepNumber={3}
        title="Set Parameters"
        icon={<Settings className="h-5 w-5 text-primary" />}
        description="Set what your study covers for each participant and what data it collects."
        benefits={[
          "Cover participants' treatment and visit costs",
          "Point patients to charity and maker assistance",
          "Customizable data collection requirements",
        ]}
        preview={
          <div className="w-full max-w-[320px] rounded-lg border shadow-md overflow-hidden bg-background">
            {/* Mini Parameters Page Preview */}
            <div className="p-3 border-b bg-muted/30">
              <div className="text-sm font-medium">Trial Parameters</div>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Sponsor covers per participant</Label>
                <div className="flex items-center space-x-2">
                  <Input placeholder="929" className="h-8 text-xs" disabled />
                  <span className="text-xs">USD</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Patient assistance</Label>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    Charity
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Free supply from maker
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Required Data Points</Label>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    Blood Glucose
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Weight
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Activity
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Diet
                  </Badge>
                </div>
              </div>
              <Button size="sm" className="w-full text-xs" disabled>
                Save Parameters
              </Button>
            </div>
          </div>
        }
        reverse={false}
      />

      {/* Step 4: Manage Supply Chain & Orders */}
      <ResearchPartnerStep
        stepNumber={4}
        title="Manage Supply Chain & Orders"
        icon={<Package className="h-5 w-5 text-primary" />}
        description="Ship treatment to participating clinics and track each order and shipment."
        benefits={[
          "Stock at each clinic, with low-stock alerts",
          "Patient orders filled through the clinic",
          "Temperature logged in transit",
          "An audit trail for every shipment",
        ]}
        preview={
          <div className="w-full max-w-[320px] rounded-lg border shadow-md overflow-hidden bg-background">
            {/* Mini Supply Chain Dashboard Preview */}
            <div className="p-3 border-b bg-muted/30">
              <div className="text-sm font-medium">Supply Chain Dashboard</div>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-medium">Inventory Status</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border p-2">
                    <div className="text-xs text-muted-foreground">In Stock</div>
                    <div className="text-sm font-bold">1,250 units</div>
                  </div>
                  <div className="rounded-lg border p-2">
                    <div className="text-xs text-muted-foreground">Allocated</div>
                    <div className="text-sm font-bold">840 units</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium">Recent Orders</div>
                <div className="space-y-2 max-h-[100px] overflow-y-auto">
                  <div className="rounded-md border p-2 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-medium">#ORD-2845</div>
                      <div className="text-xs text-muted-foreground">2 units • Processing</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      New
                    </Badge>
                  </div>
                  <div className="rounded-md border p-2 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-medium">#ORD-2844</div>
                      <div className="text-xs text-muted-foreground">1 unit • Shipped</div>
                    </div>
                    <div className="text-xs text-green-700">Delivered</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium">Supply Chain Map</div>
                <div className="h-16 bg-muted/20 rounded-lg flex items-center justify-center">
                  <div className="text-xs text-muted-foreground">Interactive map view</div>
                </div>
              </div>

              <Button size="sm" className="w-full text-xs" disabled>
                Manage Inventory
              </Button>
            </div>
          </div>
        }
        reverse={true}
      />

      {/* Step 5: Manage Your Trial */}
      <ResearchPartnerStep
        stepNumber={5}
        title="See Results as They Come In"
        icon={<BarChart3 className="h-5 w-5 text-primary" />}
        description="Outcomes from every clinic, pooled and compared across the trial's arms while it runs."
        benefits={[
          "Results from the first patients, not only at the end",
          "Whether patients took their doses",
          "Who stopped, and who was lost to follow-up",
          "De-identified data to export for regulators and journals",
        ]}
        preview={
          <div className="w-full max-w-[320px] rounded-lg border shadow-md overflow-hidden bg-background">
            {/* Mini Analytics Dashboard Preview */}
            <div className="p-3 border-b bg-muted/30">
              <div className="text-sm font-medium">Trial results</div>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-medium">Outcomes so far</div>
                <EffectivenessChart />
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium">Doses and check-ins</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border p-2">
                    <div className="text-xs text-muted-foreground">Doses on time</div>
                    <div className="text-sm font-bold">92%</div>
                  </div>
                  <div className="rounded-lg border p-2">
                    <div className="text-xs text-muted-foreground">Check-ins</div>
                    <div className="text-sm font-bold">4,265</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium">Adverse Events</div>
                <div className="rounded-lg border p-2">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">Total Reports</div>
                    <div className="text-xs font-bold">12</div>
                  </div>
                  <div className="mt-1 flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">Requires Review</div>
                    <div className="text-xs font-bold text-amber-700">3</div>
                  </div>
                </div>
              </div>

              <Button size="sm" className="w-full text-xs" disabled>
                See all results
              </Button>
            </div>
          </div>
        }
        reverse={false}
      />
    </div>
  )
} 