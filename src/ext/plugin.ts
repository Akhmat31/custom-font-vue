// src/plugin.ts — Vue 3 plugin entry.
import type { App, Plugin } from "vue";
import CONFIG_FONT from "../config-font";
import type { FontPluginOptions } from "../types";

const VueFontPlugin: Plugin = {
  install(_app: App, options: FontPluginOptions = {}) {
    if (options.conf) CONFIG_FONT.setConfig(options.conf);
    if (typeof options.cache === "boolean") CONFIG_FONT.setCache(options.cache);
  },
};

export default VueFontPlugin;
