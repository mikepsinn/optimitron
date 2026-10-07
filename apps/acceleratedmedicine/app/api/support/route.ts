import { createFormPostHandler } from "@/lib/form-post-handler";
import { sendSupporterSignup, supporterSchema } from "@/lib/support";

export const POST = createFormPostHandler(supporterSchema, sendSupporterSignup);
