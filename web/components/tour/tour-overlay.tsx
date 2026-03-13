"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTourStore, TOUR_STEPS } from "@/store/tour-store";
import { cn } from "@/lib/utils";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8; // spotlight padding around target

function useTargetRect(targetId: string | null, stepIndex: number): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    if (!targetId) {
      setRect(null);
      return;
    }

    const measure = () => {
      const el = document.querySelector(`[data-tour="${targetId}"]`);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top - PADDING,
        left: r.left - PADDING,
        width: r.width + PADDING * 2,
        height: r.height + PADDING * 2,
      });
    };

    // Small delay so the DOM has settled (e.g. after route change)
    const id = setTimeout(measure, 60);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(id);
      window.removeEventListener("resize", measure);
    };
  }, [targetId, stepIndex]);

  return rect;
}

function TooltipCard({
  title,
  description,
  stepIndex,
  total,
  placement,
  rect,
  onNext,
  onSkip,
}: {
  title: string;
  description: string;
  stepIndex: number;
  total: number;
  placement?: "right" | "bottom" | "left" | "top";
  rect: Rect | null;
  onNext: () => void;
  onSkip: () => void;
}) {
  const isLast = stepIndex === total - 1;
  const isFirst = stepIndex === 0;

  // For centered steps (no target) render a modal card
  if (!rect) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-sm p-6">
          <CardBody
            title={title}
            description={description}
            stepIndex={stepIndex}
            total={total}
            isLast={isLast}
            isFirst={isFirst}
            onNext={onNext}
            onSkip={onSkip}
          />
        </div>
      </div>
    );
  }

  // Positioned tooltip relative to spotlight rect
  const GAP = 12;
  let style: React.CSSProperties = {};
  const CARD_WIDTH = 280;

  switch (placement) {
    case "right":
      style = {
        top: rect.top + rect.height / 2,
        left: rect.left + rect.width + GAP,
        transform: "translateY(-50%)",
        width: CARD_WIDTH,
      };
      break;
    case "left":
      style = {
        top: rect.top + rect.height / 2,
        left: rect.left - CARD_WIDTH - GAP,
        transform: "translateY(-50%)",
        width: CARD_WIDTH,
      };
      break;
    case "bottom":
      style = {
        top: rect.top + rect.height + GAP,
        left: rect.left,
        width: CARD_WIDTH,
      };
      break;
    case "top":
    default:
      style = {
        top: rect.top - GAP,
        left: rect.left,
        transform: "translateY(-100%)",
        width: CARD_WIDTH,
      };
  }

  return (
    <div
      className="fixed z-[60] pointer-events-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 p-5"
      style={style}
    >
      {/* Arrow pointing toward spotlight */}
      {placement === "right" && (
        <span
          className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0"
          style={{
            borderTop: "8px solid transparent",
            borderBottom: "8px solid transparent",
            borderRight: "8px solid white",
          }}
        />
      )}
      <CardBody
        title={title}
        description={description}
        stepIndex={stepIndex}
        total={total}
        isLast={isLast}
        isFirst={isFirst}
        onNext={onNext}
        onSkip={onSkip}
      />
    </div>
  );
}

function CardBody({
  title,
  description,
  stepIndex,
  total,
  isLast,
  isFirst,
  onNext,
  onSkip,
}: {
  title: string;
  description: string;
  stepIndex: number;
  total: number;
  isLast: boolean;
  isFirst: boolean;
  onNext: () => void;
  onSkip: () => void;
}) {
  return (
    <>
      <p className="font-bold text-neutral-900 dark:text-white text-base leading-snug mb-1.5">
        {title}
      </p>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-4">
        {description}
      </p>

      {/* Dot progress */}
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "rounded-full transition-all",
              i === stepIndex
                ? "w-4 h-1.5 bg-brand-500"
                : "w-1.5 h-1.5 bg-neutral-200 dark:bg-neutral-700"
            )}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        {!isLast && (
          <button
            onClick={onSkip}
            className="text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            Skip tour
          </button>
        )}
        <button
          onClick={onNext}
          className="ml-auto px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          {isLast ? "Get started →" : "Next →"}
        </button>
      </div>
    </>
  );
}

export function TourOverlay() {
  const { active, stepIndex, next, skip } = useTourStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const step = TOUR_STEPS[stepIndex];
  const rect = useTargetRect(step?.target ?? null, stepIndex);

  // Lock scroll while tour is active
  useEffect(() => {
    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [active]);

  if (!active || !step || !mounted) return null;

  return createPortal(
    <>
      {/* Dark scrim — punchout handled by the spotlight box */}
      <div
        className="fixed inset-0 z-50 transition-all duration-300"
        style={{ background: "rgba(0,0,0,0.55)" }}
        onClick={next}
      />

      {/* Spotlight cutout */}
      {rect && (
        <div
          className="fixed z-50 rounded-xl pointer-events-none transition-all duration-300"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
            background: "transparent",
          }}
        />
      )}

      {/* Tooltip */}
      <TooltipCard
        title={step.title}
        description={step.description}
        stepIndex={stepIndex}
        total={TOUR_STEPS.length}
        placement={step.placement}
        rect={rect}
        onNext={next}
        onSkip={skip}
      />
    </>,
    document.body
  );
}
