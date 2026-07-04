"use client";

import { useMe } from "@/lib/hooks/use-me";
import { WEB_TOUR_REGISTRY, type WebTourAudience, type WebTourId } from "@/lib/tours/web-tour-registry";
import { useTourStore } from "@/store/tour-store";
import type { UserMe } from "@/types";
import { Check, ChevronDown, Circle, ExternalLink, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ChecklistStep {
  id: WebTourId;
  title: string;
  description: string;
  route: string;
  audience: WebTourAudience;
}

const DYNAMIC_ROUTE_FALLBACK: Partial<Record<WebTourId, string>> = {
  // No dynamic routes in the new action-specific registry
};

function canSeeAudience(audience: WebTourAudience, me?: UserMe): boolean {
  if (audience === "all") return true;
  if (!me) return false;
  if (audience === "admin") return me.isAdmin;
      if (audience === "educator") return me.isReviewer; // educators are reviewers
  return false;
}

function routeToHref(route: string, id: WebTourId): string {
  if (!route.includes("[")) return route;
  return DYNAMIC_ROUTE_FALLBACK[id] ?? "/learn";
}

function audienceLabel(audience: WebTourAudience): string {
  if (audience === "admin") return "Admin";
  if (audience === "educator") return "Educator";
  return "Core";
}

export function TourFloatingButton() {
  const { completedStepIds, markStepsCompleted, finishSteps } = useTourStore();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const { data: me, refetch: refetchMe } = useMe();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Refetch when popover opens
  useEffect(() => {
    if (!isOpen) return;
    refetchMe();
  }, [isOpen, refetchMe]);

  // Auto-detect action completions based on user progress
  useEffect(() => {
    if (!me || !isOpen || me.points === 0) return;

    const toAutoComplete: WebTourId[] = [];

    // "Complete one lesson" → streak > 0 = completed at least one lesson today
    if (me.streak > 0 && !completedStepIds.includes("completeOneLesson")) {
      toAutoComplete.push("completeOneLesson");
    }

    // "Listen to audio" → points > 5 indicates some listening activity
    if (me.points > 5 && !completedStepIds.includes("listenToAudio")) {
      toAutoComplete.push("listenToAudio");
    }

    // "Check profile" → automatically complete when user has points (they'll naturally check it)
    if (me.points > 0 && !completedStepIds.includes("exploreProfile")) {
      toAutoComplete.push("exploreProfile");
    }

    if (toAutoComplete.length > 0) {
      markStepsCompleted(toAutoComplete);
    }
  }, [me, completedStepIds, isOpen, markStepsCompleted]);

  const visibleSteps = useMemo<ChecklistStep[]>(
    () =>
      Object.entries(WEB_TOUR_REGISTRY)
        .map(([id, def]) => ({
          id: id as WebTourId,
          title: def.title,
          description: def.description,
          route: routeToHref(def.route, id as WebTourId),
          audience: def.audience,
        }))
        .filter((step) => canSeeAudience(step.audience, me)),
    [me]
  );

  const pendingCount = visibleSteps.filter((step) => !completedStepIds.includes(step.id)).length;

  const grouped = useMemo(
    () =>
      (["all", "admin", "educator"] as const)
        .map((audience) => ({
          audience,
          label: audienceLabel(audience),
          items: visibleSteps.filter((step) => step.audience === audience),
        }))
        .filter((group) => group.items.length > 0),
    [visibleSteps]
  );

  // Close popover when clicking outside (but not on the modal itself)
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      // Don't close if clicking inside the container (button) or modal
      if (
        (containerRef.current && containerRef.current.contains(target)) ||
        (modalRef.current && modalRef.current.contains(target))
      ) {
        return;
      }
      setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!mounted || visibleSteps.length === 0 || pendingCount === 0) return null;

  return (
    <>
      <div ref={containerRef} className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative inline-flex items-center gap-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 shadow-lg transition-all hover:shadow-xl"
          aria-label="Open welcome checklist"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{pendingCount} tasks</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </button>

        {isOpen &&
          createPortal(
            <div ref={modalRef} className="fixed bottom-24 right-6 z-50 max-w-md">
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden">
                <header className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Welcome Checklist
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {pendingCount} tasks remaining
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-lg p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                    aria-label="Close checklist"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </header>

                <div className="max-h-96 overflow-y-auto px-4 py-3 space-y-3">
                  {grouped.map((group) => (
                    <div key={group.audience}>
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                        {group.label}
                      </p>
                      <div className="space-y-1.5">
                        {group.items.map((item) => {
                          const done = completedStepIds.includes(item.id);
                          return (
                            <div
                              key={item.id}
                              className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40 px-2.5 py-2"
                            >
                              <div className="flex items-start gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!done) markStepsCompleted([item.id]);
                                  }}
                                  className="mt-0.5 text-neutral-500 hover:text-brand-600 dark:text-neutral-400 dark:hover:text-brand-300 transition-colors flex-shrink-0"
                                  aria-label={done ? "Completed" : "Mark complete"}
                                >
                                  {done ? (
                                    <Check className="h-3.5 w-3.5" />
                                  ) : (
                                    <Circle className="h-3.5 w-3.5" />
                                  )}
                                </button>

                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-neutral-900 dark:text-white">
                                    {item.title}
                                  </p>
                                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                                    {item.description}
                                  </p>
                                  <div className="mt-1.5">
                                    <Link
                                      href={item.route}
                                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-200"
                                    >
                                      Go
                                      <ExternalLink className="h-3 w-3" />
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <footer className="px-4 py-2.5 border-t border-neutral-200 dark:border-neutral-700 flex gap-2">
                  <button
                    type="button"
                    onClick={() => finishSteps(visibleSteps.map((step) => step.id))}
                    className="flex-1 text-xs font-semibold px-2 py-1.5 rounded-lg bg-brand-100 text-brand-700 hover:bg-brand-200 dark:bg-brand-500/20 dark:text-brand-300 dark:hover:bg-brand-500/30 transition-colors"
                  >
                    Mark all done
                  </button>
                </footer>
              </div>
            </div>,
            document.body
          )}
      </div>
    </>
  );
}
