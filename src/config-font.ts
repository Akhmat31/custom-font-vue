import axios, { type AxiosRequestConfig } from "axios";
import FONT_LOAD from "./ext/source";
import type {
  AppliedFont,
  FontMeta,
  URICONF,
  UseEntry,
  FaceRecord,
} from "./types";

/** Single entry -> AppliedFont; array -> AppliedFont[]. */
function use(entry: UseEntry): AppliedFont;
function use(entries: UseEntry[]): AppliedFont[];
function use(arg: UseEntry | UseEntry[]): AppliedFont | AppliedFont[] {
  return Array.isArray(arg) ? arg.map(register) : register(arg);
}
const DEFAULT_CONF: URICONF = { url_extern: "", g_font_uri: "" };
let conf: URICONF = { ...DEFAULT_CONF };
let persistentCache = false;

export function setConfig(next: Partial<URICONF>): URICONF {
  conf = { ...conf, ...next };
  return { ...conf };
}
export function getConfig(): URICONF {
  return { ...conf };
}
export function setCache(enabled: boolean): void {
  persistentCache = enabled;
}
const isBrowser   = typeof window !== "undefined" && typeof document !== "undefined";
const prevFamily  = new WeakMap<HTMLElement, string>();


/** Registry of injected faces, keyed by font name, for cleanup. */
const faces = new Map<string, FaceRecord>();

/** In-memory cache: uri -> ArrayBuffer (the binary font bytes). */
const memCache = new Map<string, ArrayBuffer>();

/**
 * BodyParser — converts the axios response body (ArrayBuffer) into a
 * Blob URL ready for @font-face `src:url(...)`. This is the step that
 * bypasses cross-origin header issues (the fetch is same-origin from the
 * plugin's perspective and the result is an opaque Blob URL).
 */
class BodyParser {
  static toBlobUrl(buf: ArrayBuffer, mime: string): string {
    const blob = new Blob([buf], { type: mime });
    return URL.createObjectURL(blob);
  }
}

/** Axios config tuned for binary font fetch (no JSON transform, no pre-flight). */
function axiosConfig(extra?: AxiosRequestConfig): AxiosRequestConfig {
  return {
    responseType: "arraybuffer",
    headers: {
      Accept: "application/octet-stream, font/ttf, font/woff, font/woff2, */*",
    },
    transformResponse: [(d) => d],
    ...extra,
  };
}

/** Fetch (and cache) the binary font bytes for a URI. */
async function fetchBuffer(
  uri: string,
  mime: string,
  force = false
): Promise<ArrayBuffer> {
  // Persistent cache via the Cache API (survives reloads).
  if (persistentCache && "caches" in window) {
    const cache = await caches.open("ext-vue-font");
    const req = new Request(uri);
    if (!force) {
      const cached = await cache.match(req);
      if (cached) return await cached.arrayBuffer();
    }
    const { data } = await axios.get(uri, axiosConfig());
    await cache.put(req, new Response(data, { headers: { "Content-Type": mime } }));
    return data as ArrayBuffer;
  }

  // In-memory cache.
  if (!force && memCache.has(uri)) {
    // Return a copy so the cached ArrayBuffer is never detached by the caller.
    return memCache.get(uri)!.slice(0);
  }
  const { data } = await axios.get(uri, axiosConfig());
  const buffer = (data as ArrayBuffer).slice(0);
  memCache.set(uri, buffer);
  return buffer;
}

/** Inject a @font-face rule once per font name. Returns the <style> element. */
function injectFace(meta: FontMeta, url: string): HTMLStyleElement {
  const id = `font-face-${meta.name.replace(/\s+/g, "-")}`;
  const existing = document.getElementById(id) as HTMLStyleElement | null;
  if (existing) return existing;
  const style = document.createElement("style");
  style.id = id;
  style.textContent =
    `@font-face{font-family:"${meta.name}";` +
    `src:url("${url}") format("${meta.format}");}`;
  document.head.appendChild(style);
  return style;
}

/** Override font-family on target elements; silent if they already use a font. */
function overrideFamily(target: string, family: string): HTMLElement[] {
  const hit: HTMLElement[] = [];
  document.querySelectorAll<HTMLElement>(target).forEach((el) => {
    try {
      if (!prevFamily.has(el)) prevFamily.set(el, el.style.fontFamily || "");
      el.style.setProperty("font-family", family, "important");
      hit.push(el);
    } catch {
      /* ignore elements that cannot be styled */
    }
  });
  return hit;
}

/** Wait until the font is usable before applying (avoids FOUT/FOIT). */
async function ensureReady(name: string): Promise<void> {
  const fonts = (document as unknown as { fonts?: FontFaceSet }).fonts;
  if (!fonts) return;
  try {
    await fonts.load(`16px "${name}"`);
    await fonts.ready;
  } catch {
    /* readiness errors are non-fatal */
  }
}

function register(entry: UseEntry): AppliedFont {
  // Schedule fetch + injection; apply() awaits this then overrides.
  const ready = (async (): Promise<FontMeta | null> => {
    if (!isBrowser) return null; // SSR guard
    try {
      const meta = await FONT_LOAD({
        name: entry.name,
        src: entry.src ?? entry.uri,
      });
      const isData = meta.uri.startsWith("data:");
      const base = meta.kind === "remote" ? conf.url_extern : conf.g_font_uri;
      const sourceUri = isData ? meta.uri : `${base}${meta.uri}`;

      let url: string;
      const rec = faces.get(meta.name);
      if (rec) {
        // Face already injected; reuse it.
        rec.refCount++;
        url = rec.blobUrl ?? meta.uri; // blobUrl or data:
      } else {
        if (isData) {
          url = meta.uri;
          faces.set(meta.name, {
            uri: "",
            styleEl: null,
            blobUrl: null,
            refCount: 1,
          });
        } else {
          const buffer = await fetchBuffer(sourceUri, meta.mime, entry.force);
          url = BodyParser.toBlobUrl(buffer, meta.mime);
          faces.set(meta.name, {
            uri: sourceUri,
            styleEl: null,
            blobUrl: url,
            refCount: 1,
          });
        }
      }

      const styleEl = injectFace(meta, url);
      const r = faces.get(meta.name)!;
      r.styleEl = styleEl;
      return meta;
    } catch (err) {
      entry.onError?.(err, entry);
      console.warn(`[CONFIG_FONT] failed to load "${entry.name}":`, err);
      return null;
    }
  })();

  return {
    name: entry.name,
    target: entry.target,
    async apply(): Promise<void> {
      const meta = await ready;
      if (!meta) return;
      await ensureReady(meta.name);
      overrideFamily(entry.target, `"${meta.name}"`);
    },
    revert(): void {
      void ready.then((meta) => {
        if (!meta) return;
        document.querySelectorAll<HTMLElement>(entry.target).forEach((el) => {
          const prev = prevFamily.get(el);
          if (prev !== undefined) {
            el.style.setProperty("font-family", prev, "");
          }
        });
      });
    },
    dispose(): void {
      void ready.then((meta) => {
        if (!meta) return;
        const rec = faces.get(meta.name);
        if (!rec) return;
        rec.refCount = Math.max(0, rec.refCount - 1);
        if (rec.refCount === 0) {
          rec.styleEl?.remove();
          if (rec.blobUrl) URL.revokeObjectURL(rec.blobUrl);
          if (rec.uri) memCache.delete(rec.uri);
          faces.delete(meta.name);
        }
      });
    },
  };
}

const CONFIG_FONT = {
  setConfig,
  getConfig,
  setCache,
  use,
};
export default CONFIG_FONT;
