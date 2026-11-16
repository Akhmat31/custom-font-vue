// src/composable.ts — reactive-ish `useFont()` that auto-disposes on unmount.
import { getCurrentInstance, onUnmounted } from "vue";
import CONFIG_FONT from "../config-font";
import type { AppliedFont, UseEntry } from "../types";

/**
 * useFont
 *
 * Wraps CONFIG_FONT.use with automatic lifecycle tracking: every AppliedFont
 * returned through this composable is disposed when the hosting component
 * unmounts (releasing Blob URLs and injected <style>).
 */
export function useFont() {
  const tracked: AppliedFont[] = [];

  function registerOne(entry: UseEntry): AppliedFont {
    const f = CONFIG_FONT.use(entry);
    tracked.push(f);
    return f;
  }

  function use(entry: UseEntry): AppliedFont;
  function use(entries: UseEntry[]): AppliedFont[];
  function use(arg: UseEntry | UseEntry[]): AppliedFont | AppliedFont[] {
    return Array.isArray(arg) ? arg.map(registerOne) : registerOne(arg);
  }

  // Only register the unmount hook when called inside a component setup().
  if (getCurrentInstance()) {
    onUnmounted(() => {
      tracked.forEach((f) => f.dispose());
      tracked.length = 0;
    });
  }

  return {
    use,
    setConfig: CONFIG_FONT.setConfig,
    getConfig: CONFIG_FONT.getConfig,
    setCache: CONFIG_FONT.setCache,
  };
}
