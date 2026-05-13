import React from "react";

export type RenderSurface = "web" | "email";

const ADAPTIVE_SURFACE_PROP = "__adaptiveSurface";

type AdaptiveRenderer<Props extends object> = React.ComponentType<Props>;

export interface AdaptiveRenderers<Props extends object> {
  web: AdaptiveRenderer<Props>;
  email?: AdaptiveRenderer<Props>;
}

let renderSurface: RenderSurface = "web";

export function RenderSurfaceProvider({
  children,
  surface,
}: {
  children: React.ReactNode;
  surface: RenderSurface;
}) {
  return <RenderSurfaceScope surface={surface}>{children}</RenderSurfaceScope>;
}

export function EmailRenderSurface({ children }: { children: React.ReactNode }) {
  return (
    <RenderSurfaceProvider surface="email">{children}</RenderSurfaceProvider>
  );
}

export function useRenderSurface() {
  return renderSurface;
}

export async function withRenderSurface<T>(
  surface: RenderSurface,
  render: () => Promise<T>,
) {
  const previous = renderSurface;
  renderSurface = surface;
  try {
    return await render();
  } finally {
    renderSurface = previous;
  }
}

function RenderSurfaceScope({
  children,
  surface,
}: {
  children: React.ReactNode;
  surface: RenderSurface;
}) {
  return <>{markAdaptiveChildren(children, surface)}</>;
}

function markAdaptiveChildren(
  children: React.ReactNode,
  surface: RenderSurface,
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;

    const childProps = child.props as { children?: React.ReactNode };
    const props: Record<string, unknown> = {};

    if (isAdaptiveComponent(child.type)) {
      props[ADAPTIVE_SURFACE_PROP] = surface;
    }

    if ("children" in childProps) {
      props.children = markAdaptiveChildren(childProps.children, surface);
    }

    return Object.keys(props).length > 0
      ? React.cloneElement(child, props)
      : child;
  });
}

function isAdaptiveComponent(type: unknown) {
  return Boolean(
    typeof type === "function" &&
      (type as { isAdaptiveComponent?: boolean }).isAdaptiveComponent,
  );
}

export function createAdaptiveComponent<Props extends object>(
  displayName: string,
  renderers: AdaptiveRenderers<Props>,
) {
  function AdaptiveComponent(
    props: Props & { [ADAPTIVE_SURFACE_PROP]?: RenderSurface },
  ) {
    const { [ADAPTIVE_SURFACE_PROP]: explicitSurface, ...rest } = props;
    const surface = explicitSurface ?? useRenderSurface();
    const Renderer = renderers[surface];

    if (!Renderer) {
      throw new Error(`${displayName} does not implement an ${surface} renderer`);
    }

    return React.createElement(Renderer, rest as Props);
  }

  AdaptiveComponent.displayName = displayName;
  AdaptiveComponent.isAdaptiveComponent = true;
  return AdaptiveComponent;
}
