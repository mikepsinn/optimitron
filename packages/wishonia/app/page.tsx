"use client";

import { useState } from "react";
import { WishoniaNarrator } from "@optimitron/wishonia-widget/narration";
import type { Expression, BodyPose } from "@optimitron/wishonia-widget";

const EXPRESSIONS: Expression[] = [
  "neutral", "happy", "excited", "sad", "annoyed", "skeptical",
  "surprised", "eyeroll", "smirk", "thinking", "sideeye", "lookright",
];

const BODY_POSES: BodyPose[] = [
  "idle", "presenting", "thinking", "arms-crossed", "counting",
  "excited", "hand-chest", "hands-hips", "open-palms", "point-right",
  "shrug", "wide-gesture", "listening", "fist", "palms-down",
];

const SPEAKING_INSTRUCTIONS =
  "Generate a patient, warm voice explaining something counterintuitive to someone smart. " +
  "Not condescending. Respects the listener's intelligence. Slightly quick.";

const EXAMPLE_TEXTS = [
  "Your species named your planet... dirt.",
  "On Wishonia, governance takes about four minutes a week.",
  "I looked up the last person on your planet who went around suggesting universal love and peace. You nailed him to a piece of wood.",
  "The data existed. Nobody looked at it. The data did not have a lobbying firm.",
];

export default function DemoPage() {
  const [text, setText] = useState("");
  const [inputText, setInputText] = useState("");
  const [expression, setExpression] = useState<Expression>("neutral");
  const [bodyPose, setBodyPose] = useState<BodyPose>("idle");
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://wishonia.optimitron.com";

  const iframeSnippet = `<iframe src="${baseUrl}/iframe?text=Hello+humans&expression=eyeroll"\n  style="position:fixed;bottom:0;right:0;width:200px;height:320px;border:none;background:transparent"\n  allow="autoplay"></iframe>`;

  const scriptSnippet = `<script src="${baseUrl}/embed.js"\n  data-position="bottom-right"\n  data-size="140"></script>`;

  const reactSnippet = `import { WishoniaNarrator } from "@optimitron/wishonia-widget/narration"

<WishoniaNarrator
  tokenEndpoint="${baseUrl}/api/gemini-live-token"
  text="Hello humans"
  expression="eyeroll"
  size={140}
  position="bottom-right"
/>`;

  function handleSpeak() {
    setText(inputText);
  }

  function handleExample(t: string) {
    setInputText(t);
    setText(t);
  }

  function copyToClipboard(snippet: string, label: string) {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    }).catch(() => {});
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, sans-serif", color: "#e0e0e0", background: "#0a0a0a", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>
        Wishonia
      </h1>
      <p style={{ color: "#888", marginBottom: 40 }}>
        AI governance narrator — embeddable on any website with one line of code.
      </p>

      {/* Live preview + controls */}
      <div style={{ display: "flex", gap: 32, marginBottom: 48, flexWrap: "wrap" }}>
        {/* Character preview */}
        <div style={{ background: "#111", border: "2px solid #333", borderRadius: 8, padding: 20, minWidth: 200, display: "flex", justifyContent: "center" }}>
          <WishoniaNarrator
            tokenEndpoint="/api/gemini-live-token"
            text={text}
            voice="Kore"
            speakingInstructions={SPEAKING_INSTRUCTIONS}
            expression={expression}
            bodyPose={bodyPose}
            size={140}
            position="custom"
            style={{ position: "relative" }}
          />
        </div>

        {/* Controls */}
        <div style={{ flex: 1, minWidth: 300 }}>
          {/* Text input */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Say something:</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSpeak()}
                placeholder="Type narration text..."
                style={{ flex: 1, padding: "8px 12px", background: "#1a1a1a", border: "1px solid #333", borderRadius: 4, color: "#e0e0e0", fontSize: 14 }}
              />
              <button
                onClick={handleSpeak}
                style={{ padding: "8px 16px", background: "#333", border: "1px solid #555", borderRadius: 4, color: "#e0e0e0", cursor: "pointer", fontSize: 14 }}
              >
                Speak
              </button>
            </div>
          </div>

          {/* Example texts */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Examples:</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {EXAMPLE_TEXTS.map((t, i) => (
                <button
                  key={i}
                  onClick={() => handleExample(t)}
                  style={{ padding: "4px 8px", background: "#1a1a1a", border: "1px solid #333", borderRadius: 4, color: "#aaa", cursor: "pointer", fontSize: 11, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {t.slice(0, 40)}...
                </button>
              ))}
            </div>
          </div>

          {/* Expression picker */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Expression:</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {EXPRESSIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setExpression(e)}
                  style={{
                    padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 11,
                    background: expression === e ? "#555" : "#1a1a1a",
                    border: expression === e ? "1px solid #888" : "1px solid #333",
                    color: expression === e ? "#fff" : "#aaa",
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Body pose picker */}
          <div>
            <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>Body Pose:</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {BODY_POSES.map((p) => (
                <button
                  key={p}
                  onClick={() => setBodyPose(p)}
                  style={{
                    padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 11,
                    background: bodyPose === p ? "#555" : "#1a1a1a",
                    border: bodyPose === p ? "1px solid #888" : "1px solid #333",
                    color: bodyPose === p ? "#fff" : "#aaa",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Embed code snippets */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, borderTop: "1px solid #222", paddingTop: 32 }}>
        Embed on Your Website
      </h2>

      {[
        { label: "iframe", desc: "Simplest — works everywhere, zero dependencies", code: iframeSnippet },
        { label: "script", desc: "Richer — adds window.wishonia API for dynamic control", code: scriptSnippet },
        { label: "React", desc: "For React/Next.js apps — full programmatic control", code: reactSnippet },
      ].map(({ label, desc, code }) => (
        <div key={label} style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
              <span style={{ fontSize: 12, color: "#666", marginLeft: 8 }}>{desc}</span>
            </div>
            <button
              onClick={() => copyToClipboard(code, label)}
              style={{ padding: "4px 12px", background: "#222", border: "1px solid #444", borderRadius: 4, color: "#aaa", cursor: "pointer", fontSize: 11 }}
            >
              {copied === label ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre style={{ background: "#111", border: "1px solid #333", borderRadius: 4, padding: 12, overflow: "auto", fontSize: 12, lineHeight: 1.5, color: "#ccc" }}>
            {code}
          </pre>
        </div>
      ))}
    </div>
  );
}
