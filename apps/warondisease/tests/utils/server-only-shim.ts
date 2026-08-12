// Intentional no-op. `server-only` is a Next.js sentinel that throws if a
// module is bundled into a client build. Server-only modules import it for
// that check. In Node-based tests this check is unnecessary, so we alias
// it to this empty module in vitest.config.ts.
export {}
