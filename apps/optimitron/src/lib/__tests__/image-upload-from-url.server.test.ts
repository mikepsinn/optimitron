import { EventEmitter } from "node:events";
import type { IncomingMessage } from "node:http";
import { Readable } from "node:stream";
import sharp from "sharp";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ImageUploadKind } from "../image-upload-types";

const ORG_SQUARE_LOGO_KIND =
  "organization-square-logo" satisfies ImageUploadKind;
const ORG_WORDMARK_LOGO_KIND =
  "organization-wordmark-logo" satisfies ImageUploadKind;
const PERSON_PHOTO_KIND = "person-photo" satisfies ImageUploadKind;

const mocks = vi.hoisted(() => ({
  httpRequest: vi.fn(),
  httpsRequest: vi.fn(),
  lookup: vi.fn(),
  uploadObject: vi.fn(),
}));

vi.mock("node:dns/promises", () => ({
  lookup: mocks.lookup,
}));

vi.mock("node:http", async () => {
  const actual = await vi.importActual<typeof import("node:http")>("node:http");
  return {
    ...actual,
    request: mocks.httpRequest,
  };
});

vi.mock("node:https", async () => {
  const actual =
    await vi.importActual<typeof import("node:https")>("node:https");
  return {
    ...actual,
    request: mocks.httpsRequest,
  };
});

vi.mock("../object-storage.server", () => ({
  uploadObject: mocks.uploadObject,
}));

import { uploadImageFromUrl } from "../image-upload-from-url.server";

beforeEach(() => {
  mocks.httpRequest.mockReset();
  mocks.httpsRequest.mockReset();
  mocks.lookup.mockReset();
  mocks.uploadObject.mockReset();
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

function responseFromBody(
  body: Buffer | string | null,
  {
    headers = {},
    status = 200,
  }: { headers?: Record<string, string>; status?: number } = {},
) {
  const stream = Readable.from(body === null ? [] : [body]) as IncomingMessage;
  stream.statusCode = status;
  stream.headers = headers;
  return stream;
}

type StubRequest = EventEmitter & {
  destroy(error?: Error): void;
  end(): void;
  setTimeout(timeout: number, callback: () => void): void;
};

function requestStub(onEnd: (request: StubRequest) => void) {
  const request = new EventEmitter() as StubRequest;
  request.destroy = (error?: Error) => {
    if (error) request.emit("error", error);
  };
  request.end = () => {
    onEnd(request);
  };
  request.setTimeout = () => undefined;
  return request;
}

function mockHttpsResponse(response: IncomingMessage) {
  mocks.httpsRequest.mockImplementationOnce((_options, responseHandler) =>
    requestStub(() => {
      responseHandler(response);
    }),
  );
}

function mockHttpsError(error: Error) {
  mocks.httpsRequest.mockImplementationOnce(() =>
    requestStub((request) => {
      request.emit("error", error);
    }),
  );
}

describe("uploadImageFromUrl", () => {
  it("fetches, normalizes, and uploads public organization images", async () => {
    const image = await tinyPng();
    mockHttpsResponse(
      responseFromBody(image, {
        headers: {
          "content-length": String(image.byteLength),
          "content-type": "image/png",
        },
      }),
    );

    const result = await uploadImageFromUrl({
      filename: "Institute logo.png",
      kind: ORG_SQUARE_LOGO_KIND,
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
    expect(mocks.httpsRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "image/webp,image/png,image/jpeg,image/gif,*/*;q=0.8",
          Host: "example.org",
        }),
        hostname: "93.184.216.34",
        path: "/assets/logo.png",
        servername: "example.org",
      }),
      expect.any(Function),
    );
    expect(mocks.uploadObject).toHaveBeenCalledWith(
      expect.objectContaining({
        contentType: "image/webp",
        key: result.key,
      }),
    );
  });

  it("rejects local/private hosts before fetching", async () => {
    await expect(
      uploadImageFromUrl({
        kind: ORG_SQUARE_LOGO_KIND,
        url: "http://127.0.0.1/logo.png",
      }),
    ).rejects.toThrow("Image URL host is not allowed");

    expect(mocks.httpRequest).not.toHaveBeenCalled();
    expect(mocks.httpsRequest).not.toHaveBeenCalled();
    expect(mocks.uploadObject).not.toHaveBeenCalled();
  });

  it("rejects bracketed IPv6 loopback URLs before fetching", async () => {
    await expect(
      uploadImageFromUrl({
        kind: PERSON_PHOTO_KIND,
        url: "http://[::1]/logo.png",
      }),
    ).rejects.toThrow("Image URL host is not allowed");

    expect(mocks.httpRequest).not.toHaveBeenCalled();
    expect(mocks.httpsRequest).not.toHaveBeenCalled();
    expect(mocks.uploadObject).not.toHaveBeenCalled();
  });

  it("rejects IPv6 documentation-range URLs before fetching", async () => {
    await expect(
      uploadImageFromUrl({
        kind: PERSON_PHOTO_KIND,
        url: "http://[2001:db8::1]/logo.png",
      }),
    ).rejects.toThrow("Image URL host is not allowed");

    expect(mocks.httpRequest).not.toHaveBeenCalled();
    expect(mocks.httpsRequest).not.toHaveBeenCalled();
    expect(mocks.uploadObject).not.toHaveBeenCalled();
  });

  it("rejects hostnames that resolve to private addresses", async () => {
    mocks.lookup.mockResolvedValueOnce([{ address: "10.0.0.4", family: 4 }]);

    await expect(
      uploadImageFromUrl({
        kind: ORG_WORDMARK_LOGO_KIND,
        url: "https://images.example.org/logo.png",
      }),
    ).rejects.toThrow("Image URL host is not allowed");

    expect(mocks.httpRequest).not.toHaveBeenCalled();
    expect(mocks.httpsRequest).not.toHaveBeenCalled();
    expect(mocks.uploadObject).not.toHaveBeenCalled();
  });

  it("rejects non-image responses", async () => {
    mockHttpsResponse(
      responseFromBody("hello", {
        headers: { "content-type": "text/html" },
      }),
    );

    await expect(
      uploadImageFromUrl({
        kind: ORG_SQUARE_LOGO_KIND,
        url: "https://example.org/logo",
      }),
    ).rejects.toThrow("Remote URL must return a supported image type");

    expect(mocks.uploadObject).not.toHaveBeenCalled();
  });

  it("rejects non-OK HTTP responses", async () => {
    mockHttpsResponse(
      responseFromBody(null, {
        headers: { "content-type": "image/png" },
        status: 404,
      }),
    );

    await expect(
      uploadImageFromUrl({
        kind: ORG_SQUARE_LOGO_KIND,
        url: "https://example.org/missing-logo.png",
      }),
    ).rejects.toThrow("Image URL returned HTTP 404");

    expect(mocks.uploadObject).not.toHaveBeenCalled();
  });

  it("propagates request network errors", async () => {
    mockHttpsError(new TypeError("network error"));

    await expect(
      uploadImageFromUrl({
        kind: ORG_SQUARE_LOGO_KIND,
        url: "https://example.org/logo.png",
      }),
    ).rejects.toThrow("network error");

    expect(mocks.uploadObject).not.toHaveBeenCalled();
  });
});
