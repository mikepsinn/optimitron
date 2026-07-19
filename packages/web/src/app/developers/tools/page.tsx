import Link from "next/link";
import { getToolCatalog } from "@/lib/mcp-server";
import {
  ALL_SCOPES,
  MCP_SCOPE_DESCRIPTIONS,
  scopeToWire,
  type McpScope,
} from "@/lib/mcp-scopes";
import { ROUTES } from "@/lib/routes";

export const metadata = {
  title: "MCP Tool Reference | Optimitron Developers",
  description:
    "Every tool the Optimitron MCP server exposes — parameters, required scopes, and admin gating — generated from the live registry.",
};

type CatalogTool = ReturnType<typeof getToolCatalog>[number];

type SchemaProperty = {
  type?: string | string[];
  description?: string;
  enum?: unknown[];
};

function toolGroupLabel(tool: CatalogTool): string {
  if (tool.adminOnly) return "Admin-only";
  if (!tool.scopes || tool.scopes.length === 0) return "Public (no scope)";
  return scopeToWire(tool.scopes[0]);
}

function requiredParams(tool: CatalogTool): Set<string> {
  const schema = tool.inputSchema as { required?: string[] } | undefined;
  return new Set(schema?.required ?? []);
}

function schemaProperties(
  tool: CatalogTool,
): Array<[string, SchemaProperty]> {
  const schema = tool.inputSchema as
    | { properties?: Record<string, SchemaProperty> }
    | undefined;
  return Object.entries(schema?.properties ?? {});
}

function typeLabel(property: SchemaProperty): string {
  if (property.enum) return "enum";
  if (Array.isArray(property.type)) return property.type.join(" | ");
  return property.type ?? "any";
}

export default function McpToolReferencePage() {
  const catalog = getToolCatalog();
  const groups = new Map<string, CatalogTool[]>();
  for (const tool of catalog) {
    const label = toolGroupLabel(tool);
    groups.set(label, [...(groups.get(label) ?? []), tool]);
  }
  const orderedLabels = [
    "Public (no scope)",
    ...ALL_SCOPES.map((scope: McpScope) => scopeToWire(scope)),
    "Admin-only",
  ].filter((label) => groups.has(label));
  const adminCount = catalog.filter((tool) => tool.adminOnly).length;

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
          Developers
        </p>
        <h1 className="text-3xl font-black uppercase leading-tight sm:text-4xl">
          MCP Tool Reference
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground">
          Every tool the Optimitron MCP server exposes — {catalog.length} tools
          ({adminCount} admin-gated) — generated from the same registry the
          live server enforces, so this page cannot drift from reality. The
          machine-readable version is{" "}
          <Link className="underline underline-offset-4" href="/api/mcp/tools">
            /api/mcp/tools
          </Link>
          ; connection instructions live at{" "}
          <Link className="underline underline-offset-4" href={ROUTES.mcp}>
            /mcp
          </Link>
          .
        </p>

        <section className="mt-8 border-2 border-foreground p-4">
          <h2 className="text-sm font-black uppercase tracking-[0.16em]">
            OAuth scopes
          </h2>
          <dl className="mt-3 space-y-2">
            {ALL_SCOPES.map((scope: McpScope) => (
              <div key={scope} className="text-sm leading-relaxed">
                <dt className="inline font-mono font-bold">
                  {scopeToWire(scope)}
                </dt>
                <dd className="inline text-muted-foreground">
                  {" "}
                  — {MCP_SCOPE_DESCRIPTIONS[scope]}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {orderedLabels.map((label) => (
          <section key={label} className="mt-10">
            <h2 className="border-b-2 border-foreground pb-2 text-xl font-black uppercase leading-tight">
              {label}{" "}
              <span className="text-sm font-bold text-muted-foreground">
                ({groups.get(label)!.length})
              </span>
            </h2>
            <div className="mt-4 space-y-6">
              {groups.get(label)!.map((tool) => {
                const required = requiredParams(tool);
                const properties = schemaProperties(tool);
                return (
                  <article
                    key={tool.name}
                    className="border border-foreground p-4"
                    id={tool.name}
                  >
                    <h3 className="font-mono text-base font-black">
                      {tool.name}
                      {tool.adminOnly ? (
                        <span className="ml-2 border border-foreground px-1.5 py-0.5 text-[10px] font-black uppercase">
                          admin
                        </span>
                      ) : null}
                      {tool.scopes && tool.scopes.length > 0 ? (
                        <span className="ml-2 text-xs font-bold text-muted-foreground">
                          {tool.scopes
                            .map((scope) => scopeToWire(scope))
                            .join(" or ")}
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
                            <li key={name} className="text-sm leading-snug">
                              <span className="font-mono font-bold">
                                {name}
                              </span>
                              <span className="text-muted-foreground">
                                {" "}
                                ({typeLabel(property)}
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
  );
}
