"use client";

import { SoundboardMixQuiz, WordPlacementQuiz } from "@/components/learn/mini-apps";

const SOUNDBOARD_CHANNELS = [
  { id: "voice", label: "Voice",       targetLevel: 85, initialLevel: 25, isVoice: true },
  { id: "crowd", label: "Crowd",       targetLevel: 12, initialLevel: 80, isVoice: false },
  { id: "rain",  label: "Rain",        targetLevel: 10, initialLevel: 65, isVoice: false },
  { id: "drums", label: "Drums",       targetLevel: 15, initialLevel: 55, isVoice: false },
];

const ZONES = [
  { id: "basket",  label: "àgbọ̀n",   labelTranslation: "basket",  x: 5,  y: 52, width: 20, height: 36 },
  { id: "vendor",  label: "oníṣòwò",  labelTranslation: "vendor",  x: 36, y: 15, width: 24, height: 50 },
  { id: "fabric",  label: "aṣọ",      labelTranslation: "fabric",  x: 68, y: 35, width: 26, height: 38 },
];

const TOKENS = [
  { id: "t1", word: "àgbọ̀n",   translation: "basket" },
  { id: "t2", word: "oníṣòwò",  translation: "vendor" },
  { id: "t3", word: "aṣọ",      translation: "fabric" },
  { id: "t4", word: "ọjà",      translation: "market" },
  { id: "t5", word: "ilé",      translation: "house"  },
];

export default function MiniAppsPage() {
  return (
    <div className="py-10 max-w-3xl mx-auto px-4 space-y-12">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-px bg-amber-500/50" />
          <span className="text-[10px] uppercase tracking-[0.28em] text-amber-500/70 font-semibold">
            Interactive Mini-Apps
          </span>
        </div>
        <h1 className="font-display font-bold text-3xl text-neutral-900 dark:text-white mb-1">
          Encarta-Style Activities
        </h1>
        <p className="text-sm text-neutral-500">
          Hands-on vocabulary exercises embedded in lessons.
        </p>
      </div>

      {/* Soundboard */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono uppercase tracking-[0.28em] text-neutral-500">
            01 — Soundboard Mix Quiz
          </span>
          <div className="flex-1 h-px bg-neutral-100 dark:bg-white/[0.05]" />
        </div>
        <SoundboardMixQuiz
          sentence="Ẹ jẹ́ ká lọ sí ọjà lónìí — the vendor is calling."
          targetWord="marketplace"
          targetWordNative="ọjà"
          channels={SOUNDBOARD_CHANNELS}
          onSuccess={(word) => console.log("Soundboard revealed:", word)}
        />
      </section>

      {/* Word Placement */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono uppercase tracking-[0.28em] text-neutral-500">
            02 — Visual Word Placement
          </span>
          <div className="flex-1 h-px bg-neutral-100 dark:bg-white/[0.05]" />
        </div>
        <WordPlacementQuiz
          imageUrl="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80"
          imageAlt="A busy West African marketplace with vendors and baskets"
          zones={ZONES}
          tokens={TOKENS}
          onComplete={(c, t) => console.log(`Word placement: ${c}/${t} correct`)}
        />
      </section>
    </div>
  );
}
