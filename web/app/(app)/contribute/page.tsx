"use client";

import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/store/language-store";
import { BookOpen, ChevronLeft, FileText, Gift, Mic, Shield } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SuccessBanner, type BountyTarget, type Category, type Flow } from "./_components/shared";
import { BountiesView } from "./_flows/bounties-view";
import { BulkFlow } from "./_flows/bulk-flow";
import { LessonFlow } from "./_flows/lesson-flow";
import { ReviewerFlow } from "./_flows/reviewer-flow";
import { WordFlow } from "./_flows/word-flow";

function ContributePageContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [activeFlow, setActiveFlow] = useState<Flow | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bountyTarget, setBountyTarget] = useState<BountyTarget | null>(null);
  const { setLanguage } = useLanguageStore();
  const appliedParams = useRef(false);

  function handleDone(msg?: string) {
    setActiveFlow(null);
    setBountyTarget(null);
    setSuccess(msg ?? t("contribute.submittedSuccess"));
  }

  function handleBountyContribute(target: BountyTarget) {
    setLanguage(target.languageId);
    setBountyTarget(target);
    setActiveFlow("word");
  }

  // Open the word flow pre-targeted when arriving from a bounty deep link
  // (e.g. /contribute?bountyId=…&languageId=…&category=…), or jump straight
  // into a named flow (e.g. /contribute?flow=reviewer — used when Studio
  // redirects a signed-in user with no admin/reviewer access here).
  useEffect(() => {
    if (appliedParams.current) return;
    const bountyId = searchParams.get("bountyId");
    const languageId = searchParams.get("languageId");
    const flow = searchParams.get("flow");
    if (bountyId && languageId) {
      appliedParams.current = true;
      handleBountyContribute({
        id: bountyId,
        languageId,
        category: searchParams.get("category") ?? undefined,
      });
    } else if (flow && (["word", "bulk", "lesson", "bounties", "reviewer"] as const).includes(flow as Flow)) {
      appliedParams.current = true;
      setActiveFlow(flow as Flow);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const hubCards = [
    {
      flow: "word" as Flow,
      icon: Mic,
      title: t("contribute.wordOrPhrase"),
      description: t("contribute.wordOrPhraseDesc"),
      colorCls: "border-brand-200 dark:border-brand-900 hover:border-brand-400",
      iconBg: "bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400",
    },
    {
      flow: "bulk" as Flow,
      icon: FileText,
      title: t("contribute.bulkWords"),
      description: t("contribute.bulkWordsDesc"),
      colorCls: "border-green-200 dark:border-green-900 hover:border-green-400",
      iconBg: "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400",
    },
    {
      flow: "lesson" as Flow,
      icon: BookOpen,
      title: t("contribute.fullLesson"),
      description: t("contribute.fullLessonDesc"),
      colorCls: "border-purple-200 dark:border-purple-900 hover:border-purple-400",
      iconBg: "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400",
    },
    {
      flow: "bounties" as Flow,
      icon: Gift,
      title: t("contribute.activeBounties"),
      description: t("contribute.activeBountiesDesc"),
      colorCls: "border-amber-200 dark:border-amber-900 hover:border-amber-400",
      iconBg: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
    },
    {
      flow: "reviewer" as Flow,
      icon: Shield,
      title: "Become a Reviewer",
      description: "Apply to review community contributions and help maintain content quality.",
      colorCls: "border-indigo-200 dark:border-indigo-900 hover:border-indigo-400",
      iconBg: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      {!activeFlow && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t("contribute.title")}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            {t("contribute.hubSubtitle")}
          </p>
        </div>
      )}

      {success && <SuccessBanner message={success} onClose={() => setSuccess(null)} />}

      {/* Hub */}
      {!activeFlow && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {hubCards.map(({ flow, icon: Icon, title, description, colorCls, iconBg }) => (
            <button
              key={flow}
              onClick={() => setActiveFlow(flow)}
              className={cn(
                "text-left rounded-2xl border-2 bg-white dark:bg-neutral-900 p-5 transition-all hover:shadow-md",
                colorCls
              )}
            >
              <div className={cn("inline-flex items-center justify-center rounded-xl p-3 mb-3", iconBg)}>
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="font-bold text-neutral-900 dark:text-white mb-1">{title}</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{description}</p>
            </button>
          ))}
        </div>
      )}

      {/* Active flows */}
      {activeFlow === "word" && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          <WordFlow
            onDone={() => handleDone()}
            bountyId={bountyTarget?.id}
            initialLangId={bountyTarget?.languageId}
            initialCategory={bountyTarget?.category as Category | undefined}
          />
        </div>
      )}

      {activeFlow === "bulk" && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 overflow-x-auto">
          <BulkFlow onDone={() => handleDone(t("contribute.submittedBulkSuccess"))} />
        </div>
      )}

      {activeFlow === "lesson" && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          <LessonFlow onDone={() => handleDone(t("contribute.submittedLessonSuccess"))} />
        </div>
      )}

      {activeFlow === "bounties" && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setActiveFlow(null)}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-500"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="font-bold text-neutral-900 dark:text-white">{t("contribute.activeBounties")}</h2>
          </div>
          <BountiesView onContribute={handleBountyContribute} />
        </div>
      )}

      {activeFlow === "reviewer" && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
          <ReviewerFlow onBack={() => setActiveFlow(null)} />
        </div>
      )}

      {/* Back to hub when in a flow */}
      {activeFlow && activeFlow !== "bounties" && activeFlow !== "reviewer" && (
        <button
          onClick={() => setActiveFlow(null)}
          className="mt-4 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
        >
          {t("contribute.backToHub")}
        </button>
      )}
    </div>
  );
}

export default function ContributePage() {
  return (
    <Suspense>
      <ContributePageContent />
    </Suspense>
  );
}
