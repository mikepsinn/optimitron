import type { CSSProperties } from "react";
import type { Expression } from "../types";
import { WishoniaCharacter } from "./WishoniaCharacter";

export interface WishoniaWidgetProps {
  /** Position on screen */
  position?: "bottom-right" | "bottom-left" | "custom";
  /** Custom position styles when position="custom" */
  style?: CSSProperties;
  /** AnalyserNode for lip-sync */
  analyserNode?: AnalyserNode | null;
  /** Facial expression */
  expression?: Expression;
  /** Body pose */
  bodyPose?: string;
  /** Character size in px (default 140) */
  size?: number;
  /** Hide the widget */
  hidden?: boolean;
  /** Sprite base path */
  spritePath?: string;
  /** Sprite format */
  spriteFormat?: "webp" | "png";
  /** Click handler */
  onClick?: () => void;
}

const POSITION_STYLES: Record<string, CSSProperties> = {
  "bottom-right": {
    position: "fixed",
    bottom: 100,
    right: 16,
    zIndex: 35,
  },
  "bottom-left": {
    position: "fixed",
    bottom: 100,
    left: 16,
    zIndex: 35,
  },
};

export function WishoniaWidget({
  position = "bottom-right",
  style,
  analyserNode,
  expression,
  bodyPose,
  size = 140,
  hidden = false,
  spritePath,
  spriteFormat,
  onClick,
}: WishoniaWidgetProps) {
  if (hidden) return null;

  const posStyle =
    position === "custom" ? style : POSITION_STYLES[position];

  return (
    <div
      style={{
        ...posStyle,
        transition: "opacity 0.3s ease",
      }}
    >
      <WishoniaCharacter
        size={size}
        analyserNode={analyserNode}
        expression={expression}
        bodyPose={bodyPose}
        spritePath={spritePath}
        spriteFormat={spriteFormat}
        onClick={onClick}
      />
    </div>
  );
}
