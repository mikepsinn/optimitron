import { useEffect } from "react";
import type { Expression } from "../types";
import { useWishoniaAnimator } from "../hooks/useWishoniaAnimator";
import { preloadTier0 } from "../core/sprite-loader";

export interface WishoniaCharacterProps {
  /** Width in pixels (default 140) */
  size?: number;
  /** AnalyserNode for audio-driven lip-sync */
  analyserNode?: AnalyserNode | null;
  /** Facial expression */
  expression?: Expression;
  /** Body pose (default "idle") */
  bodyPose?: string;
  /** Base path for sprite assets (must end with /) */
  spritePath?: string;
  /** Sprite file format */
  spriteFormat?: "webp" | "png";
  /** Additional className for the container */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

export function WishoniaCharacter({
  size = 140,
  analyserNode,
  expression,
  bodyPose,
  spritePath = "/sprites/wishonia/",
  spriteFormat = "png",
  className,
  onClick,
}: WishoniaCharacterProps) {
  const { headSrc, bodySrc } = useWishoniaAnimator({
    analyserNode,
    expression,
    bodyPose,
    spritePath,
    spriteFormat,
  });

  // Preload tier 0 sprites on mount
  useEffect(() => {
    preloadTier0(spritePath, spriteFormat);
  }, [spritePath, spriteFormat]);

  const bodyHeight = Math.round(size * 0.57); // body is ~57% of total height

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: size,
        height: size * 1.57,
        cursor: onClick ? "pointer" : undefined,
      }}
      onClick={onClick}
    >
      {/* Head — bobs gently */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "95%",
          margin: "0 auto",
          animation: "wishonia-bob 7s ease-in-out alternate infinite",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={headSrc}
          alt=""
          style={{ display: "block", width: "100%" }}
          draggable={false}
        />
      </div>

      {/* Body — static below head */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          marginTop: -12,
          maxHeight: bodyHeight,
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bodySrc}
          alt=""
          style={{ display: "block", width: "100%" }}
          draggable={false}
        />
      </div>
    </div>
  );
}
