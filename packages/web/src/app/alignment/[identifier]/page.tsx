import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlignmentReport } from "@/components/alignment/AlignmentReport";
import {
  findAlignmentReportOwnerByIdentifier,
  getPersonalAlignmentState,
} from "@/lib/alignment-report.server";
import { buildAlignmentUrl, getBaseUrl } from "@/lib/url";

interface AlignmentSharePageProps {
  params: Promise<{
    identifier: string;
  }>;
}

export async function generateMetadata({
  params,
}: AlignmentSharePageProps): Promise<Metadata> {
  const { identifier } = await params;
  const owner = await findAlignmentReportOwnerByIdentifier(identifier);

  if (!owner) {
    return {
      title: "Alignment Report | Optimitron",
    };
  }

  return {
    title: `${owner.displayName} Alignment Report | Optimitron`,
    description:
      "Shared alignment report from Optimitron, the Earth Optimization Game.",
  };
}

export default async function AlignmentSharePage({
  params,
}: AlignmentSharePageProps) {
  const { identifier } = await params;
  const owner = await findAlignmentReportOwnerByIdentifier(identifier);

  if (!owner) {
    notFound();
  }

  const state = await getPersonalAlignmentState(owner.id);
  const shareUrl = buildAlignmentUrl(owner.publicIdentifier, getBaseUrl());

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <AlignmentReport
        state={state}
        shareUrl={shareUrl}
        ownerLabel={owner.displayName}
        publicMode
      />
    </div>
  );
}
