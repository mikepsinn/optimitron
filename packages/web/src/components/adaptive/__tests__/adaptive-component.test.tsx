import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  EmailRenderSurface,
  createAdaptiveComponent,
  withRenderSurface,
} from "@/components/adaptive";

describe("adaptive components", () => {
  it("renders the web renderer by default", () => {
    const Example = createAdaptiveComponent<{ label: string }>("Example", {
      web: ({ label }) => <span data-surface="web">{label}</span>,
      email: ({ label }) => <a href="https://example.com">{label}</a>,
    });

    const html = renderToStaticMarkup(<Example label="Hello" />);

    expect(html).toContain('data-surface="web"');
    expect(html).not.toContain("https://example.com");
  });

  it("renders the email renderer inside the email surface", () => {
    const Example = createAdaptiveComponent<{ label: string }>("Example", {
      web: ({ label }) => <span data-surface="web">{label}</span>,
      email: ({ label }) => <a href="https://example.com">{label}</a>,
    });

    const html = renderToStaticMarkup(
      <EmailRenderSurface>
        <Example label="Hello" />
      </EmailRenderSurface>,
    );

    expect(html).toContain('href="https://example.com"');
    expect(html).not.toContain('data-surface="web"');
  });

  it("throws instead of silently rendering a web-only component in email", () => {
    const Example = createAdaptiveComponent<{ label: string }>("Example", {
      web: ({ label }) => <span>{label}</span>,
    });

    expect(() =>
      renderToStaticMarkup(
        <EmailRenderSurface>
          <Example label="Hello" />
        </EmailRenderSurface>,
      ),
    ).toThrow("Example does not implement an email renderer");
  });

  it("applies the render surface to adaptive components created inside nested components", async () => {
    const Example = createAdaptiveComponent<{ label: string }>("Example", {
      web: ({ label }) => <span data-surface="web">{label}</span>,
      email: ({ label }) => <a href="https://example.com">{label}</a>,
    });
    function Wrapper() {
      return (
        <div>
          <Example label="Hello" />
        </div>
      );
    }

    const html = await withRenderSurface("email", async () =>
      renderToStaticMarkup(<Wrapper />),
    );

    expect(html).toContain('href="https://example.com"');
    expect(html).not.toContain('data-surface="web"');
  });

  it("throws for a nested web-only component during email rendering", async () => {
    const Example = createAdaptiveComponent<{ label: string }>("Example", {
      web: ({ label }) => <span>{label}</span>,
    });
    function Wrapper() {
      return <Example label="Hello" />;
    }

    await expect(
      withRenderSurface("email", async () => renderToStaticMarkup(<Wrapper />)),
    ).rejects.toThrow("Example does not implement an email renderer");
  });
});
