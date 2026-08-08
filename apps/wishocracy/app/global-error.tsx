"use client"

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            background: "#FEFAE0",
          }}
        >
          <div
            style={{
              maxWidth: "42rem",
              width: "100%",
            }}
          >
            <div
              style={{
                background: "white",
                border: "4px solid black",
                padding: "3rem 2rem",
                boxShadow: "8px 8px 0px 0px rgba(0,0,0,1)",
              }}
            >
              <h1
                style={{
                  fontSize: "6rem",
                  fontWeight: "900",
                  marginBottom: "1rem",
                  lineHeight: 1,
                }}
              >
                500
              </h1>
              <h2
                style={{
                  fontSize: "2.5rem",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  marginBottom: "1rem",
                  lineHeight: 1.2,
                }}
              >
                OOPS! SOMETHING <span style={{ color: "#FF6B9D" }}>BROKE</span>
              </h2>

              <div
                style={{
                  background: "#FDFD96",
                  border: "4px solid black",
                  padding: "1.5rem",
                  marginBottom: "2rem",
                  boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                }}
              >
                <p style={{ fontWeight: "700", marginBottom: "0.5rem", fontSize: "1.125rem" }}>
                  🔧 THE TECHNICAL STUFF:
                </p>
                <p style={{ fontSize: "0.875rem", margin: 0 }}>
                  {error.message || "The server had a little oopsie. It happens to the best of us."}
                </p>
              </div>

              <p style={{ fontSize: "1.125rem", marginBottom: "2rem", lineHeight: 1.6 }}>
                Don't worry! Even the best code has bad days. Maybe it needs coffee? ☕
              </p>

              <button
                onClick={() => reset()}
                style={{
                  padding: "1rem 2rem",
                  fontSize: "1.125rem",
                  fontWeight: "900",
                  textTransform: "uppercase",
                  border: "4px solid black",
                  background: "#FF6B9D",
                  color: "white",
                  cursor: "pointer",
                  boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translate(4px, 4px)"
                  e.currentTarget.style.boxShadow = "none"
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translate(0, 0)"
                  e.currentTarget.style.boxShadow = "4px 4px 0px 0px rgba(0,0,0,1)"
                }}
              >
                TRY AGAIN
              </button>

              <p style={{ marginTop: "2rem", fontSize: "0.875rem", color: "#666" }}>
                If this keeps happening, maybe it's time to blame the intern? 🤷
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
