"use client";

import type { ReactNode } from "react";

/**
 * Form and action primitives shared by the season list, the create form and the
 * season editor. Class idioms follow the rest of this page (neutral cards,
 * `brand-600` primary) so the editor doesn't drift into its own look.
 */

const CONTROL_CLASS =
  "mt-1 w-full rounded-lg border border-neutral-300 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-neutral-900 dark:text-white disabled:opacity-50";

function FieldLabel({ label, required }: Readonly<{ label: string; required?: boolean }>) {
  return (
    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
      {label} {required && <span className="text-red-500">*</span>}
    </span>
  );
}

export function Field({
  label,
  value,
  onChange,
  required,
  disabled,
  placeholder,
  hint,
}: Readonly<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
}>) {
  return (
    <label className="block">
      <FieldLabel label={label} required={required} />
      <input
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={CONTROL_CLASS}
      />
      {hint && <span className="mt-1 block text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}

export function TextareaField({
  label,
  value,
  onChange,
  rows = 3,
  required,
  disabled,
  placeholder,
}: Readonly<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}>) {
  return (
    <label className="block">
      <FieldLabel label={label} required={required} />
      <textarea
        value={value}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${CONTROL_CLASS} resize-none`}
      />
    </label>
  );
}

/** On web a picker is a native `<select>` — no pill rows, no bespoke dropdown. */
export function SelectField({
  label,
  value,
  onChange,
  children,
  required,
  disabled,
  hint,
}: Readonly<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
}>) {
  return (
    <label className="block">
      <FieldLabel label={label} required={required} />
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={CONTROL_CLASS}
      >
        {children}
      </select>
      {hint && <span className="mt-1 block text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}

export function ActionButton({
  children,
  onClick,
  tone,
  disabled,
  title,
}: Readonly<{
  children: ReactNode;
  onClick: () => void;
  tone?: "publish" | "danger";
  disabled?: boolean;
  title?: string;
}>) {
  let cls = "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/[0.05]";
  if (tone === "publish") {
    cls = "text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30";
  } else if (tone === "danger") {
    cls = "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30";
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-40 ${cls}`}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
}: Readonly<{ children: ReactNode; onClick: () => void; disabled?: boolean }>) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
