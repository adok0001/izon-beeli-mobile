import { IconSymbol } from "@/components/ui/icon-symbol";
import { apiFetch } from "@/lib/api";
import {
  useReviewPhrase,
  useReviewSession,
  type ReviewRating,
  type ReviewSessionItem,
} from "@/lib/hooks/use-phrase-bank";
import { useMuseumTheme } from "@/lib/use-museum-theme";
import { useLanguageStore } from "@/store/language-store";
import { useAuth } from "@clerk/clerk-expo";
import { Stack, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Deterministic in-place-ish shuffle keyed by the item id, so re-renders are stable. */
function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const RATINGS: { key: ReviewRating; label: string }[] = [
  { key: "again", label: "Again" },
  { key: "hard", label: "Hard" },
  { key: "good", label: "Good" },
  { key: "easy", label: "Easy" },
];

/** Rating strip shown once an item is revealed/answered. */
function RatingBar({ onRate, disabled }: Readonly<{ onRate: (r: ReviewRating) => void; disabled: boolean }>) {
  const M = useMuseumTheme();
  const color: Record<ReviewRating, string> = { again: M.error, hard: M.warning, good: M.success, easy: M.accent };
  return (
    <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
      {RATINGS.map((r) => (
        <Pressable
          key={r.key}
          disabled={disabled}
          onPress={() => onRate(r.key)}
          style={{ flex: 1, alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: color[r.key], paddingVertical: 10 }}
          className="active:opacity-70"
        >
          <Text style={{ fontSize: 13, fontWeight: "800", color: color[r.key] }}>{r.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** One phrase item — recall / cloze / reorder, then rate. */
function PhraseCard({
  item,
  onRate,
  rating,
}: Readonly<{
  item: Extract<ReviewSessionItem, { kind: "phrase" }>;
  onRate: (r: ReviewRating) => void;
  rating: boolean;
}>) {
  const M = useMuseumTheme();
  const [revealed, setRevealed] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  // Reorder state: indices into `tiles`, so duplicate words stay distinct.
  const [builtIdx, setBuiltIdx] = useState<number[]>([]);

  const words = useMemo(() => item.text.trim().split(/\s+/), [item.text]);

  // Cloze: blank the longest word (most content-bearing); options from the line itself.
  const cloze = useMemo(() => {
    const answer = [...words].sort((a, b) => b.length - a.length)[0];
    const others = [...new Set(words.filter((w) => w !== answer))].slice(0, 3);
    return { answer, options: seededShuffle([answer, ...others], item.id) };
  }, [words, item.id]);

  const tiles = useMemo(() => seededShuffle(words.map((w, i) => ({ w, i })), item.id), [words, item.id]);

  const built = builtIdx.map((i) => tiles[i].w);
  const done =
    item.mode === "recall" ? revealed :
    item.mode === "cloze" ? picked !== null :
    built.length === words.length;

  return (
    <View style={{ borderRadius: 20, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, padding: 20 }}>
      <Text style={{ fontSize: 10, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", color: M.accent }}>
        {item.mode === "recall" ? "Say it, then reveal" : item.mode === "cloze" ? "Fill the gap" : "Rebuild the line"}
      </Text>

      {item.mode === "recall" ? (
        <>
          <Text style={{ marginTop: 12, fontSize: 20, lineHeight: 30, fontWeight: "700", color: M.text }}>{item.text}</Text>
          {revealed ? (
            <Text style={{ marginTop: 10, fontSize: 15, lineHeight: 22, color: M.sub }}>{item.translation ?? "(no translation)"}</Text>
          ) : (
            <Pressable
              onPress={() => setRevealed(true)}
              style={{ marginTop: 14, alignSelf: "flex-start", borderRadius: 999, backgroundColor: M.accent, paddingHorizontal: 16, paddingVertical: 9 }}
              className="active:opacity-80"
            >
              <Text style={{ fontSize: 13, fontWeight: "800", color: M.ink }}>Reveal meaning</Text>
            </Pressable>
          )}
        </>
      ) : null}

      {item.mode === "cloze" ? (
        <>
          <Text style={{ marginTop: 12, fontSize: 20, lineHeight: 30, fontWeight: "700", color: M.text }}>
            {words.map((w, i) => (w === cloze.answer && words.indexOf(cloze.answer) === i ? "____" : w)).join(" ")}
          </Text>
          {item.translation ? (
            <Text style={{ marginTop: 6, fontSize: 13, color: M.muted }}>{item.translation}</Text>
          ) : null}
          <View style={{ marginTop: 12, gap: 6 }}>
            {cloze.options.map((opt) => {
              const isAnswer = opt === cloze.answer;
              const isPicked = picked === opt;
              const bg = !picked ? M.inputBg : isAnswer ? M.successBg : isPicked ? M.errorBg : M.inputBg;
              const border = !picked ? M.border : isAnswer ? M.success : isPicked ? M.error : M.border;
              return (
                <Pressable
                  key={opt}
                  disabled={!!picked}
                  onPress={() => setPicked(opt)}
                  style={{ borderRadius: 10, borderWidth: 1, borderColor: border, backgroundColor: bg, paddingHorizontal: 12, paddingVertical: 10 }}
                  className="active:opacity-70"
                >
                  <Text style={{ fontSize: 15, fontWeight: "600", color: M.text }}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {item.mode === "reorder" ? (
        <>
          {item.translation ? (
            <Text style={{ marginTop: 10, fontSize: 14, color: M.sub }}>{item.translation}</Text>
          ) : null}
          <View style={{ marginTop: 12, minHeight: 44, flexDirection: "row", flexWrap: "wrap", gap: 6, borderRadius: 12, borderWidth: 1, borderColor: M.border, backgroundColor: M.inputBg, padding: 10 }}>
            {builtIdx.map((tileIdx, pos) => (
              <Pressable
                key={tileIdx}
                onPress={() => setBuiltIdx((prev) => prev.filter((_, p) => p !== pos))}
                style={{ borderRadius: 8, backgroundColor: M.accentGlow, borderWidth: 1, borderColor: M.accentBorder, paddingHorizontal: 10, paddingVertical: 6 }}
              >
                <Text style={{ fontSize: 15, fontWeight: "700", color: M.accent }}>{tiles[tileIdx].w}</Text>
              </Pressable>
            ))}
          </View>
          <View style={{ marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {tiles.map((tile, idx) => {
              const consumed = builtIdx.includes(idx);
              return (
                <Pressable
                  key={idx}
                  disabled={consumed || done}
                  onPress={() => setBuiltIdx((prev) => [...prev, idx])}
                  style={{ opacity: consumed ? 0.3 : 1, borderRadius: 8, backgroundColor: M.card, borderWidth: 1, borderColor: M.border, paddingHorizontal: 10, paddingVertical: 6 }}
                  className="active:opacity-70"
                >
                  <Text style={{ fontSize: 15, fontWeight: "600", color: M.text }}>{tile.w}</Text>
                </Pressable>
              );
            })}
          </View>
          {done ? (
            <View style={{ marginTop: 10 }}>
              {built.join(" ") === words.join(" ") ? (
                <Text style={{ fontSize: 14, fontWeight: "700", color: M.success }}>Exactly right.</Text>
              ) : (
                <Text style={{ fontSize: 14, color: M.error }}>
                  Correct line: <Text style={{ fontWeight: "700", color: M.text }}>{item.text}</Text>
                </Text>
              )}
            </View>
          ) : null}
        </>
      ) : null}

      {done ? <RatingBar onRate={onRate} disabled={rating} /> : null}
    </View>
  );
}

/** A word item from the classic bank — prompt, reveal, rate. */
function WordCard({
  item,
  onRate,
  rating,
}: Readonly<{ item: Extract<ReviewSessionItem, { kind: "word" }>; onRate: (r: ReviewRating) => void; rating: boolean }>) {
  const M = useMuseumTheme();
  const [revealed, setRevealed] = useState(false);
  return (
    <View style={{ borderRadius: 20, borderWidth: 1, borderColor: M.border, backgroundColor: M.card, padding: 20 }}>
      <Text style={{ fontSize: 10, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", color: M.accent }}>Word</Text>
      <Text style={{ marginTop: 12, fontSize: 24, fontWeight: "800", color: M.text }}>{item.word}</Text>
      {revealed ? (
        <Text style={{ marginTop: 8, fontSize: 16, color: M.sub }}>{item.english}</Text>
      ) : (
        <Pressable
          onPress={() => setRevealed(true)}
          style={{ marginTop: 14, alignSelf: "flex-start", borderRadius: 999, backgroundColor: M.accent, paddingHorizontal: 16, paddingVertical: 9 }}
          className="active:opacity-80"
        >
          <Text style={{ fontSize: 13, fontWeight: "800", color: M.ink }}>Reveal</Text>
        </Pressable>
      )}
      {revealed ? <RatingBar onRate={onRate} disabled={rating} /> : null}
    </View>
  );
}

export default function PhraseReviewScreen() {
  const M = useMuseumTheme();
  const router = useRouter();
  const { getToken } = useAuth();
  const { selectedLanguageId } = useLanguageStore();
  const { data, isLoading } = useReviewSession(selectedLanguageId);
  const reviewPhrase = useReviewPhrase();

  const [index, setIndex] = useState(0);
  const [doneCount, setDoneCount] = useState(0);

  const items = data?.items ?? [];
  const current = items[index];

  const advance = () => {
    setDoneCount((n) => n + 1);
    setIndex((i) => i + 1);
  };

  const rateCurrent = (r: ReviewRating) => {
    if (!current) return;
    if (current.kind === "phrase") {
      reviewPhrase.mutate({ id: current.id, confidence: r }, { onSettled: advance });
    } else {
      // Word items grade through the existing word-bank schedule.
      getToken().then((token) =>
        apiFetch(`/wordbank/${current.id}/review`, {
          method: "POST",
          token: token ?? undefined,
          body: JSON.stringify({ confidence: r }),
        }).catch(() => null),
      );
      advance();
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Sentence Review", headerBackTitle: "Back" }} />
      <SafeAreaView style={{ flex: 1, backgroundColor: M.bg }} edges={["bottom"]}>
        <View style={{ flex: 1, padding: 20 }}>
          {isLoading ? (
            <Text style={{ marginTop: 40, textAlign: "center", color: M.muted }}>Composing your session…</Text>
          ) : items.length === 0 ? (
            <View style={{ marginTop: 60, alignItems: "center", gap: 10 }}>
              <IconSymbol name="checkmark.circle.fill" size={40} color={M.success} />
              <Text style={{ fontSize: 16, fontWeight: "700", color: M.text }}>Nothing due right now</Text>
              <Text style={{ textAlign: "center", fontSize: 13, color: M.muted, paddingHorizontal: 24 }}>
                Save lines from any lesson transcript, or finish a lesson — its sentences join your review queue automatically.
              </Text>
            </View>
          ) : current ? (
            <>
              <Text style={{ marginBottom: 12, fontSize: 12, fontWeight: "700", color: M.muted }}>
                {index + 1} / {items.length}
              </Text>
              {current.kind === "phrase" ? (
                <PhraseCard key={current.id} item={current} onRate={rateCurrent} rating={reviewPhrase.isPending} />
              ) : (
                <WordCard key={current.id} item={current} onRate={rateCurrent} rating={false} />
              )}
            </>
          ) : (
            <View style={{ marginTop: 60, alignItems: "center", gap: 10 }}>
              <IconSymbol name="checkmark.circle.fill" size={40} color={M.success} />
              <Text style={{ fontSize: 16, fontWeight: "700", color: M.text }}>Session complete</Text>
              <Text style={{ fontSize: 13, color: M.muted }}>{doneCount} item{doneCount === 1 ? "" : "s"} reviewed.</Text>
              <Pressable
                onPress={() => router.back()}
                style={{ marginTop: 8, borderRadius: 999, backgroundColor: M.accent, paddingHorizontal: 20, paddingVertical: 10 }}
                className="active:opacity-80"
              >
                <Text style={{ fontSize: 14, fontWeight: "800", color: M.ink }}>Done</Text>
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
    </>
  );
}
