# /developers

## Metadata

- Page title: Developers | International Campaign to End War and Disease
- Meta description: Optimize Earth from your own app or website with the Earth Optimization API: OAuth, shared people, organizations, tasks, referrals, and votes.
- Canonical: https://warondisease.org/developers
- Open Graph title: Developers
- Open Graph description: Optimize Earth from your own app or website with the Earth Optimization API: OAuth, shared people, organizations, tasks, referrals, and votes.
- Open Graph image: https://warondisease.org/api/og/route?path=%2Fdevelopers
- Twitter title: Developers
- Twitter description: Optimize Earth from your own app or website with the Earth Optimization API: OAuth, shared people, organizations, tasks, referrals, and votes.

## Visible Page Copy

- EARTH OPTIMIZATION API
## OPTIMIZE EARTH FROM YOUR OWN APP OR WEBSITE.
- Connect your survey, dFDA site, field tool, or civic app to Optimitron's shared work graph: OAuth, people, organizations, tasks, referrals, votes, and expected-value coordination.
- OPENAPI CONTRACT
- COPY
- ```text
/openapi.json
```
- [OPEN OPENAPI](/openapi.json)
- [MCP TOOL REFERENCE](/developers/tools)
- [INSTALL MCP](/mcp)
- WHO USES IT
### ONE TO-DO LIST BEATS FIVE HUNDRED HEROIC DUPLICATES.
- Optimitron is useful when an app needs shared identity, people, organizations, tasks, and outcome tracking. The task engine ranks work by dollar-equivalent expected value, effort, cash cost, probability, dependencies, and health or income impact.
#### SURVEY SITES
- Run a calmer survey or pledge page, then send the verified vote, referral, and follow-up task back to Optimitron.
#### DISEASE COMMUNITIES
- Let a dFDA site collect patient priorities, treatment reports, or organization support without creating another isolated people database.
#### RESEARCH FUNDERS
- Publish bounties, assignments, or requests for evidence, then rank the next action by expected value instead of whoever shouted last.
#### CIVIC AND NONPROFIT TOOLS
- Coordinate outreach, volunteers, expert review, and institutional commitments against the same shared task and organization record.
- OAUTH
### SIGN IN ONCE. WRITE TO THE SAME WORK GRAPH.
- Optimitron exposes OAuth authorization code with PKCE, dynamic client registration, rotating refresh tokens, and token revocation. The same scopes work for REST endpoints and the MCP server.
- 1 REGISTER A PUBLIC CLIENT Send redirect URIs to dynamic client registration. Optimitron returns a client_id; public clients do not get a secret.
- 2 START AUTHORIZATION Redirect the user to the authorization endpoint with PKCE, state, redirect_uri, and the scopes your app needs.
- 3 EXCHANGE AND REFRESH Trade the authorization code for a Bearer token. Refresh tokens rotate, and revoke is available when the app disconnects.
#### METADATA
- Let OAuth clients discover the authorization, token, registration, and revocation endpoints.
- ```text
GET /.well-known/oauth-authorization-server
```
#### REGISTER
- Create a public client for browser, mobile, and field apps.
- ```text
POST /api/mcp/oauth/register

{
  "client_name": "Treaty Field App",
  "redirect_uris": [
    "https://field-app.example/oauth/callback"
  ],
  "grant_types": [
    "authorization_code",
    "refresh_token"
  ],
  "scope": "tasks:personal earthdata:write"
}
```
#### AUTHORIZE AND TOKEN
- Use PKCE for the browser redirect, then exchange the code on your own server or backend.
- ```text
GET /api/mcp/oauth/authorize
POST /api/mcp/oauth/token
POST /api/mcp/oauth/revoke
```
- REST API
### THE USEFUL PARTS ARE OPEN FIRST.
- These are the open endpoints for embedding a survey, creating tasks for people, collecting votes, and keeping organization data attached to the same shared record.
#### TASKS
- Create task assignments, list open work, claim work, complete claims, and keep comments with the task instead of in a lost chat thread.
#### REFERRALS
- Create referral invitations, attach them to tasks, and track whether a human copied, sent, declined, or finished the ask.
#### VOTES
- Let another site collect a referendum, survey, or treaty vote while writing the result into the same verified record Optimitron uses.
#### PEOPLE AND ORGANIZATIONS
- Search assignable people, create organizations, and update profiles so one contact or institution does not get rediscovered from scratch every Tuesday.
- EXAMPLE
### CREATE A TASK FOR A HUMAN.
- A survey or outreach app can ask for a person, create the task, and then show whether that person answered, voted, completed the work, or needs another nudge.
- ```text
POST /api/tasks

{
  "title": "Ask Dr. Example to vote on the 1% Treaty",
  "description": "Send the treaty vote link and answer any obvious question.",
  "isPublic": false,
  "assigneePersonInvite": {
    "email": "doctor@example.org",
    "firstName": "Ada",
    "lastName": "Example"
  },
  "contactTemplate": "Please vote on the 1% Treaty and send it to two people who can help."
}
```
- PERMISSIONS
### ASK FOR THE SMALLEST SCOPE THAT WORKS.
- Manage your private tasks, dependencies, comments, queues, and next-action recommendations
- Manage private tasks for organizations where you have permission
- Approve exact outbound-action payloads as an authenticated human
- Admin-only: create and manage public Optimitron tasks, people, organizations, estimates, and dependencies
- Create sourced public Earth-data records: memorials, evidence, intervention reports, organization signatories, and correction reports
- Admin-only: hide, restore, merge, and resolve Earth-data records and reports
- Admin-only: run coordinated public-task agents with leases and run logs
- Admin-only: access the configured GitHub repos via the server-side PAT (search code, read files, list directories, generic API passthrough)
### AGENTS USE THE SAME AUTHORIZATION.
- MCP clients can discover tools, add impact estimates, and call the task graph with the same OAuth scopes used by REST clients.
- ```text
GET /api/mcp/tools
POST /api/mcp
```
- [MCP SETUP](/mcp)
### MACHINES CAN READ THE CONTRACT.
- Point API clients, SDK generators, or documentation tooling at the OpenAPI document and stop guessing from source files.
- ```text
GET /openapi.json
```
- [OPEN JSON](/openapi.json)
