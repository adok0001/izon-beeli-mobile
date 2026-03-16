import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-brand-600 dark:text-brand-400 mb-4">404</p>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
          Page not found
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          This page doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/learn"
          className="inline-flex items-center px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          Go to Learn
        </Link>
      </div>
    </div>
  );
}
