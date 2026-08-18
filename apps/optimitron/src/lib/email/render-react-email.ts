import { render } from "@react-email/components";
import type { ReactElement } from "react";
import type { EmailBody } from "@/lib/email/preview-envelope";

export async function renderReactEmailHtml(
  react: ReactElement,
): Promise<string> {
  return render(react);
}

export async function renderReactEmailText(
  react: ReactElement,
): Promise<string> {
  return render(react, { plainText: true });
}

export async function renderReactEmail(react: ReactElement): Promise<EmailBody> {
  const html = await render(react);
  const text = await render(react, { plainText: true });
  return { html, text };
}

export async function renderReactEmailBody(
  react: ReactElement,
): Promise<EmailBody> {
  return renderReactEmail(react);
}
