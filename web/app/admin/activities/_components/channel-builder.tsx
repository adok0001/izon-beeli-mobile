"use client";

import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ChannelRow } from "./channel-row";
import { labelCls, type ChannelDraft } from "./shared";

export function ChannelBuilder({
  channels, onChange, onAdd, onDelete,
}: {
  channels: ChannelDraft[];
  onChange: (id: string, updated: ChannelDraft) => void;
  onAdd: () => void; onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  const voiceCount = channels.filter((c) => c.isVoice).length;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className={labelCls}>{t("admin.activities.channelsLabel")}</p>
          <p className="text-[11px] text-neutral-400 -mt-0.5">{t("admin.activities.channelsHint")}</p>
        </div>
        <button type="button" onClick={onAdd} className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-500 font-semibold shrink-0">
          <Plus className="h-3 w-3" /> {t("admin.activities.addChannel")}
        </button>
      </div>
      {channels.map((ch) => (
        <ChannelRow key={ch.id} channel={ch} voiceCount={voiceCount}
          onChange={(updated) => {
            if (updated.isVoice) {
              channels.forEach((c) => { if (c.id !== ch.id && c.isVoice) onChange(c.id, { ...c, isVoice: false }); });
            }
            onChange(ch.id, updated);
          }}
          onDelete={() => onDelete(ch.id)}
        />
      ))}
    </div>
  );
}
