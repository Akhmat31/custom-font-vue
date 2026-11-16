// src/types.ts
export type FontSourceKind = "local" | "remote";
/** Metadata produced by FONT_LOAD */
export interface FaceRecord {
  uri: string;
  styleEl: HTMLStyleElement | null;
  blobUrl: string | null;
  refCount: number;
}
export interface URICONF {
  /** Base URL prefixed to remote font sources*/
  url_extern: string;
  /** Base URL or path prefixed to local asset sources*/
  g_font_uri: string;
}
export interface FontMeta { /**R/O user metadata */
  readonly name: string;
  readonly kind: FontSourceKind;
  readonly uri: string;
  readonly origin: string;
  /** MIME type inferred from the source extension (e.g. "font/ttf"). */
  readonly mime: string;
  /** CSS @font-face format token (e.g. "truetype", "woff2"). */
  readonly format: string;
}
export type FontLoadInput = | string | { 
  name: string;
  src?: string;
  uri?: string;
  url?: string;
};
/** a single font application request*/
export interface UseEntry {
  /**custom font name defined by the user */
  name: string;
  /**css selector for the target */
  target: string;
  src?: string;
  uri?: string;
  onError?: (err: unknown, entry: UseEntry) => void;
  force?: boolean;
}
export interface AppliedFont {
  readonly name: string;
  readonly target: string;

  apply(): Promise<void>;
  revert(): void;
  dispose(): void;
}
export interface FontPluginOptions {
  conf?: Partial<URICONF>;
  cache?: boolean;
}