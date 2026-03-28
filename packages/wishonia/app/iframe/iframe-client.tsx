"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { WishoniaNarrator } from "@optimitron/wishonia-widget/narration";
import type { Expression, BodyPose } from "@optimitron/wishonia-widget";

/**
 * Embeddable iframe client — renders Wishonia on a transparent background.
 *
 * Query params: ?text=...&expression=...&bodyPose=...&size=140&voice=Kore
 * Dynamic control: host page sends postMessage({ type: "wishonia:speak", text, expression })
 */
export function IframeClient() {
  const searchParams = useSearchParams();

  const initialText = searchParams.get("text") ?? "";
  const initialExpression = (searchParams.get("expression") ?? "neutral") as Expression;
  const initialBodyPose = (searchParams.get("bodyPose") ?? "idle") as BodyPose;
  const size = parseInt(searchParams.get("size") ?? "140", 10);
  const voice = searchParams.get("voice") ?? "Kore";

  const [text, setText] = useState(initialText);
  const [expression, setExpression] = useState<Expression>(initialExpression);
  const [bodyPose, setBodyPose] = useState<BodyPose>(initialBodyPose);

  // Listen for postMessage commands from the host page
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      const data = e.data as Record<string, unknown>;
      if (!data || typeof data !== "object") return;

      switch (data.type) {
        case "wishonia:speak":
          if (typeof data.text === "string") setText(data.text);
          if (typeof data.expression === "string") setExpression(data.expression as Expression);
          if (typeof data.bodyPose === "string") setBodyPose(data.bodyPose as BodyPose);
          break;
        case "wishonia:expression":
          if (typeof data.expression === "string") setExpression(data.expression as Expression);
          if (typeof data.bodyPose === "string") setBodyPose(data.bodyPose as BodyPose);
          break;
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", height: "100vh" }}>
      <WishoniaNarrator
        tokenEndpoint="/api/gemini-live-token"
        text={text}
        voice={voice}
        expression={expression}
        bodyPose={bodyPose}
        size={size}
        position="custom"
        style={{ position: "relative" }}
      />
    </div>
  );
}
