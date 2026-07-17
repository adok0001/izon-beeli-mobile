"use client";

import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { fieldCls, labelCls, type TokenDraft } from "./shared";

export function TokenList({
  tokens, onChange, onDelete, onAdd,
}: {
  tokens: TokenDraft[];
  onChange: (id: string, field: keyof Omit<TokenDraft, "id">, value: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className={labelCls}>{t("admin.activities.tokensLabel")}</p>
        <button type="button" onClick={onAdd} className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-500 font-semibold">
          <Plus className="h-3 w-3" /> {t("admin.activities.addToken")}
        </button>
      </div>
      <div className="space-y-2">
        {tokens.map((token) => (
          <div key={token.id} className="flex gap-2 items-center">
            <input className={fieldCls} placeholder="Native word" value={token.word} onChange={(e) => onChange(token.id, "word", e.target.value)} />
            <input className={fieldCls} placeholder="Translation" value={token.translation} onChange={(e) => onChange(token.id, "translation", e.target.value)} />
            <input className={cn(fieldCls, "shrink-0 w-44")} placeholder="Audio URL (opt.)" value={token.audioUrl} onChange={(e) => onChange(token.id, "audioUrl", e.target.value)} />
            <button type="button" onClick={() => onDelete(token.id)} className="shrink-0 text-red-400 hover:text-red-500 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
