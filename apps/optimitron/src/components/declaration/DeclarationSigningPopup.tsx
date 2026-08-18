"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import * as ReactDialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ChevronDown } from "lucide-react";
import { storage } from "@/lib/storage";
import {
  DeclarationBody,
  WHY_OPTIMIZATION_PARAGRAPHS,
} from "@/components/declaration/DeclarationContent";
import { DeclarationSignatureActions } from "@/components/declaration/DeclarationSignatureActions";

function WhyParagraph({ markdown }: { markdown: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="flex min-h-[80vh] items-center"
    >
      <div
        className={`w-full transition-all duration-700 ease-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => (
              <p className="text-center text-2xl leading-relaxed text-foreground [font-family:var(--v0-font-libre-baskerville)] [overflow-wrap:break-word] sm:text-3xl">
                {children}
              </p>
            ),
            a: ({ href, children }) => (
              <a
                href={href ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="font-black text-foreground"
              >
                {children}
              </a>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}

function clearDeclarationQueryParam() {
  if (typeof window === "undefined") return;

  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.delete("declaration");
  window.history.replaceState({}, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
}

export function DeclarationSigningPopup({
  forceOpen = false,
}: {
  forceOpen?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return forceOpen || !storage.getDeclarationSigned();
  });
  const paragraphRefs = useRef<(HTMLDivElement | null)[]>([]);
  const declarationRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentWhyIndex, setCurrentWhyIndex] = useState(0);
  const [showArrow, setShowArrow] = useState(true);

  useEffect(() => {
    if (pathname !== "/") {
      setOpen(false);
      return;
    }

    if (forceOpen) {
      setOpen(true);
    }
  }, [forceOpen, pathname]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Hide arrow when declaration divider is visible or at the bottom
      const decl = declarationRef.current;
      const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 60;
      let pastWhy = false;
      if (decl) {
        const declTop = decl.offsetTop;
        pastWhy = container.scrollTop + container.clientHeight > declTop;
      }
      setShowArrow(!pastWhy && !atBottom);

      let latest = 0;
      for (let i = 0; i < paragraphRefs.current.length; i++) {
        const el = paragraphRefs.current[i];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight * 0.6) {
            latest = i;
          }
        }
      }
      setCurrentWhyIndex(latest);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToNext = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const nextIndex = currentWhyIndex + 1;
    const target = nextIndex < WHY_OPTIMIZATION_PARAGRAPHS.length
      ? paragraphRefs.current[nextIndex]
      : declarationRef.current;

    if (!target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offset = targetRect.top - containerRect.top + container.scrollTop;

    container.scrollTo({
      top: offset - (container.clientHeight - target.clientHeight) / 2,
      behavior: "smooth",
    });
  };

  if (!open) return null;

  return (
    <ReactDialog.Root
      open={open}
      onOpenChange={() => {
        /* block dismiss */
      }}
    >
      <ReactDialog.Portal>
        <ReactDialog.Overlay className="fixed inset-0 z-[100] bg-black/90" />
        <ReactDialog.Content
          className="fixed inset-0 z-[100] flex w-screen max-w-[100vw] flex-col overflow-hidden bg-background"
          aria-describedby={undefined}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <VisuallyHidden>
            <ReactDialog.Title>Declaration of Optimization</ReactDialog.Title>
          </VisuallyHidden>

          {/* Scrollable body */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* WHY section — billboard style */}
            <div className="mx-auto box-border w-full max-w-xl px-6 [overflow-wrap:break-word] sm:px-8">
              {WHY_OPTIMIZATION_PARAGRAPHS.map((para, i) => (
                <div
                  key={i}
                  ref={(el) => { paragraphRefs.current[i] = el; }}
                >
                  <WhyParagraph markdown={para} />
                </div>
              ))}
            </div>

            {/* Divider */}
            <div ref={declarationRef} className="mx-auto max-w-3xl px-6 py-8 sm:px-8">
              <hr className="border-t-4 border-primary" />
            </div>

            {/* DECLARATION section — formal document style */}
            <div className="mx-auto max-w-3xl px-6 pb-8 sm:px-8">
              <DeclarationBody />
            </div>

            {/* Agree / Disagree — inline at the end of content */}
            <div className="mx-auto max-w-3xl px-6 py-16 sm:px-8">
              <DeclarationSignatureActions
                onSigned={() => {
                  clearDeclarationQueryParam();
                  setOpen(false);
                }}
                onDisagreed={() => {
                  clearDeclarationQueryParam();
                  setOpen(false);
                }}
                showStatusMessage={false}
              />
            </div>
          </div>
          {/* Fixed scroll arrow at bottom of viewport */}
          {showArrow && (
            <button
              onClick={scrollToNext}
              className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 animate-bounce cursor-pointer text-muted-foreground transition-opacity hover:text-foreground"
              aria-label="Next paragraph"
            >
              <ChevronDown className="h-10 w-10" />
            </button>
          )}
        </ReactDialog.Content>
      </ReactDialog.Portal>
    </ReactDialog.Root>
  );
}
