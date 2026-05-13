import { render } from "@react-email/components";
import React from "react";
import { EmailRenderSurface, withRenderSurface } from "@/components/adaptive";
import type { ReactElement } from "react";
import type { EmailBody } from "@/lib/email/preview-envelope";

function wrapEmailSurface(react: ReactElement) {
  return React.createElement(EmailRenderSurface, null, react);
}

export async function renderReactEmailHtml(
  react: ReactElement,
): Promise<string> {
  return withRenderSurface("email", () => render(wrapEmailSurface(react)));
}

export async function renderReactEmailText(
  react: ReactElement,
): Promise<string> {
  return withRenderSurface("email", () =>
    render(wrapEmailSurface(react), { plainText: true }),
  );
}

export async function renderReactEmail(react: ReactElement): Promise<EmailBody> {
  const wrapped = wrapEmailSurface(react);
  const html = await withRenderSurface("email", () => render(wrapped));
  const text = await withRenderSurface("email", () =>
    render(wrapped, { plainText: true }),
  );
  return { html, text };
}

export async function renderReactEmailBody(
  react: ReactElement,
): Promise<EmailBody> {
  return renderReactEmail(react);
}
