import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { ReferendumKind } from "@optimitron/db/enums";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

const REFERENDUM_KINDS = new Set<string>(Object.values(ReferendumKind));

function cleanRequiredString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function cleanOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function buildReferendumContentHash(input: {
  question: string;
  description?: string | null;
  bodyMarkdown?: string | null;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        question: input.question.trim(),
        description: cleanOptionalString(input.description),
        bodyMarkdown: cleanOptionalString(input.bodyMarkdown),
      }),
    )
    .digest("hex");
}

export async function GET() {
  try {
    const referendums = await prisma.referendum.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        question: true,
        kind: true,
        description: true,
        status: true,
        publishedAt: true,
        lockedAt: true,
        contentHash: true,
        createdAt: true,
        _count: { select: { votes: { where: { deletedAt: null } } } },
      },
    });

    return NextResponse.json({ referendums });
  } catch (error) {
    console.error("[REFERENDUMS] Error listing referendums:", error);
    return NextResponse.json(
      { error: "Failed to list referendums" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    const body = (await request.json()) as Record<string, unknown>;
    const title = cleanRequiredString(body.title);
    const slug = cleanRequiredString(body.slug);
    const question = cleanRequiredString(body.question);
    const description = cleanOptionalString(body.description);
    const bodyMarkdown = cleanOptionalString(body.bodyMarkdown);
    const requestedKind = (
      cleanOptionalString(body.kind) ?? "GENERAL"
    ).toUpperCase();

    if (!title || !slug || !question) {
      return NextResponse.json(
        { error: "Title, slug, and question are required" },
        { status: 400 },
      );
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Slug must contain only lowercase letters, numbers, and hyphens" },
        { status: 400 },
      );
    }

    if (!REFERENDUM_KINDS.has(requestedKind)) {
      return NextResponse.json(
        { error: "Invalid referendum kind" },
        { status: 400 },
      );
    }
    const kind = requestedKind as ReferendumKind;

    const existing = await prisma.referendum.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A referendum with this slug already exists" },
        { status: 409 },
      );
    }

    const referendum = await prisma.referendum.create({
      data: {
        title,
        slug,
        question,
        kind,
        description,
        bodyMarkdown,
        publishedAt: new Date(),
        lockedAt: null,
        contentHash: buildReferendumContentHash({
          question,
          description,
          bodyMarkdown,
        }),
        createdByUserId: userId,
      },
    });

    return NextResponse.json({ referendum }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[REFERENDUMS] Error creating referendum:", error);
    return NextResponse.json(
      { error: "Failed to create referendum" },
      { status: 500 },
    );
  }
}
