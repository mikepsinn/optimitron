// Test-process preload only. The deployed app has no email capture route or auth bypass.
import { appendFile, mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { http, HttpResponse } from "msw"
import { setupServer } from "msw/node"

const localHosts = ["localhost", "127.0.0.1", "[::1]"]
const database = new URL(process.env.DATABASE_URL)
if (
  !localHosts.includes(database.hostname) ||
  !/(^|[_-])test($|[_-])|auth_e2e/u.test(database.pathname.slice(1)) ||
  !localHosts.includes(new URL(process.env.NEXTAUTH_URL).hostname) ||
  process.env.RESEND_API_KEY !== "re_auth_e2e_no_real_delivery" ||
  !process.env.AUTH_E2E_OUTBOX
) {
  throw new Error("Email capture is restricted to the local auth E2E environment.")
}

const outbox = process.env.AUTH_E2E_OUTBOX
await mkdir(path.dirname(outbox), { recursive: true })
await writeFile(outbox, "", { mode: 0o600 })
const server = setupServer(
  http.post("https://api.resend.com/emails", async ({ request }) => {
    const message = await request.json()
    await appendFile(outbox, `${JSON.stringify(message)}\n`)
    return HttpResponse.json({ id: "auth-e2e-captured-email" })
  }),
)
server.listen({ onUnhandledRequest: "bypass" })
