-- Add GITHUB scope to McpScope enum.
-- This scope gates the four GitHub-API tools on the MCP server (searchRepo,
-- getFileContent, listRepoFiles, githubApi) — all admin-only — separating
-- GitHub access from generic task admin (TASKS_ADMIN). The wire format stays
-- short ("github") for OAuth URL/JWT compactness.

ALTER TYPE "McpScope" ADD VALUE 'github';
