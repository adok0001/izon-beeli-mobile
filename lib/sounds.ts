import { Audio } from "expo-av";
import { SFX_FINISH, SFX_CORRECT, SFX_INCORRECT } from "@/lib/mock-data";

let cachedFinish: Audio.Sound | null = null;
let cachedCorrect: Audio.Sound | null = null;
let cachedIncorrect: Audio.Sound | null = null;

async function playOnce(source: number, cached: Audio.Sound | null): Promise<Audio.Sound> {
  if (cached) {
    await cached.replayAsync();
    return cached;
  }
  const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: true });
  return sound;
}

export async function playFinishSound() {
  cachedFinish = await playOnce(SFX_FINISH, cachedFinish);
}

export async function playCorrectSound() {
  cachedCorrect = await playOnce(SFX_CORRECT, cachedCorrect);
}

export async function playIncorrectSound() {
  cachedIncorrect = await playOnce(SFX_INCORRECT, cachedIncorrect);
}
