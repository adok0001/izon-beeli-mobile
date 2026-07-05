import {
  isScheduled,
  SCHEDULED_LABEL,
  SCHEDULED_PILL_CLASS,
  STATUS_LABEL,
  STATUS_PILL_CLASS,
  type ContentStatus,
} from "@/lib/content-workflow";
import { cn } from "@/lib/utils";

export function StatusPill({
  status, publishAt, className,
}: Readonly<{ status: ContentStatus | undefined; publishAt?: string | Date | null; className?: string }>) {
  if (!status) return null;
  const scheduled = isScheduled(status, publishAt);
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border",
        scheduled ? SCHEDULED_PILL_CLASS : STATUS_PILL_CLASS[status],
        className
      )}
    >
      {scheduled ? SCHEDULED_LABEL : STATUS_LABEL[status]}
    </span>
  );
}
