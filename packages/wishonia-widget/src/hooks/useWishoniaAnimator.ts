import { useCallback, useEffect, useRef, useState } from "react";
import type { Expression, MouthShape } from "../types";
import {
  getHeadName,
  getIdleHead,
  amplitudeToViseme,
  CHAR_TO_VISEME,
} from "../core/viseme-map";
import { getSpriteUrl } from "../core/sprite-loader";

export interface UseWishoniaAnimatorOptions {
  /** Audio AnalyserNode to read amplitude from (for lip-sync) */
  analyserNode?: AnalyserNode | null;
  /** Current expression (default: "neutral") */
  expression?: Expression;
  /** Body pose (default: "idle") */
  bodyPose?: string;
  /** Sprite base path (must end with /) */
  spritePath?: string;
  /** Sprite format */
  spriteFormat?: "webp" | "png";
  /** Enable automatic blinking (default: true) */
  enableBlink?: boolean;
}

export interface UseWishoniaAnimatorReturn {
  /** URL for the current head sprite */
  headSrc: string;
  /** URL for the current body sprite */
  bodySrc: string;
  /** Whether the character is currently speaking */
  isSpeaking: boolean;
  /** Set the facial expression */
  setExpression: (expr: Expression) => void;
  /** Animate text-driven lip-sync (fallback when no audio) */
  speakText: (text: string, expression?: Expression) => void;
  /** Stop speaking, return to idle */
  stopSpeaking: () => void;
}

const BLINK_MIN_MS = 4000;
const BLINK_RANGE_MS = 3000;
const BLINK_DURATION_MS = 150;
const AMPLITUDE_THROTTLE_MS = 67; // ~15fps

export function useWishoniaAnimator(
  options: UseWishoniaAnimatorOptions = {},
): UseWishoniaAnimatorReturn {
  const {
    analyserNode = null,
    expression: externalExpression,
    bodyPose = "idle",
    spritePath = "/sprites/wishonia/",
    spriteFormat = "png",
    enableBlink = true,
  } = options;

  const [headName, setHeadName] = useState("neutral-smile");
  const [expression, setExpressionState] = useState<Expression>("neutral");
  const [speaking, setSpeaking] = useState(false);
  const speakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speakingRef = useRef(false);
  const expressionRef = useRef<Expression>("neutral");
  const lastAmplitudeUpdate = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Sync expression from external prop
  useEffect(() => {
    if (externalExpression) {
      expressionRef.current = externalExpression;
      setExpressionState(externalExpression);
      if (!speakingRef.current) {
        setHeadName(getIdleHead(externalExpression));
      }
    }
  }, [externalExpression]);

  const setExpression = useCallback((expr: Expression) => {
    expressionRef.current = expr;
    setExpressionState(expr);
    if (!speakingRef.current) {
      setHeadName(getIdleHead(expr));
    }
  }, []);

  // Blinking
  useEffect(() => {
    if (!enableBlink || typeof window === "undefined") return;

    const startBlink = () => {
      blinkTimerRef.current = setInterval(() => {
        if (speakingRef.current) return;
        setHeadName("blink-smile");
        setTimeout(() => {
          if (!speakingRef.current) {
            setHeadName(getIdleHead(expressionRef.current));
          }
        }, BLINK_DURATION_MS);
      }, BLINK_MIN_MS + Math.random() * BLINK_RANGE_MS);
    };

    startBlink();
    return () => {
      if (blinkTimerRef.current) clearInterval(blinkTimerRef.current);
    };
  }, [enableBlink]);

  // Amplitude-driven lip-sync (from AnalyserNode)
  useEffect(() => {
    if (!analyserNode || typeof window === "undefined") return;

    const dataArray = new Uint8Array(analyserNode.fftSize);

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);

      const now = Date.now();
      if (now - lastAmplitudeUpdate.current < AMPLITUDE_THROTTLE_MS) return;
      lastAmplitudeUpdate.current = now;

      analyserNode.getByteTimeDomainData(dataArray);

      // Calculate RMS amplitude
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const sample = ((dataArray[i] ?? 128) - 128) / 128;
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / dataArray.length);

      if (rms > 0.01) {
        speakingRef.current = true;
        setSpeaking(true);
        const viseme = amplitudeToViseme(rms);
        setHeadName(getHeadName(expressionRef.current, viseme));
      } else if (speakingRef.current) {
        // Brief silence — keep speaking state for a moment
        speakingRef.current = false;
        setSpeaking(false);
        setHeadName(getIdleHead(expressionRef.current));
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyserNode]);

  // Text-driven lip-sync (fallback)
  const speakText = useCallback(
    (text: string, expr?: Expression) => {
      const useExpr = expr ?? expressionRef.current;
      expressionRef.current = useExpr;
      speakingRef.current = true;
      setSpeaking(true);

      const chars = text.toLowerCase().split("");
      let idx = 0;

      const nextChar = () => {
        if (idx >= chars.length || !speakingRef.current) {
          speakingRef.current = false;
          setSpeaking(false);
          setHeadName(getIdleHead(expressionRef.current));
          return;
        }

        const ch = chars[idx] ?? " ";
        const viseme: MouthShape = CHAR_TO_VISEME[ch] ?? "small";
        setHeadName(getHeadName(useExpr, viseme));
        idx++;

        // Skip consecutive same-viseme chars
        while (idx < chars.length) {
          const nextViseme = CHAR_TO_VISEME[chars[idx] ?? " "] ?? "small";
          if (nextViseme !== viseme) break;
          idx++;
        }

        speakTimerRef.current = setTimeout(nextChar, 80);
      };

      nextChar();
    },
    [],
  );

  const stopSpeaking = useCallback(() => {
    speakingRef.current = false;
    setSpeaking(false);
    if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
    setHeadName(getIdleHead(expressionRef.current));
  }, []);

  const headSrc = getSpriteUrl(headName, spritePath, spriteFormat);
  const bodySrc = getSpriteUrl(`body-${bodyPose}`, spritePath, spriteFormat);

  return {
    headSrc,
    bodySrc,
    isSpeaking: speaking,
    setExpression,
    speakText,
    stopSpeaking,
  };
}
