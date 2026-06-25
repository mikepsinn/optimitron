"use client";

import { useEffect } from "react";
import {
  TreatyVoteFlow,
  type TreatyVoteFlowProps,
} from "@/components/landing/TreatyVoteFlow";

const SURVEY_READY_MESSAGE = "optimitron:survey-ready";
const SURVEY_HEIGHT_MESSAGE = "optimitron:survey-height";

export function SurveyVoteFlowContent(props: TreatyVoteFlowProps) {
  useEffect(() => {
    if (window.parent === window) {
      return;
    }

    function measuredHeight() {
      return Math.ceil(
        document.body?.scrollHeight ?? document.documentElement.scrollHeight,
      );
    }

    window.parent.postMessage(
      {
        height: measuredHeight(),
        path: window.location.pathname,
        type: SURVEY_READY_MESSAGE,
      },
      "*",
    );

    function postHeight() {
      window.parent.postMessage(
        { height: measuredHeight(), type: SURVEY_HEIGHT_MESSAGE },
        "*",
      );
    }

    const observer = new ResizeObserver(() => postHeight());
    observer.observe(document.documentElement);
    if (document.body) {
      observer.observe(document.body);
    }

    return () => observer.disconnect();
  }, []);

  return <TreatyVoteFlow {...props} />;
}
