/**
 * Single source of truth for all supported languages.
 *
 * Imported by:
 *  - App (via @/lib/data/languages)
 *  - Server seed (via relative path)
 *  - lib/mock-data.ts re-exports for backward compat
 */
export const LANGUAGES = [
    // Niger Delta
    { id: "izon", name: "Izon (Ijaw)", nativeName: "Ịzọn", region: "Niger Delta" },
    { id: "isoko", name: "Isoko", nativeName: "Isoko", region: "Niger Delta" },
    { id: "urhobo", name: "Urhobo", nativeName: "Urhobo", region: "Niger Delta" },
    { id: "itsekiri", name: "Itsekiri", nativeName: "Itsekiri", region: "Niger Delta" },
    { id: "ogbia", name: "Ogbia", nativeName: "Ogbia", region: "Niger Delta" },
    { id: "nembe", name: "Nembe", nativeName: "Nembe", region: "Niger Delta" },
    { id: "epie", name: "Epie-Atissa", nativeName: "Epie", region: "Niger Delta" },
    // Southwest
    { id: "yoruba", name: "Yoruba", nativeName: "Yorùbá", region: "Southwest" },
    { id: "igala", name: "Igala", nativeName: "Igala", region: "Southwest" },
    { id: "edo", name: "Edo (Bini)", nativeName: "Ẹdo", region: "Southwest" },
    { id: "esan", name: "Esan", nativeName: "Esan", region: "Southwest" },
    { id: "etsako", name: "Etsako", nativeName: "Etsako", region: "Southwest" },
    // Southeast
    { id: "igbo", name: "Igbo", nativeName: "Igbo", region: "Southeast" },
    { id: "ibibio", name: "Ibibio", nativeName: "Ibibio", region: "Southeast" },
    { id: "efik", name: "Efik", nativeName: "Efịk", region: "Southeast" },
    { id: "annang", name: "Annang", nativeName: "Annang", region: "Southeast" },
    { id: "ekene", name: "Ikwerre", nativeName: "Ikwerre", region: "Southeast" },
    { id: "ogoni", name: "Ogoni (Khana)", nativeName: "Khana", region: "Southeast" },
    // North Central
    { id: "tiv", name: "Tiv", nativeName: "Tiv", region: "North Central" },
    { id: "nupe", name: "Nupe", nativeName: "Nupe", region: "North Central" },
    { id: "gbagyi", name: "Gbagyi", nativeName: "Gbagyi", region: "North Central" },
    { id: "idoma", name: "Idoma", nativeName: "Idoma", region: "North Central" },
    { id: "jukun", name: "Jukun", nativeName: "Jukun", region: "North Central" },
    { id: "berom", name: "Berom", nativeName: "Berom", region: "North Central" },
    // North
    { id: "hausa", name: "Hausa", nativeName: "Hausa", region: "North" },
    { id: "kanuri", name: "Kanuri", nativeName: "Kanuri", region: "North" },
    { id: "fulfulde", name: "Fulfulde (Fula)", nativeName: "Fulfulde", region: "North" },
    { id: "margi", name: "Margi", nativeName: "Margi", region: "North" },
    { id: "bura", name: "Bura", nativeName: "Bura", region: "North" },
    // West Africa (non-Nigeria)
    { id: "akan", name: "Akan (Twi)", nativeName: "Akan", region: "West Africa" },
    { id: "ga", name: "Ga", nativeName: "Ga", region: "West Africa" },
    { id: "ewe", name: "Ewe", nativeName: "Eʋegbe", region: "West Africa" },
    { id: "wolof", name: "Wolof", nativeName: "Wolof", region: "West Africa" },
    { id: "bambara", name: "Bambara", nativeName: "Bamanankan", region: "West Africa" },
    { id: "mandinka", name: "Mandinka", nativeName: "Mandinka", region: "West Africa" },
    { id: "fon", name: "Fon", nativeName: "Fɔ̀ngbè", region: "West Africa" },
    { id: "mende", name: "Mende", nativeName: "Mɛnde", region: "West Africa" },
    { id: "krio", name: "Krio", nativeName: "Krio", region: "West Africa" },
    { id: "temne", name: "Temne", nativeName: "Temne", region: "West Africa" },
    { id: "dagbani", name: "Dagbani", nativeName: "Dagbanli", region: "West Africa" },
    { id: "moore", name: "Mooré", nativeName: "Mòoré", region: "West Africa" },
    // East Africa
    { id: "swahili", name: "Swahili", nativeName: "Kiswahili", region: "East Africa" },
    { id: "amharic", name: "Amharic", nativeName: "አማርኛ", region: "East Africa" },
    { id: "oromo", name: "Oromo", nativeName: "Afaan Oromoo", region: "East Africa" },
    { id: "tigrinya", name: "Tigrinya", nativeName: "ትግርኛ", region: "East Africa" },
    { id: "somali", name: "Somali", nativeName: "Soomaali", region: "East Africa" },
    { id: "luganda", name: "Luganda", nativeName: "Luganda", region: "East Africa" },
    { id: "kinyarwanda", name: "Kinyarwanda", nativeName: "Ikinyarwanda", region: "East Africa" },
    { id: "kirundi", name: "Kirundi", nativeName: "Ikirundi", region: "East Africa" },
    { id: "kikuyu", name: "Kikuyu", nativeName: "Gĩkũyũ", region: "East Africa" },
    { id: "luo", name: "Luo", nativeName: "Dholuo", region: "East Africa" },
    { id: "maasai", name: "Maasai", nativeName: "ɔl Maa", region: "East Africa" },
    // North Africa
    { id: "arabic-egyptian", name: "Arabic (Egyptian)", nativeName: "العربية المصرية", region: "North Africa" },
    { id: "arabic-maghrebi", name: "Arabic (Maghrebi)", nativeName: "الدارجة", region: "North Africa" },
    { id: "tamazight", name: "Tamazight (Berber)", nativeName: "ⵜⴰⵎⴰⵣⵉⵖⵜ", region: "North Africa" },
    { id: "kabyle", name: "Kabyle", nativeName: "Taqbaylit", region: "North Africa" },
    { id: "tuareg", name: "Tuareg (Tamashek)", nativeName: "Tamasheq", region: "North Africa" },
    { id: "coptic", name: "Coptic", nativeName: "ϯⲙⲉⲧⲣⲉⲙⲛⲕⲏⲙⲓ", region: "North Africa" },
    // Southern Africa
    { id: "zulu", name: "Zulu", nativeName: "isiZulu", region: "Southern Africa" },
    { id: "xhosa", name: "Xhosa", nativeName: "isiXhosa", region: "Southern Africa" },
    { id: "sotho", name: "Sotho", nativeName: "Sesotho", region: "Southern Africa" },
    { id: "tswana", name: "Tswana", nativeName: "Setswana", region: "Southern Africa" },
    { id: "shona", name: "Shona", nativeName: "chiShona", region: "Southern Africa" },
    { id: "ndebele", name: "Ndebele", nativeName: "isiNdebele", region: "Southern Africa" },
    { id: "tsonga", name: "Tsonga", nativeName: "Xitsonga", region: "Southern Africa" },
    { id: "venda", name: "Venda", nativeName: "Tshivenḓa", region: "Southern Africa" },
    { id: "swati", name: "Swati", nativeName: "siSwati", region: "Southern Africa" },
    { id: "afrikaans", name: "Afrikaans", nativeName: "Afrikaans", region: "Southern Africa" },
    { id: "chichewa", name: "Chichewa", nativeName: "Chicheŵa", region: "Southern Africa" },
    { id: "malagasy", name: "Malagasy", nativeName: "Malagasy", region: "Southern Africa" },
];
/** All languages now have at least template content via lib/data/lessons/stub.ts. */
/** Filtered to only languages that have courses — used in learning UI. */
export const ACTIVE_LANGUAGES = LANGUAGES;
/** Look up a language's display name by its id. Returns the id if not found. */
export function getLanguageName(id) {
    return LANGUAGES.find((l) => l.id === id)?.name ?? id;
}
