import { cn } from "@/lib/utils";

type Variant = "courses" | "words" | "feed" | "review" | "general";

const SVG: Record<Variant, React.ReactNode> = {
  courses: (
    <svg viewBox="0 0 120 100" className="w-32 h-28" fill="none" aria-hidden>
      <rect x="10" y="20" width="45" height="60" rx="6" fill="currentColor" className="text-brand-100 dark:text-brand-900/40" />
      <rect x="65" y="30" width="45" height="50" rx="6" fill="currentColor" className="text-brand-100 dark:text-brand-900/40" />
      <rect x="18" y="30" width="28" height="4" rx="2" fill="currentColor" className="text-brand-300 dark:text-brand-700" />
      <rect x="18" y="40" width="20" height="3" rx="1.5" fill="currentColor" className="text-neutral-200 dark:text-neutral-700" />
      <rect x="18" y="48" width="24" height="3" rx="1.5" fill="currentColor" className="text-neutral-200 dark:text-neutral-700" />
      <rect x="73" y="40" width="28" height="4" rx="2" fill="currentColor" className="text-brand-300 dark:text-brand-700" />
      <rect x="73" y="50" width="20" height="3" rx="1.5" fill="currentColor" className="text-neutral-200 dark:text-neutral-700" />
      <circle cx="60" cy="88" r="6" fill="currentColor" className="text-brand-400 dark:text-brand-600" />
      <rect x="57" y="85" width="6" height="6" rx="3" fill="currentColor" className="text-brand-400 dark:text-brand-600" />
    </svg>
  ),
  words: (
    <svg viewBox="0 0 120 100" className="w-32 h-28" fill="none" aria-hidden>
      <rect x="15" y="15" width="90" height="65" rx="8" fill="currentColor" className="text-brand-50 dark:text-brand-950/50" stroke="currentColor" strokeWidth="1.5" style={{ stroke: "var(--tw-text-opacity)" }} />
      <rect x="25" y="30" width="40" height="5" rx="2.5" fill="currentColor" className="text-brand-300 dark:text-brand-700" />
      <rect x="25" y="42" width="70" height="3" rx="1.5" fill="currentColor" className="text-neutral-200 dark:text-neutral-700" />
      <rect x="25" y="50" width="55" height="3" rx="1.5" fill="currentColor" className="text-neutral-200 dark:text-neutral-700" />
      <rect x="25" y="58" width="63" height="3" rx="1.5" fill="currentColor" className="text-neutral-200 dark:text-neutral-700" />
      <circle cx="95" cy="75" r="14" fill="currentColor" className="text-brand-500" />
      <path d="M90 75h10M95 70v10" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  feed: (
    <svg viewBox="0 0 120 100" className="w-32 h-28" fill="none" aria-hidden>
      <circle cx="60" cy="40" r="28" fill="currentColor" className="text-brand-100 dark:text-brand-900/30" />
      <circle cx="60" cy="40" r="18" fill="currentColor" className="text-brand-200 dark:text-brand-800/50" />
      <circle cx="60" cy="40" r="8" fill="currentColor" className="text-brand-400 dark:text-brand-600" />
      <rect x="20" y="78" width="80" height="4" rx="2" fill="currentColor" className="text-neutral-200 dark:text-neutral-700" />
      <rect x="35" y="88" width="50" height="4" rx="2" fill="currentColor" className="text-neutral-200 dark:text-neutral-700" />
    </svg>
  ),
  review: (
    <svg viewBox="0 0 120 100" className="w-32 h-28" fill="none" aria-hidden>
      <rect x="20" y="15" width="80" height="55" rx="8" fill="currentColor" className="text-green-100 dark:text-green-950/40" />
      <rect x="20" y="15" width="80" height="55" rx="8" stroke="currentColor" strokeWidth="1.5" className="text-green-200 dark:text-green-800" />
      <path d="M44 44l10 10 22-20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-500" />
      <rect x="25" y="80" width="70" height="4" rx="2" fill="currentColor" className="text-neutral-200 dark:text-neutral-700" />
    </svg>
  ),
  general: (
    <svg viewBox="0 0 120 100" className="w-32 h-28" fill="none" aria-hidden>
      <circle cx="60" cy="45" r="30" fill="currentColor" className="text-neutral-100 dark:text-neutral-800" />
      <path d="M60 30v20M60 56v4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-neutral-400 dark:text-neutral-500" />
      <rect x="20" y="82" width="80" height="4" rx="2" fill="currentColor" className="text-neutral-200 dark:text-neutral-700" />
    </svg>
  ),
};

interface EmptyStateProps {
  variant?: Variant;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ variant = "general", title, description, action, className }: Readonly<EmptyStateProps>) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center px-4", className)}>
      <div className="mb-4 opacity-80">{SVG[variant]}</div>
      <p className="font-semibold text-neutral-700 dark:text-neutral-300">{title}</p>
      {description && (
        <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
