import { describe, it, expect, vi } from "vitest";
import { createApp } from "vue";
import VueFontPlugin from "../src/ext/plugin";
import CONFIG_FONT from "../src/config-font";

describe("VueFontPlugin", () => {
  it("install() forwards conf to CONFIG_FONT.setConfig", () => {
    const spy = vi.spyOn(CONFIG_FONT, "setConfig");
    const app = createApp({});
    app.use(VueFontPlugin, { conf: { url_extern: "https://base/" } });
    expect(spy).toHaveBeenCalledWith({ url_extern: "https://base/" });
    spy.mockRestore();
  });

  it("install() enables persistent cache when cache:true", () => {
    const spy = vi.spyOn(CONFIG_FONT, "setCache");
    const app = createApp({});
    app.use(VueFontPlugin, { cache: true });
    expect(spy).toHaveBeenCalledWith(true);
    spy.mockRestore();
  });

  it("install() works with no options", () => {
    const app = createApp({});
    expect(() => app.use(VueFontPlugin)).not.toThrow();
  });
});
