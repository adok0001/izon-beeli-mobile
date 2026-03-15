/**
 * Safe AsyncStorage wrapper.
 * Falls back to in-memory storage when the native module isn't available
 * (Expo Go with New Architecture, web without proper polyfill, Jest tests).
 */

const _mem: Record<string, string> = {};

interface AsyncStorageLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const _fallback: AsyncStorageLike = {
  getItem: (k) => Promise.resolve(_mem[k] ?? null),
  setItem: (k, v) => { _mem[k] = v; return Promise.resolve(); },
  removeItem: (k) => { delete _mem[k]; return Promise.resolve(); },
};

let _resolved: AsyncStorageLike | null = null;

function getStorage(): AsyncStorageLike {
  if (_resolved) return _resolved;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@react-native-async-storage/async-storage");
    const impl = mod?.default ?? mod;
    // The package throws at import time when the native module is null,
    // so if we got here without throwing, it's safe to use.
    _resolved = impl ?? _fallback;
  } catch {
    _resolved = _fallback;
  }
  return _resolved!;
}

export default {
  getItem: (key: string) => getStorage().getItem(key),
  setItem: (key: string, value: string) => getStorage().setItem(key, value),
  removeItem: (key: string) => getStorage().removeItem(key),
};
