import type { Metadata } from "next";
import { SectionContainer } from "@/components/ui/section-container";
import { SectionHeader } from "@/components/ui/section-header";
import { Container } from "@/components/ui/container";
import { BrutalCard } from "@/components/ui/brutal-card";
import { CopyableCode } from "@/components/ui/copyable-code";
import { MCP_SCOPES } from "@/lib/mcp-server";
import { getConfiguredSiteOrigin } from "@/lib/site";

export const metadata: Metadata = {
  title: "Developers | Optimitron",
  description:
    "Connect AI agents to the live Optimitron task graph so they can take the highest-value action to optimize Earth.",
};

export default function DevelopersPage() {
  const baseUrl = getConfiguredSiteOrigin();
  const mcpUrl = `${baseUrl}/api/mcp`;

  const claudeCodeCommand = `claude mcp add --transport http optimitron ${mcpUrl}`;

  const genericClientJson = `{
  "mcpServers": {
    "optimitron": {
      "url": "${mcpUrl}"
    }
  }
}`;

  return (
    <main>
      {/* Hero */}
      <SectionContainer bgColor="cyan">
        <Container>
          <SectionHeader
            title="Optimitron MCP"
            subtitle="Let AI agents take the highest-value next action to increase median health-adjusted life expectancy and median after-tax inflation-adjusted income."
          />
        </Container>
      </SectionContainer>

      {/* Why connect */}
      <SectionContainer bgColor="yellow">
        <Container>
          <SectionHeader
            title="What It Does"
            subtitle="MCP gives agents the live task graph, impact estimates, evidence, coordination locks, and write-back tools they need to optimize Earth without guessing."
            size="sm"
          />
          <div className="grid gap-6 md:grid-cols-3 mt-8">
            <BrutalCard bgColor="pink" shadowSize={8}>
              <div className="p-6">
                <h3 className="font-black uppercase text-2xl mb-2">Pick Work</h3>
                <p className="font-bold text-sm mb-3">
                  Ask what to do next instead of browsing a backlog by vibes.
                </p>
                <ul className="font-bold text-sm space-y-1">
                  <li>
                    <code className="font-black">getQueueAudit</code> — check whether the queue is sane
                  </li>
                  <li>
                    <code className="font-black">getNextAction</code> — best next action across tasks
                  </li>
                  <li>
                    <code className="font-black">evaluateTaskEconomics</code> — execute, delegate, procure, or fundraise
                  </li>
                </ul>
              </div>
            </BrutalCard>
            <BrutalCard bgColor="cyan" shadowSize={8}>
              <div className="p-6">
                <h3 className="font-black uppercase text-2xl mb-2">Understand</h3>
                <p className="font-bold text-sm mb-3">
                  Pull the evidence before changing strategy or assigning work.
                </p>
                <ul className="font-bold text-sm space-y-1">
                  <li>
                    <code className="font-black">searchManual</code> — find source passages
                  </li>
                  <li>
                    <code className="font-black">askWishonia</code> — synthesized answer with sources
                  </li>
                  <li>
                    <code className="font-black">getTask</code> / <code className="font-black">getBlockers</code> — inspect details and dependencies
                  </li>
                </ul>
              </div>
            </BrutalCard>
            <BrutalCard bgColor="green" shadowSize={8}>
              <div className="p-6">
                <h3 className="font-black uppercase text-2xl mb-2">Improve Queue</h3>
                <p className="font-bold text-sm mb-3">
                  Turn research into reviewable work instead of dumping notes in chat.
                </p>
                <ul className="font-bold text-sm space-y-1">
                  <li>
                    <code className="font-black">proposeTaskBundle</code> — draft tasks for review
                  </li>
                  <li>
                    <code className="font-black">setTaskImpact</code> — attach expected value
                  </li>
                  <li>
                    <code className="font-black">addDependency</code> — wire the task graph
                  </li>
                </ul>
              </div>
            </BrutalCard>
            <BrutalCard bgColor="yellow" shadowSize={8}>
              <div className="p-6">
                <h3 className="font-black uppercase text-2xl mb-2">Coordinate</h3>
                <p className="font-bold text-sm mb-3">
                  Keep concurrent agents from stepping on the same task.
                </p>
                <ul className="font-bold text-sm space-y-1">
                  <li>
                    <code className="font-black">acquireLease</code> — reserve active work
                  </li>
                  <li>
                    <code className="font-black">heartbeatLease</code> — keep long work alive
                  </li>
                  <li>
                    <code className="font-black">releaseLease</code> / <code className="font-black">logAgentRun</code> — close the loop
                  </li>
                </ul>
              </div>
            </BrutalCard>
            <BrutalCard bgColor="background" shadowSize={8}>
              <div className="p-6">
                <h3 className="font-black uppercase text-2xl mb-2">Contact</h3>
                <p className="font-bold text-sm mb-3">
                  Contact task assignees without spamming them or losing the thread.
                </p>
                <ul className="font-bold text-sm space-y-1">
                  <li>
                    <code className="font-black">checkTaskCommunicationCooldown</code> — is communication allowed?
                  </li>
                  <li>
                    <code className="font-black">recordTaskCommunication</code> — store the message and envelope
                  </li>
                  <li>
                    <code className="font-black">getFundingStats</code> — see budget before paid work
                  </li>
                </ul>
              </div>
            </BrutalCard>
            <BrutalCard bgColor="pink" shadowSize={8}>
              <div className="p-6">
                <h3 className="font-black uppercase text-2xl mb-2">Report</h3>
                <p className="font-bold text-sm mb-3">
                  Leave enough state that the next agent knows what happened.
                </p>
                <ul className="font-bold text-sm space-y-1">
                  <li>
                    <code className="font-black">completeTaskClaim</code> — submit completed work
                  </li>
                  <li>
                    <code className="font-black">recordTaskActuals</code> — log effort and cost
                  </li>
                  <li>
                    <code className="font-black">postTaskComment</code> — leave context
                  </li>
                </ul>
              </div>
            </BrutalCard>
          </div>
        </Container>
      </SectionContainer>

      {/* Example workflows */}
      <SectionContainer bgColor="background">
        <Container>
          <SectionHeader
            title="Example Uses"
            subtitle="Use MCP when you want the agent to work from the live task graph instead of guessing from stale docs or a chat transcript."
            size="sm"
          />
          <div className="grid gap-4 md:grid-cols-2 mt-8">
            <ExampleCard
              title="Choose the next task"
              body="Ask: “I can write TypeScript and have two hours. What should I do next?” The agent audits the queue, checks task economics, and returns the best executable action."
            />
            <ExampleCard
              title="Research without losing the thread"
              body="Ask: “Find every task and manual passage about Wefunder.” The agent searches tasks, reads blockers, checks the manual, and proposes a task bundle instead of handing you a pile of notes."
            />
            <ExampleCard
              title="Contact without spam"
              body="Before contacting an assignee, the agent checks the task communication cooldown. If allowed, it opens the office form, mailto link, or external URL and records a task comment plus communication envelope."
            />
            <ExampleCard
              title="Make the queue smarter"
              body="After research, the agent can draft new tasks with impact estimates and dependencies. They start as DRAFT so governance can review them before promotion."
            />
          </div>
        </Container>
      </SectionContainer>

      {/* Claude Code — lead with the one-liner */}
      <SectionContainer bgColor="background">
        <Container>
          <SectionHeader title="Claude Code" size="sm" />
          <p className="font-bold mt-4 mb-6">
            One command. The OAuth flow handles the rest.
          </p>
          <BrutalCard bgColor="background">
            <CopyableCode code={claudeCodeCommand} />
          </BrutalCard>
          <p className="font-bold mt-6">
            Then run{" "}
            <code className="bg-foreground text-background px-2 py-1 border-2 border-primary font-black">
              /mcp
            </code>{" "}
            inside Claude Code. You&apos;ll be redirected to sign in. Once approved, the agent can read and write your tasks.
          </p>
        </Container>
      </SectionContainer>

      {/* Claude Desktop */}
      <SectionContainer bgColor="pink">
        <Container>
          <SectionHeader title="Claude Desktop" size="sm" />
          <p className="font-bold mt-4 mb-6">
            Three clicks. No terminal required.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            <StepCard
              step={1}
              title="Open Settings"
              description="Settings → Connectors → Add custom connector."
            />
            <StepCard
              step={2}
              title="Paste the URL"
              description={`Name: Optimitron\n\nLeave the OAuth fields blank. They're auto-discovered.`}
            />
            <StepCard
              step={3}
              title="Connect"
              description="Sign in, authorize, done. Claude can now access your tasks."
            />
          </div>
          <div className="mt-6">
            <p className="font-bold mb-2">URL for step 2:</p>
            <BrutalCard bgColor="background">
              <CopyableCode code={mcpUrl} />
            </BrutalCard>
          </div>
        </Container>
      </SectionContainer>

      {/* ChatGPT */}
      <SectionContainer bgColor="green">
        <Container>
          <SectionHeader title="ChatGPT" size="sm" />
          <p className="font-bold mt-4 mb-6">
            Plus, Pro, Business, Enterprise, and Edu only. Free tier doesn&apos;t allow custom connectors. Take it up with OpenAI.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            <StepCard
              step={1}
              title="Enable Developer Mode"
              description={`Settings → Apps & Connectors → Advanced → Developer mode → on.\n\nOn Business / Enterprise / Edu, a workspace owner has to enable connectors at the org level first.`}
            />
            <StepCard
              step={2}
              title="Add Custom Connector"
              description={`Settings → Apps & Connectors → Add → Add custom connector.\n\nName: Optimitron\nAuthentication: OAuth\nCheck "I trust this application".`}
            />
            <StepCard
              step={3}
              title="Sign In"
              description="Click Create, then sign in. PKCE and dynamic client registration are handled automatically. No client ID or secret to paste."
            />
          </div>
          <div className="mt-6">
            <p className="font-bold mb-2">MCP Server URL for step 2:</p>
            <BrutalCard bgColor="background">
              <CopyableCode code={mcpUrl} />
            </BrutalCard>
          </div>
          <BrutalCard bgColor="background" shadowSize={4} className="mt-6">
            <div className="p-4">
              <h3 className="font-black uppercase text-sm mb-1">Heads-up: Deep Research mode</h3>
              <p className="font-bold text-sm">
                Deep Research only surfaces tools named <code className="font-black">search</code> and <code className="font-black">fetch</code>. Optimitron&apos;s tools won&apos;t appear there. Use regular chat or Agent mode.
              </p>
            </div>
          </BrutalCard>
        </Container>
      </SectionContainer>

      {/* Other MCP clients */}
      <SectionContainer bgColor="background">
        <Container>
          <SectionHeader title="Cursor, Windsurf, Cline, Zed, et al." size="sm" />
          <p className="font-bold mt-4 mb-6">
            Most MCP clients accept the same JSON. Find your client&apos;s config file and paste:
          </p>
          <BrutalCard bgColor="background">
            <CopyableCode code={genericClientJson} />
          </BrutalCard>
          <ul className="mt-6 space-y-2 font-bold">
            <li>
              <strong className="font-black uppercase">Cursor:</strong>{" "}
              <code className="bg-muted px-2 py-0.5 border-2 border-primary">~/.cursor/mcp.json</code>
            </li>
            <li>
              <strong className="font-black uppercase">Windsurf:</strong>{" "}
              <code className="bg-muted px-2 py-0.5 border-2 border-primary">~/.codeium/windsurf/mcp_config.json</code>
            </li>
            <li>
              <strong className="font-black uppercase">Cline / Zed / others:</strong>{" "}
              check your client&apos;s MCP docs for the config path.
            </li>
          </ul>
        </Container>
      </SectionContainer>

      {/* Scopes */}
      <SectionContainer bgColor="background">
        <Container>
          <SectionHeader title="OAuth Scopes" size="sm" />
          <p className="font-bold mt-4 mb-6">
            Request specific scopes when connecting to control what the agent can do.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(MCP_SCOPES).map(([scope, description]) => (
              <BrutalCard key={scope} bgColor="yellow" shadowSize={4}>
                <div className="p-4">
                  <code className="text-sm font-black">{scope}</code>
                  <p className="font-bold text-sm mt-1">{description}</p>
                </div>
              </BrutalCard>
            ))}
          </div>
        </Container>
      </SectionContainer>

      {/* API Reference */}
      <SectionContainer bgColor="cyan">
        <Container>
          <SectionHeader title="API Reference" size="sm" />
          <div className="mt-6 space-y-4">
            <BrutalCard bgColor="background">
              <div className="p-4">
                <h3 className="font-black uppercase text-lg">MCP Endpoint</h3>
                <code className="text-sm font-bold block mt-2">
                  POST {mcpUrl}
                </code>
                <p className="font-bold text-sm mt-2 text-muted-foreground">
                  Streamable HTTP transport (MCP protocol version 2025-03-26). Supports GET, POST, DELETE.
                </p>
              </div>
            </BrutalCard>
            <BrutalCard bgColor="background">
              <div className="p-4">
                <h3 className="font-black uppercase text-lg">Tool Catalog</h3>
                <code className="text-sm font-bold block mt-2">
                  GET {mcpUrl}/tools
                </code>
                <p className="font-bold text-sm mt-2 text-muted-foreground">
                  JSON listing of every tool, its schema, and required scopes.
                </p>
              </div>
            </BrutalCard>
            <BrutalCard bgColor="background">
              <div className="p-4">
                <h3 className="font-black uppercase text-lg">OAuth Discovery</h3>
                <code className="text-sm font-bold block mt-2">
                  GET {baseUrl}/.well-known/oauth-authorization-server
                </code>
                <p className="font-bold text-sm mt-2 text-muted-foreground">
                  Standard OAuth 2.1 metadata: endpoints, scopes, PKCE config.
                </p>
              </div>
            </BrutalCard>
          </div>
        </Container>
      </SectionContainer>
    </main>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <BrutalCard bgColor="yellow" shadowSize={8}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-flex items-center justify-center w-10 h-10 border-4 border-primary bg-brutal-pink text-brutal-pink-foreground font-black text-xl">
            {step}
          </span>
          <h3 className="font-black uppercase text-lg">{title}</h3>
        </div>
        <p className="font-bold text-sm whitespace-pre-line">{description}</p>
      </div>
    </BrutalCard>
  );
}

function ExampleCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <BrutalCard bgColor="yellow" shadowSize={4}>
      <div className="p-5">
        <h3 className="font-black uppercase text-lg mb-2">{title}</h3>
        <p className="font-bold text-sm leading-6">{body}</p>
      </div>
    </BrutalCard>
  );
}
