// src/source.ts
// FONT_LOAD — acts as *naming only*: it inspects a font reference and
// returns metadata describing its kind (local/remote), URI, MIME type and
// CSS @font-face format token. It does NOT fetch anything; the actual
// fetch + injection is performed by config-font.ts.

import type { FontLoadInput, FontMeta, FontSourceKind } from "../types";

const URL_LIKE = /^(https?:)?\/\//i;
const DATA_LIKE = /^data:/i;

interface FormatEntry {
  ext: string;
  mime: string;
  format: string;
}

// Order matters: check woff2 before woff (extension prefix overlap is fine
// because we match by suffix), and keep ttf as the final fallback.
const FORMAT_TABLE: readonly FormatEntry[] = [
  { ext: ".woff2", mime: "font/woff2", format: "woff2" },
  { ext: ".woff", mime: "font/woff", format: "woff" },
  { ext: ".otf", mime: "font/otf", format: "opentype" },
  { ext: ".ttf", mime: "font/ttf", format: "truetype" },
] as const;

/** Infer MIME + @font-face format token from the reference extension. */
function detectFormat(ref: string): FormatEntry {
  const clean = ref.toLowerCase().split("?")[0].split("#")[0];
  return FORMAT_TABLE.find((f) => clean.endsWith(f.ext)) ?? FORMAT_TABLE[3];
}

/**
 * FONT_LOAD
 *
 * - URL (http/https) or data: → "remote".
 * - Anything else (e.g. "../../assets/font/source.ttf") → "local";
 *   the bundler resolves such a string into a URL at build time.
 */
export default async function FONT_LOAD(
  param: FontLoadInput
): Promise<FontMeta> {
  const input =
    typeof param === "string" ? { name: param, src: param } : param;

  const name = input.name;
  const ref = input.src ?? input.uri ?? input.url ?? input.name;

  let kind: FontSourceKind;
  let uri: string;

  if (DATA_LIKE.test(ref)) {
    kind = "remote";
    uri = ref;
  } else if (URL_LIKE.test(ref)) {
    kind = "remote";
    uri = ref;
  } else {
    kind = "local";
    uri = ref;
  }

  const { mime, format } = detectFormat(ref);
  return { name, kind, uri, origin: ref, mime, format };
}
