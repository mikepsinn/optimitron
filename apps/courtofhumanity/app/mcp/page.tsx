import type { Metadata } from "next";
import Link from "next/link";
import Layout from "@/components/layout";
import { COURT_MCP_ENDPOINT } from "@/lib/mcp/catalog";

export const metadata: Metadata = {
  title: "Connect an AI Agent | Court of Humanity",
  description:
    "Connect your AI agent to Court of Humanity to draft cases, organize public evidence, and open jury votes.",
  alternates: { canonical: "https://courtofhumanity.org/mcp" },
};

export default function CourtMcpPage() {
  return (
    <Layout>
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-4xl font-black uppercase">Connect an AI Agent</h1>
        <p className="mt-5 text-lg">
          Draft cases, organize public evidence, and open jury votes through the
          Court of Humanity MCP server.
        </p>
        <ol className="mt-8 list-decimal space-y-5 pl-6">
          <li>Add a remote MCP connection in your AI client.</li>
          <li>
            Enter this server URL:
            <code className="mt-3 block break-all border-2 border-foreground bg-muted p-4 text-sm">
              {COURT_MCP_ENDPOINT}
            </code>
          </li>
          <li>
            Complete sign-in on Optimitron and authorize Court access. You can
            use your existing account.
          </li>
        </ol>
        <p className="mt-8">
          Court tools have moved from Optimitron. Add this connection and
          authorize it even if your client already connects to Optimitron.
        </p>
        <h2 className="mt-10 text-2xl font-black">
          Your cases and permissions
        </h2>
        <p className="mt-4">
          You can create cases and edit your own. Other readers see only public
          records. Administrators can moderate public cases; that does not give
          them access to private cases or private plaintiff submissions.
        </p>
        <p className="mt-4">
          Evidence must be public and non-sensitive. Register and manage
          plaintiffs through the Court website.
        </p>
        <nav
          className="mt-8 flex flex-wrap gap-5 font-bold underline"
          aria-label="Court developer resources"
        >
          <Link href="/developers/tools">Tool reference</Link>
          <a href="/api/mcp/tools">JSON catalog</a>
          <Link href="/plaintiffs">Register a plaintiff</Link>
        </nav>
      </main>
    </Layout>
  );
}
