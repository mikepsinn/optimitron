import Link from "next/link";
import { CopyableCode } from "@/components/ui/copyable-code";
import {
  defaultButtonClassName,
  primaryButtonClassName,
} from "@/components/ui/default-button";
import { getRouteMetadata } from "@/lib/metadata";
import {
  ALL_SCOPES,
  MCP_SCOPE_DESCRIPTIONS,
  scopeToWire,
} from "@/lib/mcp-scopes";
import { developersLink, mcpLink } from "@/lib/routes";
import { getConfiguredSiteOrigin } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata = getRouteMetadata(developersLink);

const apiGroups = [
  {
    title: "Tasks",
    body: "Create task assignments, list open work, claim work, complete claims, and keep comments with the task instead of in a lost chat thread.",
    endpoints: [
      "GET /api/tasks",
      "POST /api/tasks",
      "PATCH /api/tasks/{id}",
      "POST /api/tasks/{id}/complete",
    ],
  },
  {
    title: "Referrals",
    body: "Create referral invitations, attach them to tasks, and track whether a human copied, sent, declined, or finished the ask.",
    endpoints: ["GET /api/referral-invitations", "POST /api/referral-invitations"],
  },
  {
    title: "Votes",
    body: "Let another site collect a referendum, survey, or treaty vote while writing the result into the same verified record Optimitron uses.",
    endpoints: ["POST /api/referendums/{slug}/vote"],
  },
  {
    title: "People and organizations",
    body: "Search assignable people, create organizations, and update profiles so one contact or institution does not get rediscovered from scratch every Tuesday.",
    endpoints: [
      "GET /api/people/search",
      "GET /api/organizations",
      "POST /api/organizations",
      "PATCH /api/organizations/{id}",
    ],
  },
] as const;

const useCases = [
  {
    title: "Survey sites",
    body: "Run a calmer survey or pledge page, then send the verified vote, referral, and follow-up task back to Optimitron.",
  },
  {
    title: "Disease communities",
    body: "Let a dFDA site collect patient priorities, treatment reports, or organization support without creating another isolated people database.",
  },
  {
    title: "Research funders",
    body: "Publish bounties, assignments, or requests for evidence, then rank the next action by expected value instead of whoever shouted last.",
  },
  {
    title: "Civic and nonprofit tools",
    body: "Coordinate outreach, volunteers, expert review, and institutional commitments against the same shared task and organization record.",
  },
] as const;

const oauthSteps = [
  {
    title: "Register a public client",
    body: "Send redirect URIs to dynamic client registration. Optimitron returns a client_id; public clients do not get a secret.",
  },
  {
    title: "Start authorization",
    body: "Redirect the user to the authorization endpoint with PKCE, state, redirect_uri, and the scopes your app needs.",
  },
  {
    title: "Exchange and refresh",
    body: "Trade the authorization code for a Bearer token. Refresh tokens rotate, and revoke is available when the app disconnects.",
  },
] as const;

function InlineCode({ children }: { children: string }) {
  return (
    <code className="border border-foreground bg-background px-1.5 py-0.5 [font-family:var(--font-geist-mono,ui-monospace,SFMono-Regular,Menlo,monospace)] text-[0.92em] font-black">
      {children}
    </code>
  );
}

function CodePanel({ code }: { code: string }) {
  return (
    <div className="mt-3 min-w-0 border border-foreground bg-background">
      <CopyableCode code={code} />
    </div>
  );
}

