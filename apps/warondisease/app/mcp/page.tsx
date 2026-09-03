import type { Metadata } from "next";
import Link from "next/link";
import Layout from "@/components/layout";
import { CopyableCode } from "@/components/shared/CopyableCode";
import { MCP_SCOPES } from "@/lib/mcp-catalog";
import { optimitronUrl } from "@/lib/optimitron-links";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Optimitron MCP",
  description:
    "Connect Claude, ChatGPT, or another MCP client to the live Optimitron task graph so an agent can pick work, read the evidence, and coordinate through task comments.",
};

interface InstallStep {
  body: string;
  title: string;
}

interface InstallBlockProps {
  code?: string;
  kicker: string;
  steps: InstallStep[];
  summary: string;
  title: string;
}

// The MCP server, its OAuth endpoints, and the tool catalog are all served by
// optimitron.com. This page documents them from warondisease.org, so every URL
// a reader copies has to be absolute.
const mcpUrl = optimitronUrl("/api/mcp");
const toolsUrl = optimitronUrl("/api/mcp/tools");
const oauthMetadataUrl = optimitronUrl(
  "/.well-known/oauth-authorization-server",
);

const toolGroups = [
  {
    title: "Pick work",
    body: "Audit the queue, compare expected value, and ask for the next useful action.",
    tools: ["getQueueAudit", "getNextAction", "getMyQueue"],
  },
  {
    title: "Read the evidence",
    body: "Search the manual, inspect task details, and fetch page text before proposing changes.",
    tools: ["searchManual", "askWishonia", "getTask"],
  },
  {
    title: "Coordinate agents",
    body: "Claim work, leave task comments, heartbeat leases, and close the loop when work is done.",
    tools: ["acquireLease", "postTaskComment", "completeTaskClaim"],
  },
  {
    title: "Improve the queue",
    body: "Draft task bundles, add dependencies, and attach impact estimates for human review.",
    tools: ["proposeTaskBundle", "addDependency", "setTaskImpact"],
  },
] as const;

const primaryButtonClassName =
  "border border-foreground bg-foreground px-4 py-3 text-center text-sm font-black uppercase text-background hover:bg-background hover:text-foreground";
const secondaryButtonClassName =
  "border border-foreground bg-background px-4 py-3 text-center text-sm font-black uppercase text-foreground hover:bg-foreground hover:text-background";

function InlineCode({ children }: { children: string }) {
  return (
    <code className="border border-foreground bg-background px-1.5 py-0.5 font-mono text-[0.92em] font-black">
      {children}
    </code>
  );
}

function CodePanel({ code }: { code: string }) {
  return (
    <div className="mt-4 min-w-0 border border-foreground bg-background">
      <CopyableCode code={code} />
    </div>
  );
}

