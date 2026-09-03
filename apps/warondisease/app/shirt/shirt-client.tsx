"use client";

import { useState } from "react";
import { Check, Download } from "lucide-react";

type DownloadState = "downloaded" | "error" | "idle";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => {
      image.onload = null;
      image.onerror = null;
      reject(new Error("Timed out rendering shirt artwork."));
    }, 2500);

    image.decoding = "async";
    image.onload = () => {
      window.clearTimeout(timeout);
      resolve(image);
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("Could not render shirt artwork."));
    };
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("Could not export shirt artwork."));
    }, "image/png");
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getSvgFallbackFilename(filename: string) {
  return filename.replace(/\.[^.]+$/, ".svg");
}

function getSvgSize(svg: SVGSVGElement) {
  const width = Number(svg.getAttribute("width"));
  const height = Number(svg.getAttribute("height"));

  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return { width, height };
  }

  const { width: viewBoxWidth, height: viewBoxHeight } = svg.viewBox.baseVal;
  return {
    width: Math.max(1, Math.round(viewBoxWidth || svg.clientWidth || 2400)),
    height: Math.max(1, Math.round(viewBoxHeight || svg.clientHeight || 3000)),
  };
}

export function ShirtDownloadImageButton({
  filename,
  sourceId,
}: {
  filename: string;
  sourceId: string;
}) {
  const [state, setState] = useState<DownloadState>("idle");

  async function handleDownload() {
    const source = document.getElementById(sourceId);

    if (!(source instanceof SVGSVGElement)) {
      setState("error");
      window.setTimeout(() => setState("idle"), 2000);
      return;
    }

    const clone = source.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const { width, height } = getSvgSize(source);
    const svgText = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgText], {
      type: "image/svg+xml;charset=utf-8",
    });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
      const image = await loadImage(svgUrl);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Could not prepare shirt artwork.");
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      const pngBlob = await canvasToBlob(canvas);
      downloadBlob(pngBlob, filename);
      setState("downloaded");
      window.setTimeout(() => setState("idle"), 1500);
    } catch {
      downloadBlob(svgBlob, getSvgFallbackFilename(filename));
      setState("downloaded");
      window.setTimeout(() => setState("idle"), 1500);
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  }

  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-2 border-2 border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-background transition-colors hover:bg-background hover:text-foreground"
      onClick={() => {
        void handleDownload();
      }}
    >
      {state === "downloaded" ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Download className="h-4 w-4" aria-hidden="true" />
      )}
      {state === "downloaded"
        ? "Downloaded"
        : state === "error"
          ? "Download failed"
          : "Download back image"}
    </button>
  );
}
