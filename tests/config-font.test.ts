import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock axios default export before importing the module under test.
vi.mock("axios", () => ({
  default: { get: vi.fn() },
}));

import axios from "axios";
import CONFIG_FONT from "../src/config-font";

const fakeBuffer = () =>
  new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]).buffer;

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  (axios.get as unknown as ReturnType<typeof vi.fn>).mockReset();
  CONFIG_FONT.setConfig({ url_extern: "", g_font_uri: "" });
});

describe("CONFIG_FONT", () => {
  it("injects a @font-face <style> and overrides font-family", async () => {
    (axios.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: fakeBuffer(),
    });
    document.body.innerHTML = '<div id="t">hi</div>';

    const f = CONFIG_FONT.use({
      name: "Courier",
      target: "#t",
      src: "https://x.com/c1.ttf",
    });
    await f.apply();

    const el = document.getElementById("t") as HTMLElement;
    expect(el.style.fontFamily).toContain("Courier");
    expect(document.querySelector('style[id^="font-face-"]')).toBeTruthy();
  });

  it("revert() restores the previous font-family", async () => {
    (axios.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: fakeBuffer(),
    });
    document.body.innerHTML =
      '<div id="t" style="font-family: Arial">hi</div>';

    const f = CONFIG_FONT.use({
      name: "C2",
      target: "#t",
      src: "https://x.com/c2.ttf",
    });
    await f.apply();

    const el = document.getElementById("t") as HTMLElement;
    expect(el.style.fontFamily).toContain("C2");

    f.revert();
    await flush();
    expect(el.style.fontFamily.replace(/['"]/g, "")).toContain("Arial");
  });

  it("dispose() removes the <style> and revokes the Blob URL", async () => {
    (axios.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: fakeBuffer(),
    });
    const revoke = vi.spyOn(URL, "revokeObjectURL");

    const f = CONFIG_FONT.use({
      name: "C3",
      target: "#x",
      src: "https://x.com/c3.ttf",
    });
    await f.apply();
    expect(document.querySelector('style[id^="font-face-"]')).toBeTruthy();

    f.dispose();
    await flush();
    expect(document.querySelector('style[id^="font-face-"]')).toBeFalsy();
    expect(revoke).toHaveBeenCalled();
    revoke.mockRestore();
  });

  it("calls onError when the fetch fails", async () => {
    (axios.get as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("network")
    );
    const onError = vi.fn();

    const f = CONFIG_FONT.use({
      name: "C4",
      target: "#x",
      src: "https://x.com/c4.ttf",
      onError,
    });
    await f.apply();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("accepts an array and returns one AppliedFont per entry", async () => {
    (axios.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: fakeBuffer(),
    });
    document.body.innerHTML =
      '<div id="a">a</div><div id="b">b</div>';

    const list = CONFIG_FONT.use([
      { name: "M1", target: "#a", src: "https://x.com/m1.ttf" },
      { name: "M2", target: "#b", src: "https://x.com/m2.ttf" },
    ]);
    expect(Array.isArray(list)).toBe(true);
    expect(list).toHaveLength(2);

    await Promise.all(list.map((f) => f.apply()));
    expect(
      (document.getElementById("a") as HTMLElement).style.fontFamily
    ).toContain("M1");
    expect(
      (document.getElementById("b") as HTMLElement).style.fontFamily
    ).toContain("M2");
  });

  it("overrides silently on an element that already uses an external font", async () => {
    (axios.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: fakeBuffer(),
    });
    // Element already styled with an external font-face family.
    document.body.innerHTML =
      '<div id="t" style="font-family: \'SomeExternalFont\'">hi</div>';

    const f = CONFIG_FONT.use({
      name: "Silent",
      target: "#t",
      src: "https://x.com/silent.ttf",
    });
    await expect(f.apply()).resolves.toBeUndefined();
    expect(
      (document.getElementById("t") as HTMLElement).style.fontFamily
    ).toContain("Silent");
  });
});
