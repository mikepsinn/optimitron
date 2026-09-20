import path from "node:path";

/** Keep apps with the same pathname in separate copy namespaces. */
export function getVisualCopySnapshot({ routePath, appName = "optimitron", authenticated = false }) {
  if (!routePath) return null;
  const fileName = authenticated ? "page.logged-in.md" : "page.logged-out.md";
  const pathname = routePath.split(/[?#]/, 1)[0];
  const segments = pathname.split("/").filter(Boolean);
  const appRoot = appName === "optimitron"
    ? ["apps", appName, "src", "app"]
    : ["apps", appName, "app"];
  return {
    fileName,
    repoRelativePath: path.posix.join(...appRoot, ...segments, fileName),
    artifactRelativePath: path.posix.join(
      ...(appName === "optimitron" ? [] : ["site-apps", appName]),
      ...segments, fileName,
    ),
  };
}
