export const CAMPAIGN_NAME = "International Campaign to End War and Disease" as const;

export const GLOBAL_SURVEY_NAME =
  "Global Survey to End War and Disease" as const;

export const ORGANIZATION_ACTIVATION_TASK_TITLE =
  `Share the ${GLOBAL_SURVEY_NAME} with your members` as const;

export const ORGANIZATION_ACTIVATION_TASK_KEY_SUFFIX =
  "share-1-percent-treaty-survey" as const;

export const DEMO_USER_EMAIL = "demo@thinkbynumbers.org" as const;
export const DEMO_PERSON_SOURCE_REF = "managed-person:demo-user" as const;
export const DEMO_ORGANIZATION_SOURCE_REF =
  "managed-organization:demo-organization" as const;
export const DEMO_ORGANIZATION_SLUG = "demo-organization" as const;
export const DEMO_ORGANIZATION_NAME = "Demo Organization" as const;

export const HUMANITY_MANAGEMENT = {
  requiredPhoneCalls: 1,
  directHumanAssignments: 2,
  propagationAsksPerHuman: 2,
  callOneHumanTaskTitle: "Make one phone call. Outsource humanity management.",
} as const;

export * from "./campaign/nuclear-overkill-framing";

export function getOrganizationActivationTaskKey(organizationId: string) {
  return `organization:${organizationId}:${ORGANIZATION_ACTIVATION_TASK_KEY_SUFFIX}`;
}

export function buildOrganizationActivationTaskDescription(input: {
  baseUrl: string;
  coalitionStrategyUrl: string;
  legalUrl: string;
  organizationName: string;
  organizationToolsUrl: string;
  surveyUrl: string;
}) {
  return `Your organization joined the ${CAMPAIGN_NAME} by publicly supporting the 1% Treaty. Now use the reach your members already trust: place the ${GLOBAL_SURVEY_NAME} link on your site and share it once with your list.

Why this task exists:
- Members get a simple way to review the treaty and record their response.
- Responses from your organization link are credited to ${input.organizationName}.
- This is a policy survey, not a candidate endorsement.

## Do this
1. Open [your organization tools page](${input.organizationToolsUrl}).
2. Copy the outreach grant request draft if funding would help you reach more members.
3. Copy the member survey link, website button, or iframe.
4. Put one of them on your website or in a newsletter.
5. Ask members to review the treaty and record their response.

## Member survey URL
<${input.surveyUrl}>

## Iframe embed code
\`\`\`html
<iframe src="${input.surveyUrl}" title="${input.organizationName} Global Survey to End War and Disease" width="100%" height="760" style="border:0;max-width:100%;"></iframe>
\`\`\`

## Website button HTML
\`\`\`html
<a href="${input.surveyUrl}" style="display:inline-block;border:1px solid #000;padding:12px 16px;color:#000;text-decoration:none;font-weight:700;">Take the Global Survey to End War and Disease</a>
\`\`\`

## Starter email subject
\`\`\`text
Please take 30 seconds to end war and disease
\`\`\`

## Starter email body
\`\`\`text
${input.organizationName} has joined the International Campaign to End War and Disease as an organizational supporter of the 1% Treaty.

We are asking our members to review the treaty and record their response in the Global Survey to End War and Disease.

The survey is here:
${input.surveyUrl}

If you agree that every country should redirect 1% of military spending toward clinical trials and disease eradication, vote yes and share it with one person who should see it.

Thank you,
${input.organizationName}
\`\`\`

## Full tools page
Open [your organization tools page](${input.organizationToolsUrl}) for the copy buttons, linked email version, survey preview, and outreach grant calculator.

## Done when
- The survey is linked or embedded where members can find it.
- At least one email, newsletter item, or social post sends members to the survey.
- The organization URL stays intact so responses are credited to ${input.organizationName}.

## References
- [Why organizations should share this](${input.coalitionStrategyUrl})
- [Legal notes](${input.legalUrl})`;
}
