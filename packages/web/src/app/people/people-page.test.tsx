import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { TaskCategory } from "@optimitron/db";

const mocks = vi.hoisted(() => ({
  getPeopleDirectoryData: vi.fn(),
}));

vi.mock("@/lib/people-directory.server", () => ({
  getPeopleDirectoryData: mocks.getPeopleDirectoryData,
  parsePeopleDirectoryRole: (value: string | string[] | undefined) =>
    value === "officials" ? "officials" : "all",
}));

import PeoplePage from "./page";

describe("PeoplePage", () => {
  it("renders each person row as one profile link without separate task controls", async () => {
    (globalThis as typeof globalThis & { React: typeof React }).React = React;
    mocks.getPeopleDirectoryData.mockResolvedValue({
      page: 1,
      pageSize: 10,
      people: [
        {
          affiliation: "Campaign office",
          countryCode: "US",
          displayName: "Alice Organizer",
          headline: "Organizer",
          href: "/people/alice-organizer",
          id: "person-1",
          image: null,
          isPublicFigure: false,
          openTaskPreview: [
            {
              category: TaskCategory.OUTREACH,
              id: "task-1",
              skillTags: [],
              title: "Call the president",
            },
          ],
          publicTaskCount: 1,
          sourceUrl: null,
          verifiedTaskPreview: [],
        },
      ],
      query: "",
      role: "all",
      totalCount: 1,
      totalPages: 1,
    });

    const element = await PeoplePage({
      searchParams: Promise.resolve({}),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain('href="/people/alice-organizer"');
    expect(html).not.toContain('href="/tasks/task-1"');
    expect(html).not.toContain(">Profile<");
    expect(html).not.toContain(">Task<");
    expect(html).not.toContain("Next task");
    expect(html).not.toContain("Call the president");
  });
});
