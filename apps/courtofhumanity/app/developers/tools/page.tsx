import type { Metadata } from "next";
import Link from "next/link";
import Layout from "@/components/layout";
import { getCourtToolCatalog } from "@/lib/mcp/catalog";

export const metadata: Metadata = {
  title: "MCP Tool Reference | Court of Humanity",
  description: "Court of Humanity MCP tools, parameters, and access rules.",
  alternates: { canonical: "https://courtofhumanity.org/developers/tools" },
};

export default function CourtToolReferencePage() {
  const catalog = getCourtToolCatalog();
  return (
    <Layout>
      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <h1 className="text-4xl font-black uppercase">
          Court MCP Tool Reference
        </h1>
        <p className="mt-5">
          These eight tools run on Court of Humanity. Each requires an
          authenticated connection with <code>earthdata:write</code>. Case
          ownership and record privacy apply to every call.
        </p>
        <p className="mt-4">
          To moderate someone else’s public case, an administrator also needs{" "}
          <code>earthdata:admin</code>. Private records remain restricted to
          their owner.
        </p>
        <p className="mt-5">
          <Link className="font-bold underline" href="/mcp">
            Connection instructions
          </Link>
          {" · "}
          <a className="font-bold underline" href="/api/mcp/tools">
            JSON catalog
          </a>
        </p>
        <div className="mt-9 space-y-7">
          {catalog.tools.map((tool) => {
            const required = new Set<string>(
              "required" in tool.inputSchema ? tool.inputSchema.required : [],
            );
            return (
              <section
                key={tool.name}
                id={tool.name}
                className="border-2 border-foreground p-5 sm:p-7"
              >
                <h2 className="break-all text-xl font-black">
                  <code>{tool.name}</code>
                </h2>
                <p className="mt-3">{tool.description}</p>
                <dl className="mt-5 space-y-3">
                  {Object.entries(tool.inputSchema.properties).map(
                    ([name, schema]) => (
                      <div key={name}>
                        <dt className="break-all font-bold">
                          <code>{name}</code>
                          {required.has(name) ? " (required)" : ""}
                        </dt>
                        <dd className="text-sm text-muted-foreground">
                          {schema.type}
                          {"enum" in schema
                            ? `: ${schema.enum.join(", ")}`
                            : ""}
                          {"description" in schema
                            ? ` — ${schema.description}`
                            : ""}
                        </dd>
                      </div>
                    ),
                  )}
                </dl>
              </section>
            );
          })}
        </div>
      </main>
    </Layout>
  );
}
