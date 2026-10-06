import { createFormPostHandler } from "@/lib/form-post-handler";
import {
  rightToTrySupportSchema,
  sendRightToTrySupport,
} from "@/lib/right-to-try-support";

export const POST = createFormPostHandler(
  rightToTrySupportSchema,
  sendRightToTrySupport,
);
