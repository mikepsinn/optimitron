import {
  PRESIDENT_MANAGEMENT_HEADLINE,
  PRESIDENT_MANAGEMENT_MISSION_STATEMENT,
} from "@/content/mission-statement";

export function TasksRootIntro({
  headingLevel = "h1",
}: {
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;

  return (
    <div className="space-y-4">
      <Heading className="text-4xl font-black uppercase leading-none sm:text-5xl md:text-6xl">
        {PRESIDENT_MANAGEMENT_HEADLINE}
      </Heading>
      <p className="mx-auto max-w-3xl text-base font-bold sm:text-lg">
        {PRESIDENT_MANAGEMENT_MISSION_STATEMENT}
      </p>
    </div>
  );
}
