import {
  FAMOUS_DISEASE_DEATH_EVIDENCE_TYPE,
  HUMANITY_V_GOVERNMENT_CASE_SLUG,
} from "../constants.js";
import {
  CourtCaseItemStatus,
  PersonDeathCauseCategory,
  PersonLifeStatus,
  type PrismaClient,
} from "../generated/prisma/client.js";
import { upsertWishoniaUser } from "../system-users.js";

// Famous people who died of disease since 1976, attached to Humanity v
// Government as public evidence of harm to the class. They are NOT parties:
// no represented vote, no memorial submission, no consent flag. They are
// public figures with public records; "official" status comes from an
// officeholder source key, not from isPublicFigure.

export interface FamousDiseaseDeath {
  key: string;
  displayName: string;
  conditionName: string;
  deathDate: string;
  sourceUrl: string;
}

export const FAMOUS_DISEASE_DEATHS: readonly FamousDiseaseDeath[] = [
  { key: "bob-marley", displayName: "Bob Marley", conditionName: "Melanoma", deathDate: "1981-05-11", sourceUrl: "https://en.wikipedia.org/wiki/Bob_Marley" },
  { key: "terry-fox", displayName: "Terry Fox", conditionName: "Bone cancer", deathDate: "1981-06-28", sourceUrl: "https://en.wikipedia.org/wiki/Terry_Fox" },
  { key: "gilda-radner", displayName: "Gilda Radner", conditionName: "Ovarian cancer", deathDate: "1989-05-20", sourceUrl: "https://en.wikipedia.org/wiki/Gilda_Radner" },
  { key: "ryan-white", displayName: "Ryan White", conditionName: "AIDS", deathDate: "1990-04-08", sourceUrl: "https://en.wikipedia.org/wiki/Ryan_White" },
  { key: "jim-henson", displayName: "Jim Henson", conditionName: "Strep infection", deathDate: "1990-05-16", sourceUrl: "https://en.wikipedia.org/wiki/Jim_Henson" },
  { key: "freddie-mercury", displayName: "Freddie Mercury", conditionName: "AIDS", deathDate: "1991-11-24", sourceUrl: "https://en.wikipedia.org/wiki/Freddie_Mercury" },
  { key: "audrey-hepburn", displayName: "Audrey Hepburn", conditionName: "Appendix cancer", deathDate: "1993-01-20", sourceUrl: "https://en.wikipedia.org/wiki/Audrey_Hepburn" },
  { key: "arthur-ashe", displayName: "Arthur Ashe", conditionName: "AIDS", deathDate: "1993-02-06", sourceUrl: "https://en.wikipedia.org/wiki/Arthur_Ashe" },
  { key: "frank-zappa", displayName: "Frank Zappa", conditionName: "Prostate cancer", deathDate: "1993-12-04", sourceUrl: "https://en.wikipedia.org/wiki/Frank_Zappa" },
  { key: "carl-sagan", displayName: "Carl Sagan", conditionName: "Bone marrow disease", deathDate: "1996-12-20", sourceUrl: "https://en.wikipedia.org/wiki/Carl_Sagan" },
  { key: "linda-mccartney", displayName: "Linda McCartney", conditionName: "Breast cancer", deathDate: "1998-04-17", sourceUrl: "https://en.wikipedia.org/wiki/Linda_McCartney" },
  { key: "walter-payton", displayName: "Walter Payton", conditionName: "Bile duct cancer", deathDate: "1999-11-01", sourceUrl: "https://en.wikipedia.org/wiki/Walter_Payton" },
  { key: "george-harrison", displayName: "George Harrison", conditionName: "Lung cancer", deathDate: "2001-11-29", sourceUrl: "https://en.wikipedia.org/wiki/George_Harrison" },
  { key: "farrah-fawcett", displayName: "Farrah Fawcett", conditionName: "Anal cancer", deathDate: "2009-06-25", sourceUrl: "https://en.wikipedia.org/wiki/Farrah_Fawcett" },
  { key: "steve-jobs", displayName: "Steve Jobs", conditionName: "Pancreatic cancer", deathDate: "2011-10-05", sourceUrl: "https://en.wikipedia.org/wiki/Steve_Jobs" },
  { key: "david-bowie", displayName: "David Bowie", conditionName: "Liver cancer", deathDate: "2016-01-10", sourceUrl: "https://en.wikipedia.org/wiki/David_Bowie" },
  { key: "gene-wilder", displayName: "Gene Wilder", conditionName: "Alzheimer's disease", deathDate: "2016-08-29", sourceUrl: "https://en.wikipedia.org/wiki/Gene_Wilder" },
  { key: "stephen-hawking", displayName: "Stephen Hawking", conditionName: "ALS", deathDate: "2018-03-14", sourceUrl: "https://en.wikipedia.org/wiki/Stephen_Hawking" },
  { key: "aretha-franklin", displayName: "Aretha Franklin", conditionName: "Pancreatic cancer", deathDate: "2018-08-16", sourceUrl: "https://en.wikipedia.org/wiki/Aretha_Franklin" },
  { key: "chadwick-boseman", displayName: "Chadwick Boseman", conditionName: "Colon cancer", deathDate: "2020-08-28", sourceUrl: "https://en.wikipedia.org/wiki/Chadwick_Boseman" },
];

