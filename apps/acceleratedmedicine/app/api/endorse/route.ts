import { createFormPostHandler } from "@/lib/form-post-handler";
import { organizationSchema, sendOrganizationEndorsement } from "@/lib/support";

export const POST = createFormPostHandler(organizationSchema, sendOrganizationEndorsement);
