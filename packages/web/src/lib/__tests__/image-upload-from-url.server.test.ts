import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  lookup: vi.fn(),
  uploadObject: vi.fn(),
}));

vi.mock("node:dns/promises", () => ({
  lookup: mocks.lookup,
}));

vi.mock("../object-storage.server", () => ({
  uploadObject: mocks.uploadObject,
}));

import { uploadImageFromUrl } from "../image-upload-from-url.server";

beforeEach(() => {
  mocks.lookup.mockReset();
  mocks.uploadObject.mockReset();
  vi.unstubAllGlobals();
  mocks.lookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
  mocks.uploadObject.mockResolvedValue({
    publicUrl: "https://assets.example.org/organizations/logos/logo.webp",
  });
});

async function tinyPng() {
  return sharp({
    create: {
      width: 120,
      height: 80,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    },
  })
    .png()
    .toBuffer();
}

describe("uploadImageFromUrl", () => {
  it("fetches, normalizes, and uploads public organization images", async () => {
    const image = await tinyPng();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(image, {
          headers: {
            "content-length": String(image.byteLength),
            "content-type": "image/png",
          },
          status: 200,
        }),
      ),
    );

    const result = await uploadImageFromUrl({
      filename: "Institute logo.png",
      kind: "organization-square-logo",
      url: "https://example.org/assets/logo.png",
    });

    expect(result).toEqual({
      contentType: "image/webp",
      key: expect.stringMatching(
        /^organizations\/logos\/\d{4}-\d{2}-\d{2}\/.+-Institute-logo\.webp$/,
      ),
      publicUrl: "https://assets.example.org/organizations/logos/logo.webp",
      sizeBytes: expect.any(Number),
      sourceUrl: "https://example.org/assets/logo.png",
    });
    expect(mocks.lookup).toHaveBeenCalledWith("example.org", { all: true });
    expect(mocks.uploadObject).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: "image/webp",
        key: result.key,
      }),
    );
  });

  it("rejects local/private hosts before fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      uploadImageFromUrl({
        kind: "organization-square-logo",
        url: "http://127.0.0.1/logo.png",
      }),
    ).rejects.toThrow("Image URL host is not allowed");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.uploadObject).not.toHaveBeenCalled();
  });

  it("rejects bracketed IPv6 loopback URLs before fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      uploadImageFromUrl({
        kind: "person-photo",
        url: "http://[::1]/logo.png",
      }),
    ).rejects.toThrow("Image URL host is not allowed");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.uploadObject).not.toHaveBeenCalled();
  });

  it("rejects hostnames that resolve to private addresses", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    mocks.lookup.mockResolvedValueOnce([{ address: "10.0.0.4", family: 4 }]);

    await expect(
      uploadImageFromUrl({
        kind: "organization-wordmark-logo",
        url: "https://images.example.org/logo.png",
      }),
    ).rejects.toThrow("Image URL host is not allowed");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.uploadObject).not.toHaveBeenCalled();
  });

  it("rejects non-image responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("hello", {
          headers: { "content-type": "text/html" },
          status: 200,
        }),
      ),
    );

    await expect(
      uploadImageFromUrl({
        kind: "organization-square-logo",
        url: "https://example.org/logo",
      }),
    ).rejects.toThrow("Remote URL must return a supported image type");

    expect(mocks.uploadObject).not.toHaveBeenCalled();
  });
});
