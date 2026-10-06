import { FormFieldType, FormPurpose } from "@optimitron/db";

import { storeFormSubmission, type StoredForm } from "@/lib/form-submission-store";
import { PARTNER_TYPES } from "@/lib/partner-signup-options";
import type { PartnerSignupInput } from "@/lib/partner-signup";

const partnerSignupForm: StoredForm = {
  sourceKey: "acceleratedmedicine:partner-signup",
  title: "Partner and advisory-board sign-up",
  purpose: FormPurpose.INTAKE,
  fields: [
    {
      key: "type",
      prompt: "How do you want to work with us?",
      type: FormFieldType.SINGLE_SELECT,
      required: true,
      optionsJson: PARTNER_TYPES,
    },
    {
      key: "name",
      prompt: "Your name",
      type: FormFieldType.SHORT_TEXT,
      required: true,
    },
    {
      key: "email",
      prompt: "Email",
      type: FormFieldType.EMAIL,
      required: true,
    },
    {
      key: "organization",
      prompt: "Organization",
      type: FormFieldType.SHORT_TEXT,
      required: false,
    },
    {
      key: "message",
      prompt: "Message",
      type: FormFieldType.LONG_TEXT,
      required: false,
    },
  ],
};

export function storePartnerSignup(
  input: PartnerSignupInput,
  submissionKey: string,
  clientKey: string,
) {
  return storeFormSubmission(
    partnerSignupForm,
    {
      type: input.type,
      name: input.name,
      email: input.email,
      organization: input.organization || "",
      message: input.message || "",
    },
    submissionKey,
    clientKey,
  );
}
