import { render } from "@react-email/components";
import type { ReactElement } from "react";
import type { EmailBody } from "@/lib/email/preview-envelope";

export async function renderReactEmailBody(
  react: ReactElement,
): Promise<EmailBody> {
  const [html, text] = await Promise.all([
    render(react),
    render(react, { plainText: true }),
  ]);
  return { html, text };
}
