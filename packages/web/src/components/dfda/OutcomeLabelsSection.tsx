import { OutcomeLabel } from "./OutcomeLabel"

// Define the sample data according to the new OutcomeLabelProps interface
const atorvastatinData = {
  title: "Atorvastatin 20mg daily",
  tag: "Lipid-lowering agent",
  data: [
    {
      title: "Primary Outcomes",
      items: [
        {
          name: "LDL Cholesterol",
          baseline: "(baseline: 160 mg/dL)",
          value: { percentage: -43, absolute: "-69 mg/dL" },
          isPositive: true,
        },
        {
          name: "Total Cholesterol",
          baseline: "(baseline: 240 mg/dL)",
          value: { percentage: -32, absolute: "-77 mg/dL" },
          isPositive: true,
        },
        {
          name: "Cardiovascular Event Risk",
          baseline: "(10-year risk)",
          value: { percentage: -36, absolute: "-4.2%" },
          isPositive: true,
        },
      ],
    },
    {
      title: "Secondary Benefits",
      items: [
        {
          name: "HDL Cholesterol",
          value: { percentage: 5, absolute: "+2.3 mg/dL" },
          isPositive: true,
        },
        {
          name: "Triglycerides",
          value: { percentage: -22, absolute: "-35 mg/dL" },
          isPositive: true,
        },
      ],
    },
    {
      title: "Side Effects",
      isSideEffectCategory: true,
      items: [
        {
          name: "Muscle Pain/Weakness",
          baseline: "(vs. placebo)",
          value: { percentage: 8.2, nnh: 12 }, // Percentage treated as positive increase for side effects
          isPositive: false, // Explicitly false for red text/bar
        },
        {
          name: "Liver Enzyme Elevation",
          value: { percentage: 1.2, nnh: 83 },
          isPositive: false,
        },
        {
          name: "Headache",
          value: { percentage: 3.8, nnh: 26 },
          isPositive: false,
        },
      ],
    },
  ],
  footer: {
    sourceDescription: "Based on 42 clinical trials with 48,500 participants",
    nnhDescription: "NNH = Number Needed to Harm (patients treated for one additional adverse event)",
  },
};

export function OutcomeLabelsSection() {
  return (
    <section id="outcome-labels-section" className="w-full py-12 md:py-24 lg:py-32 bg-background border-b-4 border-primary scroll-mt-[121px]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-4 text-center lg:text-left">
            <h2 className="text-4xl font-black uppercase sm:text-5xl md:text-6xl lg:text-7xl">Outcome Labels</h2>
            <ul className="grid gap-2 justify-items-center lg:justify-items-start">
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 md:h-7 md:w-7 text-primary"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-lg md:text-xl font-bold">Comprehensive health impact data</span>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 md:h-7 md:w-7 text-primary"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-lg md:text-xl font-bold">Both positive and negative effects</span>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 md:h-7 md:w-7 text-primary"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-lg md:text-xl font-bold">Evidence-based decision making</span>
              </li>
            </ul>
          </div>
          <OutcomeLabel {...atorvastatinData} />
        </div>
      </div>
    </section>
  )
}

