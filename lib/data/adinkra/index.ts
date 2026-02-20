import { ADINKRA_SYMBOLS, type AdinkraSymbol } from "./symbols";

export type { AdinkraSymbol };
export { ADINKRA_SYMBOLS };

export function getAdinkraSymbol(id: string): AdinkraSymbol | undefined {
  return ADINKRA_SYMBOLS.find((s) => s.id === id);
}
