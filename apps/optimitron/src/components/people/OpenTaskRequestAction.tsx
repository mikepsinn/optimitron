"use client";

import Link from "next/link";
import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { defaultButtonClassName } from "@/components/ui/default-button";

interface OpenTaskRequestActionProps {
  buttonLabel?: string;
  callbackUrl: string;
  isAuthenticated: boolean;
  signInHref: string;
}

export function OpenTaskRequestAction({
  buttonLabel = "Ask for help",
  callbackUrl,
  isAuthenticated,
  signInHref,
}: OpenTaskRequestActionProps) {
  const [open, setOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <Link
        className={`${defaultButtonClassName} w-full sm:w-auto`}
        href={signInHref}
      >
        <ClipboardList className="h-4 w-4 stroke-[2.5px]" />
        {buttonLabel}
      </Link>
    );
  }

  return (
    <>
      <button
        className={`${defaultButtonClassName} w-full sm:w-auto`}
        onClick={() => setOpen(true)}
        type="button"
      >
        <ClipboardList className="h-4 w-4 stroke-[2.5px]" />
        {buttonLabel}
      </button>
      <CreateTaskDialog
        allowedTaskModes={["open"]}
        callbackUrl={callbackUrl}
        dialogTitle="Ask for help"
        initialTaskMode="open"
        onOpenChange={setOpen}
        open={open}
        submitLabel="Post task"
      />
    </>
  );
}
