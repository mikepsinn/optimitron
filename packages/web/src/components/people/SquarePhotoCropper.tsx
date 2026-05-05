"use client";

import * as ReactDialog from "@radix-ui/react-dialog";
import { Check, X } from "lucide-react";
import type {
  ChangeEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useEffect, useRef, useState } from "react";

const OUTPUT_SIZE = 1024;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

interface SquarePhotoCropperProps {
  file: File;
  onCancel: () => void;
  onCrop: (file: File) => Promise<void> | void;
  title?: string;
}

interface Point {
  x: number;
  y: number;
}

interface Size {
  height: number;
  width: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function croppedFileName(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");
  const baseName =
    dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName || "portrait";
  return `${baseName}-square.jpg`;
}

function getFit(naturalSize: Size, frameSize: number, zoom: number) {
  const baseScale = Math.max(
    frameSize / naturalSize.width,
    frameSize / naturalSize.height,
  );
  const scale = baseScale * zoom;
  return {
    height: naturalSize.height * scale,
    scale,
    width: naturalSize.width * scale,
  };
}

function getMaxOffset(naturalSize: Size, frameSize: number, zoom: number) {
  const fit = getFit(naturalSize, frameSize, zoom);
  return {
    x: Math.max(0, (fit.width - frameSize) / 2),
    y: Math.max(0, (fit.height - frameSize) / 2),
  };
}

export function SquarePhotoCropper({
  file,
  onCancel,
  onCrop,
  title = "Crop photo",
}: SquarePhotoCropperProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    start: Point;
    startPosition: Point;
  } | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [naturalSize, setNaturalSize] = useState<Size | null>(null);
  const [frameSize, setFrameSize] = useState(0);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [isDragging, setIsDragging] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setNaturalSize(null);
    setPosition({ x: 0, y: 0 });
    setZoom(MIN_ZOOM);
    setError(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const measure = () => {
      setFrameSize(frame.getBoundingClientRect().width);
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  function clampPosition(nextPosition: Point, nextZoom = zoom) {
    if (!naturalSize || frameSize <= 0) return { x: 0, y: 0 };
    const maxOffset = getMaxOffset(naturalSize, frameSize, nextZoom);
    return {
      x: clamp(nextPosition.x, -maxOffset.x, maxOffset.x),
      y: clamp(nextPosition.y, -maxOffset.y, maxOffset.y),
    };
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!naturalSize || isCropping) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      startPosition: position,
    };
    setIsDragging(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const nextPosition = {
      x: drag.startPosition.x + event.clientX - drag.start.x,
      y: drag.startPosition.y + event.clientY - drag.start.y,
    };
    setPosition(clampPosition(nextPosition));
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      setIsDragging(false);
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // The pointer may already be released if the browser cancelled it.
      }
    }
  }

  function handleZoomChange(event: ChangeEvent<HTMLInputElement>) {
    const nextZoom = Number(event.currentTarget.value);
    setZoom(nextZoom);
    setPosition((current) => clampPosition(current, nextZoom));
  }

  async function handleCrop() {
    const image = imageRef.current;
    if (!image || !naturalSize || frameSize <= 0) {
      setError("Could not read this image.");
      return;
    }

    setIsCropping(true);
    setError(null);
    try {
      const fit = getFit(naturalSize, frameSize, zoom);
      const imageLeft = frameSize / 2 + position.x - fit.width / 2;
      const imageTop = frameSize / 2 + position.y - fit.height / 2;
      const sourceSize = Math.min(
        frameSize / fit.scale,
        naturalSize.width,
        naturalSize.height,
      );
      const sx = clamp(
        -imageLeft / fit.scale,
        0,
        Math.max(0, naturalSize.width - sourceSize),
      );
      const sy = clamp(
        -imageTop / fit.scale,
        0,
        Math.max(0, naturalSize.height - sourceSize),
      );
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not crop this image.");

      context.fillStyle = "#fff";
      context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(
        image,
        sx,
        sy,
        sourceSize,
        sourceSize,
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
      await onCrop(
        new File([blob], croppedFileName(file.name), {
          lastModified: Date.now(),
          type: "image/jpeg",
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

  const fit =
    naturalSize && frameSize > 0 ? getFit(naturalSize, frameSize, zoom) : null;

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

        <div
          className="relative mt-5 aspect-square w-full touch-none overflow-hidden border border-foreground bg-card"
          onPointerCancel={endDrag}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          ref={frameRef}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="absolute left-1/2 top-1/2 max-w-none select-none"
              draggable={false}
              onError={() => setError("Could not read this image.")}
              onLoad={(event) =>
                setNaturalSize({
                  height: event.currentTarget.naturalHeight,
                  width: event.currentTarget.naturalWidth,
                })
              }
              ref={imageRef}
              src={imageUrl}
              style={
                fit
                  ? {
                      height: `${fit.height}px`,
                      transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
                      width: `${fit.width}px`,
                    }
                  : undefined
              }
            />
          ) : null}
        </div>

        <label className="mt-4 block text-xs font-black uppercase tracking-[0.14em]">
          Zoom
          <input
            className="mt-2 block w-full accent-foreground"
            disabled={!naturalSize || isCropping}
            max={MAX_ZOOM}
            min={MIN_ZOOM}
            onChange={handleZoomChange}
            step={0.01}
            type="range"
            value={zoom}
          />
        </label>

        <p className="mt-3 text-sm font-bold text-muted-foreground">
          Drag to reposition. Use the slider to zoom.
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
            disabled={!naturalSize || isCropping}
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
