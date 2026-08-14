# /mcp

## Metadata

- Page title: dFDA MCP Server
- Meta description: Connect an AI assistant to dFDA to record personal health measurements, review your history, and manage tracking reminders.
- Canonical: https://dfda.earth/mcp
- Open Graph title: dFDA
- Open Graph description: A decentralized framework for drug assessment for ranking treatments by real-world effectiveness and outcome labels showing the positive and negative effects of every food and drug in the world.
- Open Graph image: https://dfda.earth/assets/dfda/dfda-og-1200x630.png
- Twitter title: dFDA
- Twitter description: A decentralized framework for drug assessment for ranking treatments by real-world effectiveness and outcome labels showing the positive and negative effects of every food and drug in the world.

## Visible Page Copy

- DFDA MCP SERVER
## GIVE YOUR AI ASSISTANT A HEALTH MEMORY.
- Tell it what you took, ate, felt, or measured. dFDA saves the measurement in your account, keeps your tracking reminders, and pulls your history back when you ask.
- [CONNECT YOUR AI](#connect)
- [SEE WHAT IT CAN DO](#tools)
- MCP SERVER URL
- ```text
https://dfda.earth/api/mcp
```
- COPY SERVER URL
- Choose Streamable HTTP or HTTP when your client asks for the transport. OAuth is discovered automatically.
- START HERE
### CONNECT, SIGN IN, RECORD ONE THING.
- 1 ADD THE SERVER Use a command below or paste the server URL into your AI app's custom MCP connector settings.
- 2 CREATE YOUR ACCOUNT Your AI app opens Optimitron in a browser. Sign in with your email or create an account, then authorize personal tracking access.
- 3 TRY ONE MEASUREMENT Ask: “Record that I slept 7.5 hours last night.” Your assistant should confirm what it saved.
- CODEX
#### ADD IT, THEN OPEN THE SIGN-IN FLOW.
- ```text
codex mcp add dfda --url https://dfda.earth/api/mcp
codex mcp login dfda
```
- COPY CODEX SETUP
- CLAUDE CODE
#### ONE COMMAND, THEN RUN /MCP.
- ```text
claude mcp add --transport http dfda https://dfda.earth/api/mcp
```
- COPY CLAUDE CODE SETUP
- CHATGPT, CLAUDE, CURSOR, AND OTHER MCP CLIENTS
#### PASTE THE URL OR THIS CONFIG.
- Add a custom MCP connector or app, choose OAuth, and paste the server URL. If the client asks for JSON, use this block.
- ```text
{
  "mcpServers": {
    "dfda": {
      "url": "https://dfda.earth/api/mcp"
    }
  }
}
```
- COPY MCP CONFIG
- NO SECOND DFDA SIGNUP.
- The authorization screen creates or signs in to the same account that stores your dFDA data. The server requests personal tracking access only. You can deny access or disconnect the MCP client at any time.
- WHAT IT CAN DO
### TEN TOOLS. YOUR DATA. NORMAL SENTENCES.
#### RECORD WHAT HAPPENED
- Log medication doses, foods, symptoms, mood, sleep, activity, labs, and vital signs in normal conversation.
#### ASK FOR YOUR HISTORY
- Pull back your own measurements by date or variable. Correct or delete a mistake without hunting through a spreadsheet.
#### KEEP A ROUTINE
- Create personal tracking reminders and check which measurements are due, answered, overdue, or snoozed.
#### ANSWER SEVERAL AT ONCE
- Review a day of reminders with your assistant and record several answers in one conversation.
- TRY THESE
### THREE USEFUL FIRST REQUESTS.
- “Record that I took 200 mg of magnesium at 9:15 PM.”
- “Show my sleep-duration measurements from the last seven days.”
- “Remind me every morning at 8:00 to rate my mood from 1 to 5.”
- dFDA records and retrieves your data. It does not diagnose a condition or replace a clinician.
