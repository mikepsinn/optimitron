export function expectedPreviewBranchName(previewGitBranch) {
  const branch = String(previewGitBranch || "").trim();
  if (!branch) throw new Error("PREVIEW_GIT_BRANCH is required.");
  return `preview/${branch}`;
}

export function selectExactPreviewBranch(candidates, previewGitBranch) {
  const expectedName = expectedPreviewBranchName(previewGitBranch);
  const exact = candidates.filter(
    ({ branch }) => String(branch?.name || "") === expectedName,
  );

  if (exact.length === 0) {
    throw new Error(`No Neon child branch is named exactly ${expectedName}.`);
  }
  if (exact.length > 1) {
    throw new Error(
      [
        `Neon branch discovery is ambiguous for ${expectedName}.`,
        "Set NEON_PROJECT_ID to the preview database project.",
        ...exact.map(
          ({ branch, project }) =>
            `- ${project.name || project.id}: ${branch.name || branch.id}`,
        ),
      ].join("\n"),
    );
  }

  const selected = exact[0];
  if (!String(selected.branch.parent_id || "").trim()) {
    throw new Error(
      `Refusing Neon root branch ${expectedName}; preview databases must be child branches.`,
    );
  }
  return selected;
}

export function assertDirectNeonConnectionUri(uri) {
  const parsed = new URL(uri);
  if (parsed.hostname.toLowerCase().includes("-pooler")) {
    throw new Error(
      "Neon returned a pooled connection URI where a direct migration URI was required.",
    );
  }
  return uri;
}
