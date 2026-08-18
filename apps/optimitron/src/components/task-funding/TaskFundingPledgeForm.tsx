"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { primaryButtonClassName } from "@/components/ui/default-button";
import { cn } from "@/lib/utils";

type PledgerKind = "PERSON" | "ORGANIZATION";
type FundingTargetStatus = "OPEN" | "THRESHOLD_MET" | "EXPIRED" | "CANCELLED";

interface SerializedFundingStatus {
  targetUsdCents: string;
  committedUsdCents: string;
  remainingUsdCents: string;
  percentToTarget: number;
  status: FundingTargetStatus;
  pledgerCount: number;
}

export interface PledgeResponse {
  pledge: {
    id: string;
    targetId: string;
    status: string;
    pledgerKind: PledgerKind;
    unitKey: string;
    unitQuantity: string;
    unitAmountCentsSnapshot: string | null;
    committedAmountCents: string;
    publicDisplay: boolean;
    updatedAt: string;
  };
  fundingStatus: SerializedFundingStatus;
  thresholdTransition: {
    triggered: boolean;
    thresholdMetAt: string | null;
  };
}

export type TaskFundingPledgeUnitConfig =
  | {
      unitKind: "USD";
      suggestedAmountCents?: bigint;
      minAmountCents?: bigint;
      maxAmountCents?: bigint;
    }
  | {
      unitKind: "COMMERCE_OFFER";
      offerKey: string;
      variantKey?: string;
      suggestedQuantity?: string;
      unitLabel: string;
    };

export interface TaskFundingStatusSnapshot {
  targetUsdCents: bigint | string;
  committedUsdCents: bigint | string;
  remainingUsdCents: bigint | string;
  percentToTarget: number;
  status: FundingTargetStatus;
  pledgerCount: number;
}

export interface TaskFundingPledgeFormProps {
  taskId: string;
  pledgerKind: PledgerKind;
  organizationId?: string;
  unitConfig: TaskFundingPledgeUnitConfig;
  initialPublicDisplay?: boolean;
  termsVersion?: string;
  initialFundingStatus?: TaskFundingStatusSnapshot | null;
  labels: {
    amountLabel: string;
    submitButtonLabel: string;
    publicDisplayLabel?: string;
    termsNoteLabel?: string;
  };
  onSuccess?: (response: PledgeResponse) => void;
}

const decimalQuantityPattern = /^[0-9]+(\.[0-9]{1,3})?$/;
const positiveIntegerPattern = /^[1-9][0-9]*$/;

type UsdValidationResult =
  | { amount: string; error?: never }
  | { amount?: never; error: string };

type QuantityValidationResult =
  | { quantity: string; error?: never }
  | { quantity?: never; error: string };

function getInitialAmount(unitConfig: TaskFundingPledgeUnitConfig) {
  if (unitConfig.unitKind === "USD") {
    return unitConfig.suggestedAmountCents?.toString() ?? "";
  }
  return unitConfig.suggestedQuantity ?? "";
}

function getFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function validateUsdAmount(
  value: string,
  unitConfig: Extract<TaskFundingPledgeUnitConfig, { unitKind: "USD" }>,
): UsdValidationResult {
  const amount = value.trim();
  if (!positiveIntegerPattern.test(amount)) {
    return { error: "Enter an amount greater than zero." };
  }

  const cents = BigInt(amount);
  if (
    unitConfig.minAmountCents !== undefined &&
    cents < unitConfig.minAmountCents
  ) {
    return {
      error: `Enter an amount no less than ${unitConfig.minAmountCents.toString()} cents.`,
    };
  }
  if (
    unitConfig.maxAmountCents !== undefined &&
    cents > unitConfig.maxAmountCents
  ) {
    return {
      error: `Enter an amount no more than ${unitConfig.maxAmountCents.toString()} cents.`,
    };
  }

  return { amount };
}

function validateCommerceQuantity(value: string): QuantityValidationResult {
  const quantity = value.trim();
  if (!decimalQuantityPattern.test(quantity)) {
    return { error: "Enter a quantity using up to 3 decimal places." };
  }
  if (Number(quantity) <= 0) {
    return { error: "Enter a quantity greater than zero." };
  }
  return { quantity };
}

async function readJson(response: Response) {
  return response.json().catch(() => null) as Promise<unknown>;
}

