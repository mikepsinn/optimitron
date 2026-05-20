import * as React from "react";
import { Markdown } from "@react-email/components";
import {
  CampaignButton,
  CampaignEmailShell,
  CampaignEyebrow,
  CampaignHeading,
  CampaignShareFooter,
  CampaignText,
} from "@/lib/email/react-email-components";

type SanitizeHtmlOptions = {
  allowedAttributes: Record<string, string[]>;
  allowedSchemes: string[];
  allowedTags: string[];
};

type SanitizeHtml = (dirty: string, options: SanitizeHtmlOptions) => string;

const sanitizeHtml = require("sanitize-html") as SanitizeHtml;

const ink = "#000";
const softPaper = "#f8f8f8";

const taskDescriptionSanitizeOptions = {
  allowedAttributes: {
    a: ["href"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedTags: [
    "a",
    "p",
    "strong",
    "em",
    "code",
    "pre",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "br",
    "hr",
  ],
} satisfies SanitizeHtmlOptions;

const markdownCustomStyles = {
  p: {
    color: ink,
    fontSize: "16px",
    fontWeight: "700",
    lineHeight: "1.7",
    margin: "0 0 16px",
  },
  link: {
    color: ink,
    fontWeight: "700",
    textDecoration: "underline",
  },
  h1: {
    color: ink,
    fontSize: "20px",
    fontWeight: "900",
    lineHeight: "1.3",
    margin: "0 0 10px",
    paddingTop: "0",
  },
  h2: {
    color: ink,
    fontSize: "18px",
    fontWeight: "900",
    lineHeight: "1.35",
    margin: "0 0 10px",
    paddingTop: "0",
  },
  h3: {
    color: ink,
    fontSize: "16px",
    fontWeight: "900",
    lineHeight: "1.4",
    margin: "0 0 8px",
    paddingTop: "0",
  },
  ul: {
    margin: "0 0 16px",
    paddingLeft: "24px",
  },
  ol: {
    margin: "0 0 16px",
    paddingLeft: "24px",
  },
  li: {
    color: ink,
    fontSize: "16px",
    fontWeight: "700",
    lineHeight: "1.7",
    margin: "0 0 8px",
  },
  codeBlock: {
    backgroundColor: softPaper,
    border: `1px solid ${ink}`,
    color: ink,
    display: "block",
    fontFamily: "Menlo, Consolas, monospace",
    fontSize: "13px",
    fontWeight: "700",
    lineHeight: "1.6",
    margin: "0 0 16px",
    padding: "12px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    wordWrap: "break-word",
  },
  codeInline: {
    backgroundColor: softPaper,
    border: `1px solid ${ink}`,
    color: ink,
    display: "inline",
    fontFamily: "Menlo, Consolas, monospace",
    fontSize: "13px",
    fontWeight: "700",
    padding: "1px 4px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    wordWrap: "break-word",
  },
} satisfies React.ComponentProps<typeof Markdown>["markdownCustomStyles"];

const markdownContainerStyles = {
  margin: "0",
} satisfies React.ComponentProps<typeof Markdown>["markdownContainerStyles"];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlInMarkdownCodeFenceContent(description: string): string {
  const lines = description.match(/[^\r\n]*(?:\r\n|\n|\r|$)/g) ?? [];
  let insideFence = false;

  return lines
    .map((line) => {
      const lineWithoutBreak = line.replace(/(?:\r\n|\n|\r)$/, "");

      if (lineWithoutBreak.trimStart().startsWith("```")) {
        insideFence = !insideFence;
        return line;
      }

      return insideFence ? escapeHtml(line) : line;
    })
    .join("");
}

const markdownAutolinkPattern = /<((?:https?:\/\/|mailto:)[^\s<>"']+)>/gi;

function preserveMarkdownAutolinks(description: string): {
  autolinks: string[];
  markdown: string;
} {
  const autolinks: string[] = [];

  const markdown = description.replace(markdownAutolinkPattern, (match) => {
    const token = `__OPTIMITRON_MARKDOWN_AUTOLINK_${autolinks.length}__`;
    autolinks.push(match);
    return token;
  });

  return { autolinks, markdown };
}

export function sanitizeTaskDescriptionMarkdown(description: string): string {
  const codeFenceSafeDescription =
    escapeHtmlInMarkdownCodeFenceContent(description);
  const { autolinks, markdown } = preserveMarkdownAutolinks(
    codeFenceSafeDescription,
  );
  const sanitizedMarkdown = sanitizeHtml(markdown, taskDescriptionSanitizeOptions);

  return sanitizedMarkdown.replace(
    /__OPTIMITRON_MARKDOWN_AUTOLINK_(\d+)__/g,
    (_, autolinkIndex: string) => autolinks[Number(autolinkIndex)] ?? "",
  );
}

export function TaskAssignmentReactEmail({
  description,
  recipientName,
  replyInstruction,
  taskUrl,
  title,
  recipientReferralUrl,
}: {
  description: string;
  recipientName: string;
  replyInstruction?: string | null;
  taskUrl: string;
  title: string;
  recipientReferralUrl?: string | null;
}) {
  return (
    <CampaignEmailShell preview={`New task: ${title}`}>
      <CampaignEyebrow>New task for {recipientName}</CampaignEyebrow>
      <CampaignHeading>{title}</CampaignHeading>
      <div
        style={{
          borderBottom: `2px solid ${ink}`,
          borderTop: `2px solid ${ink}`,
          margin: "0 0 24px",
          padding: "20px 0",
        }}
      >
        <Markdown
          markdownCustomStyles={markdownCustomStyles}
          markdownContainerStyles={markdownContainerStyles}
        >
          {sanitizeTaskDescriptionMarkdown(description.trim())}
        </Markdown>
      </div>
      <CampaignButton href={taskUrl}>Open task</CampaignButton>
      {replyInstruction ? <CampaignText muted>{replyInstruction}</CampaignText> : null}
      {recipientReferralUrl ? (
        <CampaignShareFooter referralUrl={recipientReferralUrl} />
      ) : null}
    </CampaignEmailShell>
  );
}
