import { createFormPostHandler } from "@/lib/form-post-handler";
import { partnerSignupSchema, sendPartnerSignup } from "@/lib/partner-signup";

export const POST = createFormPostHandler(partnerSignupSchema, sendPartnerSignup);
