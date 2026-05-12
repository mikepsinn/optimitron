import { CivilizationOsLoader } from "@/components/ui/civilization-os-loader"

export default function DashboardLoading() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-4 py-16">
      <CivilizationOsLoader size="lg" />
    </div>
  )
}