export function TaskFundingPledgeForm({
  taskId,
  pledgerKind,
  organizationId,
  unitConfig,
  initialPublicDisplay = false,
  termsVersion,
  labels,
  onSuccess,
}: TaskFundingPledgeFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<PledgeResponse | null>(null);

  const unitHint = useMemo(() => {
    if (unitConfig.unitKind === "USD") return "cents";
    return unitConfig.unitLabel;
  }, [unitConfig]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(event.currentTarget);
    const amount = getFormValue(formData, "amount");
    const publicDisplay = formData.get("publicDisplay") === "on";

    if (pledgerKind === "ORGANIZATION" && !organizationId) {
      setError("Choose an organization before pledging.");
      return;
    }

    let body:
      | {
          amountCents: string;
          mode: "replace";
          organizationId?: string;
          pledgerKind: PledgerKind;
          publicDisplay: boolean;
          termsNote?: string;
          termsVersion?: string;
          unitKind: "USD";
        }
      | {
          mode: "replace";
          offerKey: string;
          organizationId?: string;
          pledgerKind: PledgerKind;
          publicDisplay: boolean;
          quantity: string;
          termsNote?: string;
          termsVersion?: string;
          unitKind: "COMMERCE_OFFER";
          variantKey?: string;
        };

    if (unitConfig.unitKind === "USD") {
      const result = validateUsdAmount(amount, unitConfig);
      if (result.error !== undefined) {
        setError(result.error);
        return;
      }
      body = {
        amountCents: result.amount,
        mode: "replace",
        organizationId,
        pledgerKind,
        publicDisplay,
        termsVersion,
        unitKind: "USD",
      };
    } else {
      const result = validateCommerceQuantity(amount);
      if (result.error !== undefined) {
        setError(result.error);
        return;
      }
      body = {
        mode: "replace",
        offerKey: unitConfig.offerKey,
        organizationId,
        pledgerKind,
        publicDisplay,
        quantity: result.quantity,
        termsVersion,
        unitKind: "COMMERCE_OFFER",
        variantKey: unitConfig.variantKey,
      };
    }

    const trimmedTermsNote = getFormValue(formData, "termsNote").trim();
    if (trimmedTermsNote) {
      body.termsNote = trimmedTermsNote;
    }

    setPending(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/pledge`, {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const json = await readJson(response);
      if (!response.ok) {
        const message =
          json &&
          typeof json === "object" &&
          "error" in json &&
          typeof json.error === "string"
            ? json.error
            : "Failed to record pledge.";
        setError(message);
        return;
      }

      const pledgeResponse = json as PledgeResponse;
      setSuccess(pledgeResponse);
      onSuccess?.(pledgeResponse);
    } catch {
      setError("Failed to record pledge.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="space-y-4 border-2 border-foreground bg-background p-4 font-bold text-foreground sm:p-6"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <label className="block text-sm font-black uppercase" htmlFor="pledge-amount">
          {labels.amountLabel}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <input
            className="min-h-12 flex-1 rounded-none border-2 border-foreground bg-background px-3 py-2 text-lg font-black text-foreground outline-none focus:ring-2 focus:ring-foreground"
            defaultValue={getInitialAmount(unitConfig)}
            id="pledge-amount"
            inputMode={unitConfig.unitKind === "USD" ? "numeric" : "decimal"}
            name="amount"
            placeholder={unitConfig.unitKind === "USD" ? "10000" : "1"}
            type="text"
          />
          <span className="inline-flex min-h-12 items-center border-2 border-foreground px-3 text-sm font-black uppercase">
            {unitHint}
          </span>
        </div>
      </div>

      {labels.publicDisplayLabel ? (
        <label className="flex items-start gap-3 text-sm font-bold">
          <input
            className="mt-1 size-4 rounded-none border-2 border-foreground accent-foreground"
            defaultChecked={initialPublicDisplay}
            name="publicDisplay"
            type="checkbox"
          />
          <span>{labels.publicDisplayLabel}</span>
        </label>
      ) : null}

      {labels.termsNoteLabel ? (
        <label className="block space-y-2 text-sm font-bold">
          <span className="font-black uppercase">{labels.termsNoteLabel}</span>
          <textarea
            className="min-h-24 w-full rounded-none border-2 border-foreground bg-background px-3 py-2 font-bold text-foreground outline-none focus:ring-2 focus:ring-foreground"
            maxLength={1000}
            name="termsNote"
          />
        </label>
      ) : null}

      {error ? (
        <p className="border-2 border-foreground p-3 text-sm font-black" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="border-2 border-foreground p-3 text-sm font-black" role="status">
          Pledge recorded.{" "}
          <Link className="underline underline-offset-4" href="/dashboard">
            Open your dashboard &rarr;
          </Link>
        </p>
      ) : null}

      <button
        className={cn(primaryButtonClassName, "w-full border-2")}
        disabled={pending}
        type="submit"
      >
        {pending ? (
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : null}
        {pending ? "Recording pledge..." : labels.submitButtonLabel}
      </button>
    </form>
  );
}
