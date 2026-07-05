import { STATUS_LABEL, STATUS_PILL_CLASS, type ContentStatus } from "@/lib/content-workflow";
import { cn } from "@/lib/utils";

export function StatusPill({ status, className }: Readonly<{ status: ContentStatus | undefined; className?: string }>) {
  if (!status) return null;
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border",
        STATUS_PILL_CLASS[status],
        className
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
