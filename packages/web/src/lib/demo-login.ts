interface DemoLoginEnvironment {
  demoLoginEnabled?: string | null;
  nodeEnv?: string | null;
  vercelEnv?: string | null;
}

export function isDemoLoginEnabled({
  demoLoginEnabled,
  nodeEnv,
  vercelEnv,
}: DemoLoginEnvironment): boolean {
  return (
    nodeEnv !== "production" ||
    vercelEnv === "preview" ||
    demoLoginEnabled === "true"
  );
}