function EndpointList({ endpoints }: { endpoints: readonly string[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {endpoints.map((endpoint) => (
        <InlineCode key={endpoint}>{endpoint}</InlineCode>
      ))}
    </div>
  );
}

function ApiGroupCard({
  body,
  endpoints,
  title,
}: {
  body: string;
  endpoints: readonly string[];
  title: string;
}) {
  return (
    <div className="min-w-0 border border-foreground bg-background p-4">
      <h3 className="text-sm font-black uppercase tracking-[0.1em]">{title}</h3>
      <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
        {body}
      </p>
      <EndpointList endpoints={endpoints} />
    </div>
  );
}

function EndpointBlock({
  code,
  summary,
  title,
}: {
  code: string;
  summary: string;
  title: string;
}) {
  return (
    <div className="min-w-0 border border-foreground bg-background p-4">
      <h3 className="text-sm font-black uppercase tracking-[0.1em]">{title}</h3>
      <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
        {summary}
      </p>
      <CodePanel code={code} />
    </div>
  );
}

export default function DevelopersPage() {
  const baseUrl = getConfiguredSiteOrigin();
  const openApiUrl = `${baseUrl}/openapi.json`;
  const oauthMetadataUrl = `${baseUrl}/.well-known/oauth-authorization-server`;
  const registrationUrl = `${baseUrl}/api/mcp/oauth/register`;
  const authorizeUrl = `${baseUrl}/api/mcp/oauth/authorize`;
  const tokenUrl = `${baseUrl}/api/mcp/oauth/token`;
  const revokeUrl = `${baseUrl}/api/mcp/oauth/revoke`;
  const toolsUrl = `${baseUrl}/api/mcp/tools`;
  const mcpUrl = `${baseUrl}/api/mcp`;
  const createTaskExample = JSON.stringify(
    {
      title: "Ask Dr. Example to vote on the 1% Treaty",
      description: "Send the treaty vote link and answer any obvious question.",
      isPublic: false,
      assigneePersonInvite: {
        email: "doctor@example.org",
        firstName: "Ada",
        lastName: "Example",
      },
      contactTemplate:
        "Please vote on the 1% Treaty and send it to two people who can help.",
    },
    null,
    2,
  );
  const registerClientExample = JSON.stringify(
    {
      client_name: "Treaty Field App",
      redirect_uris: ["https://field-app.example/oauth/callback"],
      grant_types: ["authorization_code", "refresh_token"],
      scope: "tasks:personal earthdata:write",
    },
    null,
    2,
  );

  return (
    <main className="bg-background text-foreground">
      <section className="border-b border-foreground">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            Earth Optimization API
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-black uppercase leading-none tracking-normal sm:text-6xl">
                Optimize Earth from your own app or website.
              </h1>
              <p className="mt-5 max-w-2xl text-lg font-bold leading-8 text-muted-foreground">
                Connect your survey, dFDA site, field tool, or civic app to
                Optimitron's shared work graph: OAuth, people, organizations,
                tasks, referrals, votes, and expected-value coordination.
              </p>
            </div>
            <div className="min-w-0 border border-foreground bg-background p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
                OpenAPI Contract
              </p>
              <CodePanel code={openApiUrl} />
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className={primaryButtonClassName} href="/openapi.json">
              Open OpenAPI
            </Link>
            <Link className={defaultButtonClassName} href={mcpLink.href}>
              Install MCP
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-foreground">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            Who Uses It
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-normal">
            One to-do list beats five hundred heroic duplicates.
          </h2>
          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-muted-foreground">
            Optimitron is useful when an app needs shared identity, people,
            organizations, tasks, and outcome tracking. The task engine ranks
            work by dollar-equivalent expected value, effort, cash cost,
            probability, dependencies, and health or income impact.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {useCases.map((useCase) => (
              <div
                className="min-w-0 border border-foreground bg-background p-4"
                key={useCase.title}
              >
                <h3 className="text-sm font-black uppercase tracking-[0.1em]">
                  {useCase.title}
                </h3>
                <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
                  {useCase.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            OAuth
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-normal">
            Sign in once. Write to the same work graph.
          </h2>
          <p className="mt-4 text-base font-bold leading-7 text-muted-foreground">
            Optimitron exposes OAuth authorization code with PKCE, dynamic
            client registration, rotating refresh tokens, and token revocation.
            The same scopes work for REST endpoints and the MCP server.
          </p>
          <ol className="mt-6 grid gap-3">
            {oauthSteps.map((step, index) => (
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
                  <span className="mt-1 block text-sm font-bold leading-6 text-muted-foreground">
                    {step.body}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid min-w-0 gap-4">
          <EndpointBlock
            title="Metadata"
            summary="Let OAuth clients discover the authorization, token, registration, and revocation endpoints."
            code={`GET ${oauthMetadataUrl}`}
          />
          <EndpointBlock
            title="Register"
            summary="Create a public client for browser, mobile, and field apps."
            code={`POST ${registrationUrl}\n\n${registerClientExample}`}
          />
          <EndpointBlock
            title="Authorize and token"
            summary="Use PKCE for the browser redirect, then exchange the code on your server or trusted runtime."
            code={`GET ${authorizeUrl}\nPOST ${tokenUrl}\nPOST ${revokeUrl}`}
          />
        </div>
      </section>

      <section className="border-y border-foreground" id="api">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            REST API
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-normal">
            The useful parts are open first.
          </h2>
          <p className="mt-4 max-w-3xl text-base font-bold leading-7 text-muted-foreground">
            This is the external surface for embedding a survey, creating tasks
            for people, collecting votes, and keeping organization data attached
            to the same shared record.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {apiGroups.map((group) => (
              <ApiGroupCard key={group.title} {...group} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            Example
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-normal">
            Create a task for a human.
          </h2>
          <p className="mt-4 text-base font-bold leading-7 text-muted-foreground">
            A survey or outreach app can ask for a person, create the task, and
            then show whether that person answered, voted, completed the work,
            or needs another nudge.
          </p>
          <CodePanel code={`POST ${baseUrl}/api/tasks\n\n${createTaskExample}`} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            Permissions
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-normal">
            Ask for the smallest scope that works.
          </h2>
          <div className="mt-5 grid gap-3">
            {ALL_SCOPES.map((scope) => (
              <div className="min-w-0 border border-foreground p-4" key={scope}>
                <InlineCode>{scopeToWire(scope)}</InlineCode>
                <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
                  {MCP_SCOPE_DESCRIPTIONS[scope]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-foreground">
        <div className="mx-auto grid max-w-5xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="min-w-0 border border-foreground p-5">
            <h2 className="text-2xl font-black uppercase tracking-normal">
              Agents use the same authorization.
            </h2>
            <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
              MCP clients can discover tools, add impact estimates, and call
              the task graph with the same OAuth scopes used by REST clients.
            </p>
            <CodePanel code={`GET ${toolsUrl}\nPOST ${mcpUrl}`} />
            <Link
              className={cn(defaultButtonClassName, "mt-4")}
              href={mcpLink.href}
            >
              MCP Setup
            </Link>
          </div>
          <div className="min-w-0 border border-foreground p-5">
            <h2 className="text-2xl font-black uppercase tracking-normal">
              Machines can read the contract.
            </h2>
            <p className="mt-2 text-sm font-bold leading-6 text-muted-foreground">
              Point API clients, SDK generators, or documentation tooling at
              the OpenAPI document and stop guessing from source files.
            </p>
            <CodePanel code={`GET ${openApiUrl}`} />
            <Link
              className={cn(primaryButtonClassName, "mt-4")}
              href="/openapi.json"
            >
              Open JSON
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
