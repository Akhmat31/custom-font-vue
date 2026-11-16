/** Global URI configuration (set via plugin options or setConfig). */
export interface URICONF {
    /** Base URL prefixed to remote font sources. */
    url_extern: string;
    /** Base URL/path prefixed to local asset sources. */
    g_font_uri: string;
}
export type FontSourceKind = "local" | "remote";
/** Metadata produced by FONT_LOAD (naming/detection stage). */
export interface FontMeta {
    /** Custom font name defined by the user. */
    readonly name: string;
    /** Origin of the source: local asset bundle or remote URL. */
    readonly kind: FontSourceKind;
    /** URI ready to be fetched. */
    readonly uri: string;
    /** Raw reference from the caller (for debugging/audit). */
    readonly origin: string;
    /** MIME type inferred from the source extension (e.g. "font/ttf"). */
    readonly mime: string;
    /** CSS @font-face format token (e.g. "truetype", "woff2"). */
    readonly format: string;
}
export type FontLoadInput = string | {
    name: string;
    src?: string;
    uri?: string;
    url?: string;
};
export interface FaceRecord {
  uri: string;
  styleEl: HTMLStyleElement | null;
  blobUrl: string | null;
  refCount: number;
}
/** A single font application request. */
export interface UseEntry {
    /** Custom font name defined by the user. */
    name: string;
    /** CSS selector for the target element(s). */
    target: string;
    /** Local asset path/URL or remote URL. Alias: `uri`. */
    src?: string;
    uri?: string;
    /** Called (per entry) if loading fails. */
    onError?: (err: unknown, entry: UseEntry) => void;
    /** Bypass the cache and force a fresh fetch. */
    force?: boolean;
}
/** Handle returned by `use()`: apply / revert / dispose lifecycle. */
export interface AppliedFont {
    readonly name: string;
    readonly target: string;
    /** Apply the font-family to target elements (waits for font readiness). */
    apply(): Promise<void>;
    /** Restore the previous font-family on target elements. */
    revert(): void;
    /** Release Blob URLs, in-memory cache and the injected <style> for this entry. */
    dispose(): void;
}
/** Options accepted by the Vue plugin `install()`. */
export interface FontPluginOptions {
    /** Initial URI configuration. */
    conf?: Partial<URICONF>;
    /** Use the persistent Cache API for binary font data across sessions. */
    cache?: boolean;
}
//# sourceMappingURL=types.d.ts.map