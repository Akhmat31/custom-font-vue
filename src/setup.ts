import { vi, afterEach } from "vitest";

afterEach(() => {
  if (typeof document !== "undefined") {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  }
});
// jsdom lacks URL.createObjectURL / URL.revokeObjectURL. Provide stubs that
// return a synthetic blob: URL so @font-face injection and lifecycle work.
function ensureBlobUrl(): void {
  const u = URL as unknown as {
    createObjectURL?: unknown;
    revokeObjectURL?: unknown;
  };
  if (typeof u.createObjectURL !== "function") {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(() => `blob:fake-${Math.random().toString(36).slice(2)}`),
    });
  }
  if (typeof u.revokeObjectURL !== "function") {
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(() => {}),
    });
  }
}
ensureBlobUrl();