function InstallBlock({
  code,
  kicker,
  steps,
  summary,
  title,
}: InstallBlockProps) {
  return (
    <section className="min-w-0 border border-foreground bg-background p-5 sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
        {kicker}
      </p>
      <h2 className="mt-2 text-2xl font-black uppercase leading-tight">
        {title}
      </h2>
      <p className="mt-3 text-base font-bold leading-7 text-foreground">
        {summary}
      </p>
      {code ? <CodePanel code={code} /> : null}
      <ol className="mt-5 grid gap-3">
        {steps.map((step, index) => (
          <li
            className="grid grid-cols-[2.25rem_1fr] gap-3 border-t border-foreground/25 pt-3"
            key={step.title}
          >
            <span className="flex h-8 w-8 items-center justify-center border border-foreground text-sm font-black">
              {index + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black uppercase tracking-[0.08em]">
                {step.title}
              </span>
              <span className="mt-1 block whitespace-pre-line text-sm font-bold leading-6 text-muted-foreground">
                {step.body}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ToolGroupCard({
  body,
  title,
  tools,
}: {
  body: string;
  title: string;
  tools: readonly string[];
}) {
  return (
    <div className="border border-foreground bg-background p-4">
      <h3 className="text-sm font-black uppercase tracking-[0.1em]">{title}</h3>
      <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
        {body}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {tools.map((tool) => (
          <InlineCode key={tool}>{tool}</InlineCode>
        ))}
      </div>
    </div>
  );
}

export default function McpPage() {
  const claudeCodeCommand = `claude mcp add --transport http optimitron ${mcpUrl}`;
  const genericClientJson = JSON.stringify(
    {
      mcpServers: {
        optimitron: {
          url: mcpUrl,
        },
      },
    },
    null,
    2,
  );

  return (
    <Layout>
      <main className="bg-background text-foreground">
        <section className="border-b border-foreground">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              Optimitron MCP
            </p>
            <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <h1 className="max-w-3xl text-4xl font-black uppercase leading-none sm:text-6xl">
                  Give your AI the live task graph.
                </h1>
                <p className="mt-5 max-w-2xl text-lg font-bold leading-8 text-muted-foreground">
                  Connect Claude, ChatGPT, or another MCP client to Optimitron
                  so the agent can choose useful work, read the evidence,
                  coordinate through task comments, and stop hallucinating from
                  old chat history.
                </p>
              </div>
              <div className="min-w-0 border border-foreground bg-background p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                  MCP Server URL
                </p>
                <CodePanel code={mcpUrl} />
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a className={primaryButtonClassName} href="#install">
                Install MCP
              </a>
              <a className={secondaryButtonClassName} href="#tools">
                See Tools
              </a>
            </div>
          </div>
        </section>

        <section
          className="mx-auto grid max-w-5xl gap-5 px-4 py-10 sm:px-6 lg:px-8"
          id="install"
        >
          <InstallBlock
            kicker="Claude Code"
            title="One command, then /mcp."
            summary="Use this when the agent is working in a repo and needs the live queue, manual, task comments, and coordination tools."
            code={claudeCodeCommand}
            steps={[
              {
                title: "Run the command",
                body: "Paste it in the terminal where Claude Code is installed.",
              },
              {
                title: "Open /mcp",
                body: "Inside Claude Code, run /mcp and follow the browser sign-in flow.",
              },
              {
                title: "Authorize Optimitron",
                body: "Approve the requested scopes. The connector uses OAuth and PKCE; no client secret goes in your config.",
              },
            ]}
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <InstallBlock
              kicker="Claude"
              title="Add a custom connector."
              summary="Use this for Claude on the web, desktop, mobile, Cowork, Team, or Enterprise."
              code={mcpUrl}
              steps={[
                {
                  title: "Open connectors",
                  body: "Go to Customize > Connectors, then add a custom connector.",
                },
                {
                  title: "Paste the URL",
                  body: "Name it Optimitron and use the MCP Server URL above.",
                },
                {
                  title: "Connect",
                  body: "Sign in and authorize the connector. Claude should discover the OAuth endpoints automatically.",
                },
              ]}
            />

            <InstallBlock
              kicker="ChatGPT"
              title="Create a custom MCP app."
              summary="Use this when your ChatGPT plan and workspace settings allow custom MCP apps."
              code={mcpUrl}
              steps={[
                {
                  title: "Enable developer mode",
                  body: "Workspace admins enable Developer mode / Create custom MCP connectors under workspace permissions.",
                },
                {
                  title: "Add an MCP app",
                  body: "Open Apps & Connectors, create a custom connector/app, choose OAuth, and paste the MCP Server URL.",
                },
                {
                  title: "Authorize",
                  body: "Sign in to Optimitron. Use regular chat; agent mode does not reach custom MCP apps, and some deep research surfaces only show search/fetch tools.",
                },
              ]}
            />
          </div>

          <InstallBlock
            kicker="Other MCP Clients"
            title="Paste the JSON if your client wants config."
            summary="Cursor, Windsurf, Cline, Zed, and similar clients usually want a small MCP server block."
            code={genericClientJson}
            steps={[
              {
                title: "Find your MCP config",
                body: "Use your client's MCP settings or config file.",
              },
              {
                title: "Paste the block",
                body: "If your client asks for transport, choose Streamable HTTP or HTTP.",
              },
              {
                title: "Complete OAuth",
                body: "Open the authorization URL your client gives you and approve the scopes.",
              },
            ]}
          />
        </section>

        <section className="border-y border-foreground" id="tools">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              What agents get
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase">
              Less guessing. More useful work.
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {toolGroups.map((group) => (
                <ToolGroupCard key={group.title} {...group} />
              ))}
            </div>
            <Link
              className={`${secondaryButtonClassName} mt-6 inline-block`}
              href={ROUTES.developersTools}
            >
              Full Tool Reference
            </Link>
          </div>
        </section>

        <section className="mx-auto grid min-w-0 max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              Reference
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase">
              Endpoint and discovery.
            </h2>
            <div className="mt-5 space-y-4">
              <div className="min-w-0 border border-foreground p-4">
                <h3 className="text-sm font-black uppercase tracking-[0.1em]">
                  MCP Endpoint
                </h3>
                <CodePanel code={`POST ${mcpUrl}`} />
              </div>
              <div className="min-w-0 border border-foreground p-4">
                <h3 className="text-sm font-black uppercase tracking-[0.1em]">
                  Tool Catalog
                </h3>
                <CodePanel code={`GET ${toolsUrl}`} />
              </div>
              <div className="min-w-0 border border-foreground p-4">
                <h3 className="text-sm font-black uppercase tracking-[0.1em]">
                  OAuth Metadata
                </h3>
                <CodePanel code={`GET ${oauthMetadataUrl}`} />
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              Permissions
            </p>
            <h2 className="mt-2 text-3xl font-black uppercase">
              Scopes are the leash.
            </h2>
            <div className="mt-5 grid gap-3">
              {MCP_SCOPES.map((scope) => (
                <div
                  className="min-w-0 border border-foreground p-4"
                  key={scope.wire}
                >
                  <InlineCode>{scope.wire}</InlineCode>
                  <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
                    {scope.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-foreground">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="border border-foreground p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
              <div>
                <h2 className="text-2xl font-black uppercase">
                  Want the long version?
                </h2>
                <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
                  The repo doc explains the personal task engine,
                  expected-value fields, task triggers, and local stdio setup.
                </p>
              </div>
              <a
                className={`${secondaryButtonClassName} mt-4 inline-block sm:mt-0 sm:shrink-0`}
                href="https://github.com/mikepsinn/optimitron/blob/main/docs/MCP_SERVER.md"
              >
                Read Docs
              </a>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
