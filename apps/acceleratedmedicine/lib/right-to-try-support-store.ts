import { FormFieldType, FormPurpose } from "@optimitron/db";

import { storeFormSubmission, type StoredForm } from "@/lib/form-submission-store";
import { US_STATES } from "@/lib/right-to-try";
import type { RightToTrySupportInput } from "@/lib/right-to-try-support";

// The definition is unchanged since volunteer offers moved off this form, so
// stored responses keep their revision. "volunteer" and "name" hold those
// earlier offers.
const rightToTrySupportForm: StoredForm = {
  sourceKey: "acceleratedmedicine:universal-right-to-try-support",
  title: "Right to Trial participation",
  purpose: FormPurpose.SURVEY,
  fields: [
    {
      key: "intent",
      prompt: "How this person wants to participate",
      type: FormFieldType.SINGLE_SELECT,
      required: true,
      optionsJson: ["state-support", "volunteer"],
    },
    {
      key: "name",
      prompt: "Your name",
      type: FormFieldType.SHORT_TEXT,
      required: false,
    },
    {
      key: "state",
      prompt: "Your state",
      type: FormFieldType.SINGLE_SELECT,
      required: true,
      optionsJson: US_STATES.map(([name]) => name),
    },
    {
      key: "position",
      prompt:
        "Should every patient in your state have the right to join a clinical trial for the most promising treatments?",
      type: FormFieldType.SINGLE_SELECT,
      required: false,
      optionsJson: ["yes", "unsure", "no"],
    },
    {
      key: "role",
      prompt: "Your role",
      type: FormFieldType.SINGLE_SELECT,
      required: true,
      optionsJson: [
        "patient-or-caregiver",
        "clinician",
        "researcher",
        "public-educator",
        "state-legislator-or-staff",
        "other",
      ],
    },
    {
      key: "story",
      prompt: "Why does this matter to you?",
      type: FormFieldType.LONG_TEXT,
      required: false,
    },
    {
      key: "email",
      prompt: "Email",
      type: FormFieldType.EMAIL,
      required: false,
    },
    {
      key: "updates",
      prompt: "Send occasional Right to Trial updates",
      type: FormFieldType.BOOLEAN,
      required: true,
    },
  ],
};

export function storeRightToTrySupport(
  input: RightToTrySupportInput,
  submissionKey: string,
  clientKey: string,
) {
  return storeFormSubmission(
    rightToTrySupportForm,
    {
      intent: input.intent,
      name: "",
      state: input.state,
      position: input.position,
      role: input.role,
      story: input.story || "",
      email: input.email || "",
      updates: input.updates,
    },
    submissionKey,
    clientKey,
  );
}
