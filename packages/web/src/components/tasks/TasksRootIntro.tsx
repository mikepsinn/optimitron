import {
  PRESIDENT_MANAGEMENT_HEADLINE,
  PRESIDENT_MANAGEMENT_MISSION_STATEMENT,
} from "@/content/mission-statement";

export function TasksRootIntro() {
  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-black uppercase leading-none sm:text-5xl md:text-6xl">
        {PRESIDENT_MANAGEMENT_HEADLINE}
      </h1>
      <p className="mx-auto max-w-3xl text-base font-bold sm:text-lg">
        {PRESIDENT_MANAGEMENT_MISSION_STATEMENT}
      </p>
    </div>
  );
}
