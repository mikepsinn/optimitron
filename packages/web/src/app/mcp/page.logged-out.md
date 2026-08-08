# /mcp

## Metadata

- Page title: MCP | International Campaign to End War and Disease
- Meta description: Connect Claude, ChatGPT, or another MCP client to the live Optimitron task graph so your agent can choose useful work, read the evidence, and leave an audit trail.
- Canonical: https://warondisease.org/mcp
- Open Graph title: MCP
- Open Graph description: Connect Claude, ChatGPT, or another MCP client to the live Optimitron task graph so your agent can choose useful work, read the evidence, and leave an audit trail.
- Open Graph image: https://warondisease.org/api/og/route?path=%2Fmcp
- Twitter title: MCP
- Twitter description: Connect Claude, ChatGPT, or another MCP client to the live Optimitron task graph so your agent can choose useful work, read the evidence, and leave an audit trail.

## Visible Page Copy

- OPTIMITRON MCP
## GIVE YOUR AI THE LIVE TASK GRAPH.
- Connect Claude, ChatGPT, or another MCP client to Optimitron so the agent can choose useful work, read the evidence, coordinate through task comments, and stop hallucinating from old chat history.
- MCP SERVER URL
- COPY
- ```text
http://localhost:3001/api/mcp
```
- [INSTALL MCP](#install)
- [SEE TOOLS](#tools)
- CLAUDE CODE
### ONE COMMAND, THEN /MCP.
- Use this when the agent is working in a repo and needs the live queue, manual, task comments, and coordination tools.
- ```text
claude mcp add --transport http optimitron http://localhost:3001/api/mcp
```
- 1 RUN THE COMMAND Paste it in the terminal where Claude Code is installed.
- 2 OPEN /MCP Inside Claude Code, run /mcp and follow the browser sign-in flow.
- 3 AUTHORIZE OPTIMITRON Approve the requested scopes. The connector uses OAuth and PKCE; no client secret goes in your config.
- CLAUDE
### ADD A CUSTOM CONNECTOR.
- Use this for Claude on the web, desktop, mobile, Cowork, Team, or Enterprise.
- 1 OPEN CONNECTORS Go to Customize > Connectors, then add a custom connector.
- 2 PASTE THE URL Name it Optimitron and use the MCP Server URL above.
- 3 CONNECT Sign in and authorize the connector. Claude should discover the OAuth endpoints automatically.
- CHATGPT
### CREATE A CUSTOM MCP APP.
- Use this when your ChatGPT plan and workspace settings allow custom MCP apps.
- 1 ENABLE DEVELOPER MODE Workspace admins enable Developer mode / Create custom MCP connectors under workspace permissions.
- 2 ADD AN MCP APP Open Apps & Connectors, create a custom connector/app, choose OAuth, and paste the MCP Server URL.
- 3 AUTHORIZE Sign in to Optimitron. Use regular chat or agent mode; some deep research surfaces only show search/fetch tools.
- OTHER MCP CLIENTS
### PASTE THE JSON IF YOUR CLIENT WANTS CONFIG.
- Cursor, Windsurf, Cline, Zed, and similar clients usually want a small MCP server block.
- ```text
{
  "mcpServers": {
    "optimitron": {
      "url": "http://localhost:3001/api/mcp"
    }
  }
}
```
- 1 FIND YOUR MCP CONFIG Use your client's MCP settings or config file.
- 2 PASTE THE BLOCK If your client asks for transport, choose Streamable HTTP or HTTP.
- 3 COMPLETE OAUTH Open the authorization URL your client gives you and approve the scopes.
- WHAT AGENTS GET
### LESS GUESSING. MORE USEFUL WORK.
#### PICK WORK
- Audit the queue, compare expected value, and ask for the next useful action.
#### READ THE EVIDENCE
- Search the manual, inspect task details, and fetch page text before proposing changes.
#### COORDINATE AGENTS
- Claim work, leave task comments, heartbeat leases, and close the loop when work is done.
#### IMPROVE THE QUEUE
- Draft task bundles, add dependencies, and attach impact estimates for human review.
- REFERENCE
### ENDPOINT AND DISCOVERY.
#### MCP ENDPOINT
- ```text
POST http://localhost:3001/api/mcp
```
#### TOOL CATALOG
- ```text
GET http://localhost:3001/api/mcp/tools
```
#### OAUTH METADATA
- ```text
GET http://localhost:3001/.well-known/oauth-authorization-server
```
- PERMISSIONS
### SCOPES ARE THE LEASH.
- Manage your private tasks, dependencies, comments, queues, and next-action recommendations
- Manage private tasks for organizations where you have permission
- Approve exact outbound-action payloads as an authenticated human
- Admin-only: create and manage public Optimitron tasks, people, organizations, estimates, and dependencies
- Create sourced public Earth-data records: memorials, evidence, intervention reports, organization signatories, and correction reports
- Admin-only: hide, restore, merge, and resolve Earth-data records and reports
- Admin-only: run coordinated public-task agents with leases and run logs
- Admin-only: access the configured GitHub repos via the server-side PAT (search code, read files, list directories, generic API passthrough)
### WANT THE LONG VERSION?
- The repo doc explains the personal task engine, expected-value fields, task triggers, and local stdio setup.
- [READ DOCS](https://github.com/mikepsinn/optimitron/blob/main/docs/MCP_SERVER.md)
