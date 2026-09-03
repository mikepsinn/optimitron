import type { Metadata } from "next";
import Link from "next/link";
import Layout from "@/components/layout";
import {
  MCP_ADMIN_TOOL_COUNT,
  MCP_SCOPES,
  MCP_TOOLS,
  groupMcpToolsForDisplay,
  mcpParameterTypeLabel,
  type McpCatalogTool,
} from "@/lib/mcp-catalog";
import { optimitronUrl } from "@/lib/optimitron-links";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "MCP Tool Reference",
  description:
    "Every tool the Optimitron MCP server exposes, with its required OAuth scope, admin gate, and parameters.",
};

const toolsJsonUrl = optimitronUrl("/api/mcp/tools");

function requiredParams(tool: McpCatalogTool): Set<string> {
  return new Set(tool.inputSchema?.required ?? []);
}

function schemaProperties(tool: McpCatalogTool) {
  return Object.entries(tool.inputSchema?.properties ?? {});
}

export default function McpToolReferencePage() {
  const groups = groupMcpToolsForDisplay();

  return (
    <Layout>
      <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
            Developers
          </p>
          <h1 className="text-3xl font-black uppercase leading-tight sm:text-4xl">
            MCP Tool Reference
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground">
            Every tool the Optimitron MCP server exposes — {MCP_TOOLS.length}{" "}
            tools ({MCP_ADMIN_TOOL_COUNT} admin-gated) — generated from the same
            registry the live server enforces. The live machine-readable version
            is{" "}
            <a
              className="underline underline-offset-4"
              href={toolsJsonUrl}
            >
              optimitron.com/api/mcp/tools
            </a>
            ; connection instructions live at{" "}
            <Link className="underline underline-offset-4" href={ROUTES.mcp}>
              /mcp
            </Link>
            .
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Each tool is listed once, under its primary scope; many accept more
            than one scope, so the badges on a tool name every scope that can
            call it.
          </p>

          <section className="mt-8 border-2 border-foreground p-4">
            <h2 className="text-sm font-black uppercase tracking-[0.16em]">
              OAuth scopes
            </h2>
            <dl className="mt-3 space-y-2">
              {MCP_SCOPES.map((scope) => (
                <div className="text-sm leading-relaxed" key={scope.wire}>
                  <dt className="inline font-mono font-bold">{scope.wire}</dt>
                  <dd className="inline text-muted-foreground">
                    {" "}
                    — {scope.description}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {groups.map((group) => (
            <section className="mt-10" key={group.label}>
              <h2 className="border-b-2 border-foreground pb-2 text-xl font-black uppercase leading-tight">
                {group.label}{" "}
                <span className="text-sm font-bold text-muted-foreground">
                  ({group.tools.length})
                </span>
              </h2>
              <div className="mt-4 space-y-6">
                {group.tools.map((tool) => {
                  const required = requiredParams(tool);
                  const properties = schemaProperties(tool);
                  return (
                    <article
                      className="border border-foreground p-4"
                      id={tool.name}
                      key={tool.name}
                    >
                      {/* Tool names are single unbreakable identifiers, some
                          longer than a phone viewport, so they must be allowed
                          to break rather than widen the page. */}
                      <h3 className="break-words font-mono text-base font-black">
                        {tool.name}
                        {tool.adminOnly ? (
                          <span className="ml-2 border border-foreground px-1.5 py-0.5 text-[10px] font-black uppercase">
                            admin
                          </span>
                        ) : null}
                        {tool.requiredScopes.length > 0 ? (
                          <span className="ml-2 text-xs font-bold text-muted-foreground">
                            {tool.requiredScopes.join(" or ")}
                          </span>
                        ) : null}
                      </h3>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
                        {tool.description}
                      </p>
                      {properties.length > 0 ? (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.14em]">
                            Parameters ({properties.length})
                          </summary>
                          <ul className="mt-2 space-y-1.5">
                            {properties.map(([name, property]) => (
                              <li
                                className="break-words text-sm leading-snug"
                                key={name}
                              >
                                <span className="font-mono font-bold">
                                  {name}
                                </span>
                                <span className="text-muted-foreground">
                                  {" "}
                                  ({mcpParameterTypeLabel(property)}
                                  {required.has(name) ? ", required" : ""})
                                  {property.description
                                    ? ` — ${property.description}`
                                    : ""}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : (
                        <p className="mt-2 text-xs font-bold uppercase text-muted-foreground">
                          No parameters
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </Layout>
  );
}