// Keys removed from the list above. Sync soft-deletes their evidence rows,
// because absence from the list is not permission to delete.
// Eddie Van Halen: his immediate cause of death was a stroke, not cancer.
const RETIRED_FAMOUS_DISEASE_DEATH_KEYS: readonly string[] = ["eddie-van-halen"];

function famousDiseaseDeathSourceRef(key: string): string {
  return `${FAMOUS_DISEASE_DEATH_EVIDENCE_TYPE}:${key}`;
}

export async function syncManagedFamousDiseaseDeaths(
  prisma: PrismaClient,
  options: { apply: boolean },
): Promise<{ total: number; dryRun: boolean }> {
  const total = FAMOUS_DISEASE_DEATHS.length;
  if (!options.apply) return { total, dryRun: true };

  const { user } = await upsertWishoniaUser(prisma);
  const courtCase = await prisma.courtCase.findUniqueOrThrow({
    where: { slug: HUMANITY_V_GOVERNMENT_CASE_SLUG },
    select: { id: true },
  });

  for (const [index, death] of FAMOUS_DISEASE_DEATHS.entries()) {
    const sourceRef = famousDiseaseDeathSourceRef(death.key);
    const deathDate = new Date(`${death.deathDate}T00:00:00.000Z`);
    const year = death.deathDate.slice(0, 4);
    const circumstances = `Died of ${death.conditionName.toLowerCase()} in ${year}.`;

    const personData = {
      deathDate,
      deletedAt: null,
      displayName: death.displayName,
      isPublic: true,
      isPublicFigure: true,
      lifeStatus: PersonLifeStatus.DECEASED,
      sourceUrl: death.sourceUrl,
    };
    const person = await prisma.person.upsert({
      where: { sourceRef },
      update: personData,
      create: { ...personData, createdByUserId: user.id, sourceRef },
      select: { id: true },
    });

    const memorialData = {
      causeCategory: PersonDeathCauseCategory.DISEASE,
      circumstances,
      deletedAt: null,
      isPublic: true,
    };
    const memorial = await prisma.personMemorial.upsert({
      where: { personId: person.id },
      update: memorialData,
      create: { ...memorialData, personId: person.id },
      select: { id: true },
    });

    const evidenceData = {
      bodyMarkdown: circumstances,
      deletedAt: null,
      evidenceType: FAMOUS_DISEASE_DEATH_EVIDENCE_TYPE,
      isPublic: true,
      metadataJson: { conditionName: death.conditionName },
      personMemorialId: memorial.id,
      reviewStatus: CourtCaseItemStatus.ACCEPTED,
      sortOrder: index,
      sourceUrl: death.sourceUrl,
      title: `${death.displayName}: ${death.conditionName}, ${year}`,
    };
    await prisma.courtCaseEvidence.upsert({
      where: {
        caseId_evidenceKey: { caseId: courtCase.id, evidenceKey: sourceRef },
      },
      update: evidenceData,
      create: {
        ...evidenceData,
        caseId: courtCase.id,
        createdByUserId: user.id,
        evidenceKey: sourceRef,
      },
    });
  }

  const retiredRefs = RETIRED_FAMOUS_DISEASE_DEATH_KEYS.map(
    famousDiseaseDeathSourceRef,
  );
  const retiredAt = new Date();
  await prisma.courtCaseEvidence.updateMany({
    where: {
      caseId: courtCase.id,
      deletedAt: null,
      evidenceKey: { in: retiredRefs },
    },
    data: { deletedAt: retiredAt },
  });
  await prisma.personMemorial.updateMany({
    where: { deletedAt: null, person: { sourceRef: { in: retiredRefs } } },
    data: { deletedAt: retiredAt, isPublic: false },
  });
  await prisma.person.updateMany({
    where: { sourceRef: { in: retiredRefs } },
    data: { isPublic: false, isPublicFigure: false },
  });

  return { total, dryRun: false };
}

export function formatManagedFamousDiseaseDeathsResult(result: {
  total: number;
  dryRun: boolean;
}): string {
  if (result.dryRun) {
    return `Famous disease deaths: would sync ${result.total} (dry-run)`;
  }
  return `Famous disease deaths: ${result.total} synced`;
}
