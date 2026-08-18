"use client";

import { useState } from "react";
import { Check, Download, ShoppingCart } from "lucide-react";

type ShirtSize = "S" | "M" | "L" | "XL" | "XXL";
type ShirtColor = "black" | "white";
type DonationTier = "25" | "35" | "50" | "100" | "custom";

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

export function ShirtOrderForm({ handle }: { handle: string }) {
  const [size, setSize] = useState<ShirtSize>("L");
  const [color, setColor] = useState<ShirtColor>("black");
  const [tier, setTier] = useState<DonationTier>("35");
  const [customAmount, setCustomAmount] = useState("50");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        body: JSON.stringify({
          custom_amount:
            tier === "custom" ? Number.parseFloat(customAmount) : undefined,
          donation_tier: tier,
          handle,
          order_type: "shirt",
          shirt_color: color,
          shirt_size: size,
          sourceReferrer: document.referrer,
          sourceUrl: window.location.href,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as { error?: string; url?: string };

      if (!response.ok || !result.url) {
        throw new Error(result.error ?? "Could not start checkout.");
      }

      window.location.href = result.url;
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not start checkout.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <div className="border-2 border-foreground bg-background p-5">
      <h2 className="text-lg font-black uppercase leading-tight">Order one</h2>
      <div className="mt-4 grid gap-4">
        <label className="grid gap-2 text-sm font-black uppercase">
          Size
          <select
            className="w-full border-2 border-foreground bg-background px-3 py-2 text-base font-black text-foreground"
            value={size}
            onChange={(event) => setSize(event.target.value as ShirtSize)}
          >
            {["S", "M", "L", "XL", "XXL"].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-black uppercase">
          Color
          <select
            className="w-full border-2 border-foreground bg-background px-3 py-2 text-base font-black text-foreground"
            value={color}
            onChange={(event) => setColor(event.target.value as ShirtColor)}
          >
            <option value="black">Black</option>
            <option value="white">White</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-black uppercase">
          Total contribution
          <select
            className="w-full border-2 border-foreground bg-background px-3 py-2 text-base font-black text-foreground"
            value={tier}
            onChange={(event) => setTier(event.target.value as DonationTier)}
          >
            <option value="25">$25</option>
            <option value="35">$35</option>
            <option value="50">$50</option>
            <option value="100">$100</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        {tier === "custom" ? (
          <label className="grid gap-2 text-sm font-black uppercase">
            Custom total
            <input
              className="w-full border-2 border-foreground bg-background px-3 py-2 text-base font-black text-foreground"
              min="25"
              step="1"
              type="number"
              value={customAmount}
              onChange={(event) => setCustomAmount(event.target.value)}
            />
          </label>
        ) : null}
      </div>
      <p className="mt-4 text-sm font-bold leading-relaxed text-muted-foreground">
        Your contribution above the $15 shirt fair market value is
        tax-deductible.
      </p>
      {error ? (
        <p className="mt-3 text-sm font-black uppercase text-foreground">
          {error}
        </p>
      ) : null}
      <button
        className="mt-4 inline-flex w-full items-center justify-center gap-2 border-2 border-foreground bg-foreground px-4 py-3 text-sm font-black uppercase text-background transition-colors hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="button"
        onClick={() => {
          void handleSubmit();
        }}
      >
        <ShoppingCart className="h-4 w-4" aria-hidden="true" />
        {isSubmitting ? "Opening checkout" : "Order one"}
      </button>
    </div>
  );
}
