import type {
  BanditLevel,
  ChainDepth,
  RelationshipBucket,
  ReturningVsFirst,
  Surface,
} from "./types";

export type SegmentContext = {
  localeKey: string;
  hostKey: string;
  organizationId: string | null;
  relationshipBucket: RelationshipBucket | string | null;
  referralSource: string | null;
  device: string | null;
  chainDepth: ChainDepth;
  returningVsFirst: ReturningVsFirst;
  surface: Surface | string;
};

export function buildSegmentKey(ctx: SegmentContext): string {
  return [
    `loc:${ctx.localeKey}`,
    `host:${ctx.hostKey}`,
    `org:${ctx.organizationId ?? "null"}`,
    `bucket:${ctx.relationshipBucket ?? "null"}`,
    `ref:${ctx.referralSource ?? "null"}`,
    `dev:${ctx.device ?? "null"}`,
    `depth:${ctx.chainDepth}`,
    `ret:${ctx.returningVsFirst}`,
    `surf:${ctx.surface}`,
  ].join("/");
}

export function buildLevelKeys(
  ctx: SegmentContext,
): Array<{ level: BanditLevel; segmentKey: string }> {
  return [
    { level: "GLOBAL", segmentKey: "GLOBAL" },
    { level: "LOCALE", segmentKey: `loc:${ctx.localeKey}` },
    {
      level: "HOST",
      segmentKey: `loc:${ctx.localeKey}/host:${ctx.hostKey}`,
    },
    {
      level: "ORG",
      segmentKey: `loc:${ctx.localeKey}/host:${ctx.hostKey}/org:${ctx.organizationId ?? "null"}`,
    },
    {
      level: "BUCKET",
      segmentKey: `loc:${ctx.localeKey}/host:${ctx.hostKey}/org:${ctx.organizationId ?? "null"}/bucket:${ctx.relationshipBucket ?? "null"}`,
    },
    {
      level: "SEGMENT",
      segmentKey: buildSegmentKey(ctx),
    },
  ];
}
