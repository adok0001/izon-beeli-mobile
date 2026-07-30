import type { en } from "./en";

export type TranslationResources = typeof en;

/**
 * Every valid dot-path into the translation tree, e.g. "feed.title", derived
 * from the English resource object itself.
 *
 * Separate from `./index` on purpose. That file gets `TranslationKey` from
 * i18next's `ParseKeys` and augments i18next's `CustomTypeOptions`, so importing
 * it drags i18next's types along — and `web/` imports this type through the
 * `@mobile/*` alias. Module resolution from `mobile/` looks in
 * `mobile/node_modules` and the repo root, never in `web/node_modules`, so on
 * Vercel (which installs web's dependencies only) i18next is unresolvable and
 * the build fails. Mapping i18next to web's own copy doesn't help either: web is
 * on v23 and mobile on v25, and compiling mobile's file against v23's `ParseKeys`
 * crashes tsc outright.
 *
 * So the key union lives here, computed from `en` with no dependency on i18next,
 * and `./index` re-exports it for the app. Both consumers get the same keys from
 * the same source of truth.
 */
export type TranslationKey = DotPaths<TranslationResources>;

type DotPaths<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K | StripPlural<K>
    : `${K}.${DotPaths<T[K]>}`;
}[keyof T & string];

/**
 * i18next's plural suffixes. Resources declare `streakDays_zero`,
 * `streakDays_one`, `streakDays_other`, but the key you *call* is `streakDays`
 * with a `count` — which is what `ParseKeys` exposes. Both forms are kept in the
 * union: the base so a call site matches `ParseKeys`, the literal so a caller
 * that walked the resource object itself still typechecks. Widening here only
 * affects what `web/`'s `t()` accepts; mobile keeps `ParseKeys` exactly.
 */
type PluralSuffix = "zero" | "one" | "two" | "few" | "many" | "other";
type StripPlural<K extends string> = K extends `${infer Base}_${PluralSuffix}` ? Base : K;
