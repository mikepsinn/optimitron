"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Clipboard } from "lucide-react";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { defaultButtonClassName } from "@/components/ui/default-button";

interface PersonTaskAssignmentActionProps {
  callbackUrl: string;
  isAuthenticated: boolean;
  personId: string;
  personName: string;
  signInHref: string;
}

export function PersonTaskAssignmentAction({
  callbackUrl,
  isAuthenticated,
  personId,
  personName,
  signInHref,
}: PersonTaskAssignmentActionProps) {
  const searchParams = useSearchParams();
  const handledAutoOpen = useRef(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (
      !handledAutoOpen.current &&
      isAuthenticated &&
      searchParams.get("assignTask") === "1"
    ) {
      handledAutoOpen.current = true;
      setOpen(true);
    }
  }, [isAuthenticated, searchParams]);

  if (!isAuthenticated) {
    return (
      <Link
        className={`${defaultButtonClassName} w-full sm:w-auto`}
        href={signInHref}
      >
        <Clipboard className="h-4 w-4 stroke-[2.5px]" />
        Assign Task
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
        <Clipboard className="h-4 w-4 stroke-[2.5px]" />
        Assign Task
      </button>
      <CreateTaskDialog
        callbackUrl={callbackUrl}
        fixedAssigneePerson={{ id: personId, label: personName }}
        onOpenChange={setOpen}
        open={open}
      />
    </>
  );
}
