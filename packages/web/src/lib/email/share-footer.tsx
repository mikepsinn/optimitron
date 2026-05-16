import React from "react";
import { SHARING_TIME_MINUTES } from "@optimitron/data/parameters";
import { EMAIL_STYLES } from "@/components/adaptive/email-styles";
import { ParameterValueEmail as ParameterValue } from "@/components/shared/ParameterValue.email";
import { buildShareMessage, getShareMessageParts } from "@/lib/share-message";
import { renderTemplate } from "@/lib/tasks/render-template";
import { getShareTemplate } from "@/lib/tasks/share-templates";
import {
  FLOW_DOUBLING_ROUNDS_TO_TARGET_PARAM,
  FLOW_MAJORITY_OF_HUMANS_ON_EARTH,
  FLOW_REFERRALS_PER_VOTER,
  formatFlowWords,
} from "@/lib/treaty-share-flow-parameters";
import { renderReactEmailHtml } from "@/lib/email/render-react-email";

export const EMAIL_SHARE_TEMPLATE_ID = "sincere";
const DEFAULT_EMAIL_SHARE_TARGET_NAME = "there";

export function buildEmailShareTemplateText({
  referralUrl,
  targetName = DEFAULT_EMAIL_SHARE_TARGET_NAME,
  templateId = EMAIL_SHARE_TEMPLATE_ID,
}: {
  referralUrl: string;
  targetName?: string;
  templateId?: string;
}) {
  const template = getShareTemplate(templateId);
  if (!template) {
    throw new Error(`Unknown share template: ${templateId}`);
  }

  return renderTemplate(template.body, {
    target_name: targetName.trim() || DEFAULT_EMAIL_SHARE_TARGET_NAME,
    treaty_url: referralUrl,
  });
}

function LinkedShareTemplateText({
  referralUrl,
  text,
}: {
  referralUrl: string;
  text: string;
}) {
  const parts = text.split(referralUrl);
  if (parts.length === 1) return <>{text}</>;

  return (
    <>
      {parts.map((part, index) => (
        <React.Fragment key={`${part}-${index}`}>
          {part}
          {index < parts.length - 1 ? (
            <a href={referralUrl} style={EMAIL_STYLES.plainLink}>
              {referralUrl}
            </a>
          ) : null}
        </React.Fragment>
      ))}
    </>
  );
}

export function EmailShareMessage({
  referralUrl,
  targetName,
  templateId,
}: {
  referralUrl: string;
  targetName?: string;
  templateId?: string;
}) {
  if (templateId) {
    const message = buildEmailShareTemplateText({
      referralUrl,
      targetName,
      templateId,
    });
    return <LinkedShareTemplateText referralUrl={referralUrl} text={message} />;
  }

  const parts = getShareMessageParts(referralUrl);
  return (
    <>
      {parts.prefix}
      <ParameterValue
        param={SHARING_TIME_MINUTES}
        valueOverride={parts.timeText}
      />
      {parts.middle}
      <a href={parts.referralUrl} style={EMAIL_STYLES.plainLink}>
        {parts.referralUrl}
      </a>
      {parts.suffix}
    </>
  );
}

export function ReferralAskValue({ word = false }: { word?: boolean }) {
  return (
    <ParameterValue
      param={FLOW_REFERRALS_PER_VOTER}
      valueOverride={word ? "two" : undefined}
      display="integer"
    />
  );
}

export function ReferralAskText({ word = false }: { word?: boolean } = {}) {
  return word ? "two" : String(FLOW_REFERRALS_PER_VOTER.value);
}

export function DoublingRoundsValue() {
  return (
    <ParameterValue
      param={FLOW_DOUBLING_ROUNDS_TO_TARGET_PARAM}
      display="integer"
    />
  );
}

export function DoublingRoundsText() {
  return String(FLOW_DOUBLING_ROUNDS_TO_TARGET_PARAM.value);
}

export function MajorityHumanityValue() {
  return (
    <ParameterValue param={FLOW_MAJORITY_OF_HUMANS_ON_EARTH} figures={1} />
  );
}

export function MajorityHumanityText() {
  return formatFlowWords(FLOW_MAJORITY_OF_HUMANS_ON_EARTH, 1);
}

export function ReferralChainMath({
  resultSuffix = "humans reached",
}: {
  resultSuffix?: string;
}) {
  return (
    <>
      <DoublingRoundsValue /> doubling rounds × <ReferralAskValue /> referrals
      each = <MajorityHumanityValue /> {resultSuffix}
    </>
  );
}

export function buildReferralChainMathText(resultSuffix = "humans reached") {
  return `${DoublingRoundsText()} doubling rounds × ${ReferralAskText()} referrals each = ${MajorityHumanityText()} ${resultSuffix}`;
}

export function ShareFooter({ referralUrl }: { referralUrl: string }) {
  return (
    <div style={EMAIL_STYLES.divider}>
      <p style={EMAIL_STYLES.smallEyebrow}>
        Recruit <ReferralAskValue word /> more humans
      </p>
      <p
        style={{
          ...EMAIL_STYLES.paragraph,
          fontSize: "14px",
          margin: "0 0 12px",
        }}
      >
        <EmailShareMessage referralUrl={referralUrl} />
      </p>
      <p style={EMAIL_STYLES.smallMutedParagraph}>
        Copy the line above into iMessage, WhatsApp, Signal, email — wherever
        humans read words that you write. Or send them straight to{" "}
        <a href={referralUrl} style={EMAIL_STYLES.plainLink}>
          {referralUrl}
        </a>
        . <ReferralChainMath />
      </p>
    </div>
  );
}

export function buildShareFooterHtml(referralUrl: string) {
  return renderReactEmailHtml(<ShareFooter referralUrl={referralUrl} />);
}

export function buildShareFooterText(referralUrl: string): string {
  return [
    "",
    "—",
    "",
    `Recruit ${ReferralAskText({ word: true })} more humans`,
    "",
    buildShareMessage(referralUrl),
    "",
    `Or send straight to: ${referralUrl}`,
    buildReferralChainMathText(),
  ].join("\n");
}
