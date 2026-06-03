import { NativeModulesProxy, requireNativeModule } from "expo-modules-core";

export interface WotdContent {
  word: string;
  pronunciation?: string;
  english: string;
  languageId: string;
}

export interface PotmContent {
  text: string;
  translation: string;
  languageId: string;
}

export interface SotwContent {
  title: string;
  languageId: string;
}

interface BeeliWidgetModuleType {
  writeWidgetContent(key: string, json: string): void;
  reloadWidgetTimelines(): void;
}

const BeeliWidgetModule: BeeliWidgetModuleType =
  requireNativeModule("BeeliWidget") ??
  (NativeModulesProxy.BeeliWidget as BeeliWidgetModuleType);

export function writeWotd(content: WotdContent): void {
  try {
    BeeliWidgetModule.writeWidgetContent("wotd_content", JSON.stringify(content));
  } catch {}
}

export function writePotm(content: PotmContent): void {
  try {
    BeeliWidgetModule.writeWidgetContent("potm_content", JSON.stringify(content));
  } catch {}
}

export function writeSotw(content: SotwContent): void {
  try {
    BeeliWidgetModule.writeWidgetContent("sotw_content", JSON.stringify(content));
  } catch {}
}

export function reloadWidgetTimelines(): void {
  try {
    BeeliWidgetModule.reloadWidgetTimelines();
  } catch {}
}
