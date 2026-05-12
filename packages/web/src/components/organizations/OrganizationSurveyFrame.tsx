"use client";

import { useState } from "react";

interface OrganizationSurveyFrameProps {
  src: string;
  title: string;
}

export function OrganizationSurveyFrame({
  src,
  title,
}: OrganizationSurveyFrameProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="relative border border-foreground"
      data-visual-state={loaded ? undefined : "animating"}
    >
      {!loaded ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background px-4 text-center text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
          Loading survey
        </div>
      ) : null}
      <iframe
        className="h-[760px] w-full"
        onLoad={() => setLoaded(true)}
        src={src}
        title={title}
      />
    </div>
  );
}
