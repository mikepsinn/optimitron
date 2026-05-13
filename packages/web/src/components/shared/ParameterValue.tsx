import { createAdaptiveComponent } from "@/components/adaptive";
import { ParameterValueEmail } from "@/components/shared/ParameterValue.email";
import type { ParameterValueProps } from "@/components/shared/ParameterValue.core";
import { ParameterValueWeb } from "@/components/shared/ParameterValue.web";

export type { ParameterValueProps } from "@/components/shared/ParameterValue.core";

export const ParameterValue = createAdaptiveComponent<ParameterValueProps>(
  "ParameterValue",
  {
    web: ParameterValueWeb,
    email: ParameterValueEmail,
  },
);
