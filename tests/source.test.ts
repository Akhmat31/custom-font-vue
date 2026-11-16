import { describe, it, expect } from "vitest";
import FONT_LOAD from "../src/ext/source";

describe("FONT_LOAD", () => {
  it("detects an https URL as remote with woff2 format", async () => {
    const m = await FONT_LOAD({ name: "A", src: "https://x.com/a.woff2" });
    expect(m.kind).toBe("remote");
    expect(m.format).toBe("woff2");
    expect(m.mime).toBe("font/woff2");
  });

  it("detects a local asset path as local with truetype format", async () => {
    const m = await FONT_LOAD({ name: "B", src: "../../assets/font/x.ttf" });
    expect(m.kind).toBe("local");
    expect(m.format).toBe("truetype");
    expect(m.mime).toBe("font/ttf");
  });

  it("treats a data: URL as remote", async () => {
    const m = await FONT_LOAD({ name: "C", src: "data:font/ttf;base64,AAAA" });
    expect(m.kind).toBe("remote");
  });

  it("defaults to ttf/truetype for an unknown extension", async () => {
    const m = await FONT_LOAD({ name: "D", src: "https://x.com/font.bin" });
    expect(m.format).toBe("truetype");
    expect(m.mime).toBe("font/ttf");
  });

  it("detects woff and opentype formats", async () => {
    const w = await FONT_LOAD({ name: "W", src: "https://x.com/w.woff" });
    const o = await FONT_LOAD({ name: "O", src: "https://x.com/o.otf" });
    expect(w.format).toBe("woff");
    expect(o.format).toBe("opentype");
  });

  it("accepts the string shorthand (name = reference)", async () => {
    const m = await FONT_LOAD("https://x.com/a.woff");
    expect(m.kind).toBe("remote");
    expect(m.origin).toBe("https://x.com/a.woff");
  });

  it("honors the uri alias", async () => {
    const m = await FONT_LOAD({ name: "U", uri: "https://x.com/u.ttf" });
    expect(m.uri).toBe("https://x.com/u.ttf");
    expect(m.kind).toBe("remote");
  });
});
