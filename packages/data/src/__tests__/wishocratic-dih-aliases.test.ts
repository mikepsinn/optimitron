import { describe, expect, it } from "vitest";
import {
  isWishocraticItemId,
  resolveDihCategoryToItemIds,
  resolveDihPairAllocations,
  toDihClientCategoryId,
} from "../wishocratic-dih-aliases";

describe("wishocratic DIH aliases", () => {
  it("passes through Optimitron item ids", () => {
    expect(isWishocraticItemId("PRAGMATIC_CLINICAL_TRIALS")).toBe(true);
    expect(resolveDihCategoryToItemIds("PRAGMATIC_CLINICAL_TRIALS")).toEqual([
      "PRAGMATIC_CLINICAL_TRIALS",
    ]);
  });

  it("maps renamed DIH categories", () => {
    expect(resolveDihCategoryToItemIds("DRUG_WAR_ENFORCEMENT")).toEqual(["DRUG_WAR"]);
    expect(resolveDihCategoryToItemIds("PRISON_CONSTRUCTION")).toEqual([
      "VIOLENT_CRIME_INCARCERATION",
    ]);
  });

  it("expands ICE to both deportation items", () => {
    expect(resolveDihCategoryToItemIds("ICE_IMMIGRATION_ENFORCEMENT")).toEqual([
      "ICE_CRIMINAL_DEPORTATION",
      "ICE_NONCRIMINAL_DEPORTATION",
    ]);
  });

  it("returns empty for unknown ids", () => {
    expect(resolveDihCategoryToItemIds("NOT_A_REAL_CATEGORY")).toEqual([]);
  });

  it("expands DIH pairs and normalizes order", () => {
    const pairs = resolveDihPairAllocations({
      categoryA: "MILITARY_OPERATIONS",
      categoryB: "DRUG_WAR_ENFORCEMENT",
      allocationA: 70,
      allocationB: 30,
    });
    expect(pairs).toHaveLength(1);
    expect(pairs[0].itemAId < pairs[0].itemBId).toBe(true);
    expect(pairs[0].allocationA + pairs[0].allocationB).toBe(100);
  });

  it("maps item ids back to DIH client categories when aliased", () => {
    expect(toDihClientCategoryId("DRUG_WAR")).toBe("DRUG_WAR_ENFORCEMENT");
    expect(toDihClientCategoryId("PRAGMATIC_CLINICAL_TRIALS")).toBe(
      "PRAGMATIC_CLINICAL_TRIALS",
    );
  });
});
