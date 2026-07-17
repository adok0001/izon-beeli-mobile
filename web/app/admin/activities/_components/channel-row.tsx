"use client";

import { cn } from "@/lib/utils";
import { VerticalFader } from "@/components/learn/mini-apps/soundboard-mix-quiz";
import { Trash2 } from "lucide-react";
import { fieldCls, type ChannelDraft } from "./shared";

export function ChannelRow({
  channel, voiceCount, onChange, onDelete,
}: {
  channel: ChannelDraft; voiceCount: number;
  onChange: (updated: ChannelDraft) => void; onDelete: () => void;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl border transition-colors",
      channel.isVoice ? "border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20" : "border-neutral-200 dark:border-neutral-700"
    )}>
      <label title="Mark as voice channel" className="flex flex-col items-center gap-1 shrink-0 cursor-pointer">
        <input type="radio" name="voice-channel" checked={channel.isVoice}
          onChange={() => onChange({ ...channel, isVoice: true })} className="accent-blue-500" />
        <span className="text-[8px] font-mono uppercase text-blue-500">voice</span>
      </label>

      <input className={cn(fieldCls, "w-24 shrink-0")} placeholder="Label" value={channel.label}
        onChange={(e) => onChange({ ...channel, label: e.target.value })} />

      <div className="flex flex-col items-center gap-1 shrink-0">
        <span className="text-[8px] font-mono text-neutral-400 uppercase">Target</span>
        <VerticalFader level={channel.targetLevel} label={`${channel.label} target`}
          color={channel.isVoice ? "#60a5fa" : "#818cf8"} isNearTarget={false}
          onChange={(v) => onChange({ ...channel, targetLevel: v })} />
        <span className="text-[10px] font-mono tabular-nums text-neutral-500">{channel.targetLevel}</span>
      </div>

      <div className="flex flex-col items-center gap-1 shrink-0">
        <span className="text-[8px] font-mono text-neutral-400 uppercase">Start</span>
        <VerticalFader level={channel.initialLevel} label={`${channel.label} start`}
          color="#6b7280" isNearTarget={false}
          onChange={(v) => onChange({ ...channel, initialLevel: v })} />
        <span className="text-[10px] font-mono tabular-nums text-neutral-500">{channel.initialLevel}</span>
      </div>

      <button type="button" onClick={onDelete} disabled={channel.isVoice && voiceCount <= 1}
        className="ml-auto text-red-400 hover:text-red-500 disabled:opacity-20 transition-colors shrink-0">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
