"use client";

import { useEffect } from "react";
import {
  TreatyVoteFlow,
  type TreatyVoteFlowProps,
} from "@/components/landing/TreatyVoteFlow";

const SURVEY_READY_MESSAGE = "optimitron:survey-ready";

export function SurveyVoteFlowContent(props: TreatyVoteFlowProps) {
  useEffect(() => {
    if (window.parent === window) {
      return;
    }

    window.parent.postMessage(
      {
        path: window.location.pathname,
        type: SURVEY_READY_MESSAGE,
      },
      "*",
    );
  }, []);

  return <TreatyVoteFlow {...props} />;
}
