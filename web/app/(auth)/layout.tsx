"use client";

import { useTranslation } from "react-i18next";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-purple-100 dark:from-neutral-950 dark:to-neutral-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-700 dark:text-brand-400">
            Beeli
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">
            {t("auth.brandSubtitle")}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
