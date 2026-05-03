import { NextResponse } from "next/server";
import {
  buildEvidencePackage,
  EvidencePackageNotConsentedError,
  MemorialNotFoundError,
} from "@/lib/evidence-package.server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Resolve handle/id → memorial id (PersonMemorial.id is what the lib needs).
    // Accept either a memorial id, a person id, or a person handle.
    let memorialId = id;
    if (!id.startsWith("memorial_")) {
      const person = await prisma.person.findFirst({
        where: {
          deletedAt: null,
          OR: [{ id }, { handle: id }],
          memorial: { isNot: null },
        },
        select: { memorial: { select: { id: true } } },
      });
      if (!person?.memorial) {
        return NextResponse.json({ error: "Memorial not found" }, { status: 404 });
      }
      memorialId = person.memorial.id;
    }

    const evidencePackage = await buildEvidencePackage(memorialId);
    return NextResponse.json(evidencePackage);
  } catch (error) {
    if (error instanceof MemorialNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof EvidencePackageNotConsentedError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Failed to build evidence package", error);
    return NextResponse.json(
      { error: "Failed to build evidence package" },
      { status: 500 },
    );
  }
}
