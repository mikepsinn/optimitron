import Layout from "@/components/layout"
import { getPageMetadata } from "@/lib/nav-items"
import { CopyableCode } from "./copyable-code"

export const metadata = getPageMetadata("mcp")

const MCP_URL = "https://dfda.earth/api/mcp"
const CODEX_COMMAND = `codex mcp add dfda --url ${MCP_URL}\ncodex mcp login dfda`
const CLAUDE_CODE_COMMAND = `claude mcp add --transport http dfda ${MCP_URL}`
const GENERIC_CONFIG = JSON.stringify(
  {
    mcpServers: {
      dfda: { url: MCP_URL },
    },
  },
  null,
  2,
)

const capabilities = [
  {
    title: "Record what happened",
    body: "Log medication doses, foods, symptoms, mood, sleep, activity, labs, and vital signs in normal conversation.",
  },
  {
    title: "Ask for your history",
    body: "Pull back your own measurements by date or variable. Correct or delete a mistake without hunting through a spreadsheet.",
  },
  {
    title: "Keep a routine",
    body: "Create personal tracking reminders and check which measurements are due, answered, overdue, or snoozed.",
  },
  {
    title: "Answer several at once",
    body: "Review a day of reminders with your assistant and record several answers in one conversation.",
  },
] as const

const examplePrompts = [
  "Record that I took 200 mg of magnesium at 9:15 PM.",
  "Show my sleep-duration measurements from the last seven days.",
  "Remind me every morning at 8:00 to rate my mood from 1 to 5.",
] as const

function InstallCard({
  code,
  kicker,
  title,
}: {
  code: string
  kicker: string
  title: string
}) {
  return (
    <article className="min-w-0 border-4 border-black bg-brutal-beige p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <p className="text-xs font-black uppercase tracking-[0.18em]">{kicker}</p>
      <h3 className="mt-2 text-2xl font-black uppercase leading-tight">{title}</h3>
      <div className="mt-4">
        <CopyableCode code={code} label={`Copy ${kicker} setup`} />
      </div>
    </article>
  )
}

export default function DfdaMcpPage() {
  return (
    <Layout>
      <main className="bg-brutal-beige text-black">
        <section className="border-b-4 border-black bg-brutal-yellow">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:px-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em]">
                dFDA MCP Server
              </p>
              <h1 className="mt-4 max-w-4xl text-5xl font-black uppercase leading-[0.92] sm:text-7xl">
                Give your AI assistant a health memory.
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-bold leading-8 sm:text-xl">
                Tell it what you took, ate, felt, or measured. dFDA saves the
                measurement in your account, keeps your tracking reminders,
                and pulls your history back when you ask.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  className="border-4 border-black bg-brutal-pink px-6 py-3 text-center text-base font-black uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                  href="#connect"
                >
                  Connect your AI
                </a>
                <a
                  className="border-4 border-black bg-white px-6 py-3 text-center text-base font-black uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                  href="#tools"
                >
                  See what it can do
                </a>
              </div>
            </div>

            <div className="border-4 border-black bg-brutal-cyan p-5 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-xs font-black uppercase tracking-[0.18em]">
                MCP Server URL
              </p>
              <div className="mt-3">
                <CopyableCode code={MCP_URL} label="Copy server URL" />
              </div>
              <p className="mt-4 text-sm font-bold leading-6">
                Choose Streamable HTTP or HTTP when your client asks for the
                transport. OAuth is discovered automatically.
              </p>
            </div>
          </div>
        </section>

        <section
          className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"
          id="connect"
        >
          <p className="text-sm font-black uppercase tracking-[0.2em]">
            Start here
          </p>
          <h2 className="mt-2 max-w-3xl text-4xl font-black uppercase leading-none sm:text-5xl">
            Connect, sign in, record one thing.
          </h2>

          <ol className="mt-8 grid gap-5 lg:grid-cols-3">
            {[
              {
                title: "Add the server",
                body: "Use a command below or paste the server URL into your AI app's custom MCP connector settings.",
              },
              {
                title: "Create your account",
                body: "Your AI app opens Optimitron in a browser. Sign in with your email or create an account, then authorize personal tracking access.",
              },
              {
                title: "Try one measurement",
                body: 'Ask: “Record that I slept 7.5 hours last night.” Your assistant should confirm what it saved.',
              },
            ].map((step, index) => (
              <li
                className="border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                key={step.title}
              >
                <span className="flex h-10 w-10 items-center justify-center border-4 border-black bg-brutal-pink text-lg font-black">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-xl font-black uppercase">{step.title}</h3>
                <p className="mt-3 font-bold leading-7">{step.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <InstallCard
              code={CODEX_COMMAND}
              kicker="Codex"
              title="Add it, then open the sign-in flow."
            />
            <InstallCard
              code={CLAUDE_CODE_COMMAND}
              kicker="Claude Code"
              title="One command, then run /mcp."
            />
          </div>

          <article className="mt-6 min-w-0 border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xs font-black uppercase tracking-[0.18em]">
              ChatGPT, Claude, Cursor, and other MCP clients
            </p>
            <h3 className="mt-2 text-2xl font-black uppercase leading-tight">
              Paste the URL or this config.
            </h3>
            <p className="mt-3 max-w-3xl font-bold leading-7">
              Add a custom MCP connector or app, choose OAuth, and paste the
              server URL. If the client asks for JSON, use this block.
            </p>
            <div className="mt-4">
              <CopyableCode code={GENERIC_CONFIG} label="Copy MCP config" />
            </div>
          </article>

          <div className="mt-8 border-4 border-black bg-brutal-cyan p-5">
            <p className="font-black uppercase">No second dFDA signup.</p>
            <p className="mt-2 max-w-4xl font-bold leading-7">
              The authorization screen creates or signs in to the same account
              that stores your dFDA data. The server requests personal tracking
              access only. You can deny access or disconnect the MCP client at
              any time.
            </p>
          </div>
        </section>

        <section className="border-y-4 border-black bg-brutal-pink" id="tools">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <p className="text-sm font-black uppercase tracking-[0.2em]">
              What it can do
            </p>
            <h2 className="mt-2 max-w-3xl text-4xl font-black uppercase leading-none sm:text-5xl">
              Ten tools. Your data. Normal sentences.
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {capabilities.map((capability) => (
                <article
                  className="border-4 border-black bg-white p-5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                  key={capability.title}
                >
                  <h3 className="text-xl font-black uppercase">
                    {capability.title}
                  </h3>
                  <p className="mt-3 font-bold leading-7">{capability.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em]">
              Try these
            </p>
            <h2 className="mt-2 text-4xl font-black uppercase leading-none">
              Three useful first requests.
            </h2>
          </div>
          <ul className="grid gap-4">
            {examplePrompts.map((prompt) => (
              <li
                className="border-4 border-black bg-brutal-yellow p-4 font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
                key={prompt}
              >
                “{prompt}”
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t-4 border-black bg-black text-white">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="font-bold leading-7">
              dFDA records and retrieves your data. It does not diagnose a
              condition or replace a clinician.
            </p>
          </div>
        </section>
      </main>
    </Layout>
  )
}
