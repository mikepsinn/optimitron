"use client";

import * as ReactDialog from "@radix-ui/react-dialog";
import { Check, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";

const OUTPUT_SIZE = 1024;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

interface SquarePhotoCropperProps {
  file: File;
  onCancel: () => void;
  onCrop: (file: File) => Promise<void> | void;
  title?: string;
}

function croppedFileName(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  const baseName =
    dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName || "portrait";
  return `${baseName}-square.jpg`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("Could not read this image.")),
    );
    image.src = src;
  });
}

function cssVariableColor(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

async function cropImageToFile(input: {
  area: Area;
  fileName: string;
  imageUrl: string;
}): Promise<File> {
  const image = await loadImage(input.imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not crop this image.");

  context.fillStyle = cssVariableColor("--treaty-paper", "white");
  context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    input.area.x,
    input.area.y,
    input.area.width,
    input.area.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("Could not crop this image."));
        }
      },
      "image/jpeg",
      0.92,
    );
  });

  return new File([blob], croppedFileName(input.fileName), {
    lastModified: Date.now(),
    type: "image/jpeg",
  });
}

export function SquarePhotoCropper({
  file,
  onCancel,
  onCrop,
  title = "Crop photo",
}: SquarePhotoCropperProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setCrop({ x: 0, y: 0 });
    setZoom(MIN_ZOOM);
    setCroppedAreaPixels(null);
    setError(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, nextCroppedAreaPixels: Area) => {
      setCroppedAreaPixels(nextCroppedAreaPixels);
    },
    [],
  );

  async function handleCrop() {
    if (!imageUrl || !croppedAreaPixels) {
      setError("Could not read this image.");
      return;
    }

    setIsCropping(true);
    setError(null);
    try {
      await onCrop(
        await cropImageToFile({
          area: croppedAreaPixels,
          fileName: file.name,
          imageUrl,
        }),
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not crop this image.",
      );
    } finally {
      setIsCropping(false);
    }
  }

  return (
    <ReactDialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !isCropping) onCancel();
      }}
    >
      <ReactDialog.Portal>
        <ReactDialog.Overlay className="fixed inset-0 z-[120] bg-foreground/80" />
        <ReactDialog.Content className="fixed left-1/2 top-1/2 z-[121] max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-auto border border-foreground bg-background p-5 text-foreground shadow-none sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <ReactDialog.Title
              asChild
              className="text-2xl font-black uppercase leading-tight"
              id="square-photo-cropper-title"
            >
              <h2>{title}</h2>
            </ReactDialog.Title>
            <button
              aria-label="Cancel crop"
              className="inline-flex min-h-10 items-center border border-foreground bg-background px-3 text-foreground disabled:opacity-40"
              disabled={isCropping}
              onClick={onCancel}
              type="button"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="relative mt-5 aspect-square w-full overflow-hidden border border-foreground bg-card">
            {imageUrl ? (
              <Cropper
                aspect={1}
                crop={crop}
                cropShape="rect"
                image={imageUrl}
                maxZoom={MAX_ZOOM}
                minZoom={MIN_ZOOM}
                objectFit="cover"
                onCropChange={setCrop}
                onCropComplete={handleCropComplete}
                onZoomChange={setZoom}
                restrictPosition
                showGrid={false}
                style={{
                  cropAreaStyle: {
                    border: "1px solid var(--treaty-ink)",
                    boxShadow:
                      "0 0 0 9999px color-mix(in srgb, var(--treaty-ink) 35%, transparent)",
                  },
                }}
                zoom={zoom}
              />
            ) : null}
          </div>

          <label className="mt-4 block text-xs font-black uppercase tracking-[0.14em]">
            Zoom
            <input
              className="mt-2 block w-full accent-foreground"
              disabled={!imageUrl || isCropping}
              max={MAX_ZOOM}
              min={MIN_ZOOM}
              onChange={(event) => setZoom(Number(event.currentTarget.value))}
              step={0.01}
              type="range"
              value={zoom}
            />
          </label>

          <p className="mt-3 text-sm font-bold text-muted-foreground">
            Drag the photo to position it. Use the slider, mouse wheel, or pinch
            to zoom.
          </p>
          {error ? <p className="mt-3 text-sm font-black">{error}</p> : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              className="inline-flex min-h-12 items-center border border-foreground bg-background px-5 font-black uppercase tracking-[0.12em] text-foreground disabled:opacity-40"
              disabled={isCropping}
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex min-h-12 items-center border border-foreground bg-foreground px-5 font-black uppercase tracking-[0.12em] text-background disabled:opacity-40"
              disabled={!croppedAreaPixels || isCropping}
              onClick={() => void handleCrop()}
              type="button"
            >
              <Check className="mr-2 h-4 w-4" aria-hidden="true" />
              {isCropping ? "Saving" : "Save"}
            </button>
          </div>
        </ReactDialog.Content>
      </ReactDialog.Portal>
    </ReactDialog.Root>
  );
}
