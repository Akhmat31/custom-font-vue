<h1 align="center">custom-font-vue</h1>
<p align="center">
  A Vue 3 plugin to load <b>local &amp; remote</b> fonts with CSP-friendly Blob URL inlining,
  full lifecycle management, and optional persistent caching.
</p>

---

> ## Quickstart

```shell
npm install custom-font-vue axios vue
```

Register the plugin once, then apply fonts from anywhere:

```ts
// main.ts
import { createApp } from "vue";
import App from "./App.vue";
import { VueFontPlugin } from "custom-font-vue";

const app = createApp(App);
app.use(VueFontPlugin, {
  conf: { url_extern: "https://cdn.example.com/" },
  cache: true,
});
app.mount("#app");
```

```vue
<!-- App.vue -->
<script setup lang="ts">
import { onMounted } from "vue";
import { useFont } from "custom-font-vue";

const { use } = useFont();

const hero = use({ name: "Courier", target: "#hero", src: "https://cdn.example.com/courier.ttf" });
const editors = use([
  { name: "Consolas", target: "#editor", src: "https://cdn.example.com/consolas.ttf" },
  { name: "Gsans",    target: "#editor", uri: "https://cdn.example.com/gsans.ttf" },
]);

onMounted(() => {
  void hero.apply();
  editors.forEach((f) => void f.apply());
});
</script>
```

> [!TIP]
> Call `apply()` inside `onMounted`. It is async (awaits `document.fonts` readiness) but safe to fire-and-forget — the previous `font-family` is captured in a `WeakMap` and restored by `revert()`.

Loading a remote `@font-face` directly is surprisingly painful: the browser issues a **cross-origin request** for the font file, which is frequently blocked or degraded by **CORS** headers and `font-src` CSP rules. The result is flicker, silent fallback to a system font, or a console full of policy violations.

**custom-font-vue resolves this by indirection.** The plugin fetches the font binary itself (same-origin, via **axios**), converts it to an **opaque Blob URL**, and injects a `@font-face` rule pointing at that URL. The browser never makes a cross-origin request for the font — it only needs to allow the locally-created Blob.

* **Local &amp; Remote, one API**: a bundler asset import and an HTTPS URL are both just `{ name, target, src }`.
* **No base64 bloat**: Blob URLs carry no 33% size overhead and do not inflate your DOM with megabytes of inline data.
* **Silent override**: elements already styled with an external font are overridden without throwing.
* **Real lifecycle**: `apply` / `revert` / `dispose` with refcount-aware cleanup — Blob URLs are revoked, `<style>` pruned, caches dropped.
* **SSR-friendly**: safe to import in Nuxt and other SSR stacks.

## What's Included?

<table width="100%" style="border-collapse: collapse; border: none;"><tr style="border: none;"><td width="33%" valign="top" style="border: none; padding: 8px;"><h4><b>Local & Remote</b></h4><p style="font-size: 0.9em; line-height: 1.45;">Load from a bundler-resolved asset path (<code>import x from &quot;./f.ttf&quot;</code>) or any HTTP/data URL — same API, one <code>use()</code> call.</p></td><td width="33%" valign="top" style="border: none; padding: 8px;"><h4><b>Blob URL Inlining</b></h4><p style="font-size: 0.9em; line-height: 1.45;">Binary fetched via axios and exposed as an opaque Blob URL, sidestepping cross-origin header issues without a 33% base64 tax.</p></td><td width="33%" valign="top" style="border: none; padding: 8px;"><h4><b>MIME Auto-Detection</b></h4><p style="font-size: 0.9em; line-height: 1.45;"><code>@font-face</code> format token (<code>woff2</code> / <code>woff</code> / <code>opentype</code> / <code>truetype</code>) inferred from the source extension.</p></td></tr><tr style="border: none;"><td width="33%" valign="top" style="border: none; padding: 8px;"></td></tr></table>


1. **Naming &amp; detection** — `FONT_LOAD` inspects the reference and returns metadata: `kind` (`local` / `remote`), the resolved `uri`, and the `mime` + `@font-face` `format` token inferred from the extension (`.woff2`, `.woff`, `.otf`, `.ttf`; unknown defaults to `truetype`).
2. **Fetch** — `axios.get(uri, { responseType: "arraybuffer" })` retrieves the binary with a minimal `Accept` header and no JSON transform, avoiding CORS pre-flight where possible.
3. **Body parsing** — `BodyParser.toBlobUrl()` wraps the `ArrayBuffer` in a `Blob` and creates an opaque `blob:` URL. This is the step that neutralizes cross-origin header problems.
4. **Injection** — a single `@font-face` rule per font name is appended to `<head>` (idempotent; reused across handles).
5. **Readiness** — `document.fonts.load()` + `fonts.ready` are awaited so the family switch does not flash an invisible fallback.
6. **Override** — `font-family` is set with `!important` on each matched element; the previous value is saved in a `WeakMap` so `revert()` is lossless. Failures are swallowed (silent override).

> [!NOTE]
> The `@font-face` rule per name is **idempotent**: registering the same name twice reuses the injected style and bumps a refcount, so multi-select on the same target never duplicates rules.

## Usage

### As a Vue plugin (recommended)

```ts
// main.ts
import { createApp } from "vue";
import App from "./App.vue";
import { VueFontPlugin } from "custom-font-vue";

createApp(App).use(VueFontPlugin, {
  conf: { url_extern: "https://cdn.example.com/", g_font_uri: "/assets/" },
  cache: true,
}).mount("#app");
```

### Composable (auto-dispose on unmount)

```vue
<script setup lang="ts">
import { onMounted } from "vue";
import { useFont } from "custom-font-vue";
import localMono from "./assets/font/source.ttf"; // bundler -> URL string

const { use, setConfig } = useFont();

const single = use({ name: "Courier", target: "#hero", src: localMono });
const multi = use([
  { name: "Consolas", target: "#editor", src: "https://cdn.example.com/consolas.ttf" },
  { name: "Gsans",    target: "#editor", uri: "https://cdn.example.com/gsans.ttf" },
]);

onMounted(() => {
  void single.apply();
  multi.forEach((f) => void f.apply());
});
</script>
```

### Imperative (framework-agnostic)

```ts
import { CONFIG_FONT } from "custom-font-vue";

const f = CONFIG_FONT.use({ name: "Courier", target: "#x", src: "https://cdn.example.com/c.ttf" });
await f.apply();   // inject @font-face + override font-family
f.revert();        // restore previous font-family
f.dispose();       // revoke Blob URL + remove <style> (refcount-aware)
```

## API Reference

#### `FONT_LOAD(input)` — naming/detection only

Returns `FontMeta` = `{ name, kind, uri, origin, mime, format }`. `kind` is `"local"` (asset path) or `"remote"` (URL / `data:`). MIME and format are inferred from the extension; unknown extensions default to `font/ttf` / `truetype`.

#### `CONFIG_FONT`

| Method | Signature | Description |
| :--- | :--- | :--- |
| `setConfig` | `(partial: Partial<URICONF>) => URICONF` | Merge global URI config (`url_extern`, `g_font_uri`). |
| `getConfig` | `() => URICONF` | Return a copy of the current config. |
| `setCache` | `(enabled: boolean) => void` | Enable/disable persistent Cache API caching. |
| `use` | `(entry) => AppliedFont`<br>`(entries[]) => AppliedFont[]` | Register font(s); returns a handle or array of handles. |

#### `AppliedFont`

| Method | Signature | Description |
| :--- | :--- | :--- |
| `apply` | `() => Promise<void>` | Fetch (cached) → inject `@font-face` → await `document.fonts` → override `font-family` on target. Silent on existing fonts. |
| `revert` | `() => void` | Restore the previous `font-family` captured in the `WeakMap`. |
| `dispose` | `() => void` | Decrement refcount; when 0, remove `<style>`, revoke Blob URL, drop the in-memory cache entry. |

#### `UseEntry`

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | Custom font name defined by the user. |
| `target` | `string` | CSS selector for the target element(s). |
| `src` / `uri` | `string?` | Local asset path/URL or remote URL (`uri` is an alias of `src`). |
| `onError` | `(err, entry) => void?` | Called (per entry) if loading fails. |
| `force` | `boolean?` | Bypass the cache and force a fresh fetch. |

#### `useFont()`

Composable wrapping `CONFIG_FONT.use` with automatic `dispose()` on component unmount. Also re-exposes `setConfig` / `getConfig` / `setCache`.

#### `VueFontPlugin`

Vue plugin: `app.use(VueFontPlugin, options)` where `options: { conf?: Partial<URICONF>, cache?: boolean }`.

## <center> Installation </center>

```shell
npm install custom-font-vue axios vue
```

`axios` is a direct dependency (used for the binary fetch); `vue` is a peer dependency.

### Alternative Installation Methods

<details>
<summary><b>From a local tarball</b> (recommended for unreleased builds)</summary>

```shell
# build once in the plugin source
npm run build && npm pack        # -> custom-font-vue-0.1.0.tgz

# install into your app
npm install /path/to/custom-font-vue-0.1.0.tgz
npm install axios vue
rm -rf node_modules/.vite        # reset the Vite optimizer cache
npm run dev
```

`npm install <tarball>` lays the package out correctly in `node_modules/custom-font-vue/` and wires `axios` as a dependency automatically.
</details>

<details>
<summary><b>Local symlink</b> (best for active development)</summary>

```shell
# from your app root
ln -s /path/to/custom-font-vue node_modules/custom-font-vue
rm -rf node_modules/.vite
npm run dev
```

Edits to the plugin source rebuild into `dist/` and are picked up on the next reload.
</details>

<details>
<summary><b>Manual copy</b> (no package manager)</summary>

Place **both** `package.json` and `dist/` under `node_modules/custom-font-vue/` — copying only `dist/` will fail to resolve because Vite reads the `exports` map from `package.json`:

```
node_modules/custom-font-vue/
├── package.json
├── README.md
└── dist/
    ├── custom-font-vue.js
    ├── custom-font-vue.umd.cjs
    └── index.d.ts  (+ *.d.ts)
```

```shell
npm install axios vue
rm -rf node_modules/.vite
npm run dev
```
</details>

<details>
<summary><b>Import map / CDN</b></summary>

```html
<script type="importmap">
{
  "imports": {
    "vue": "https://esm.sh/vue@3",
    "axios": "https://esm.sh/axios@1",
    "custom-font-vue": "https://esm.sh/custom-font-vue@0.1.0"
  }
}
</script>
```
</details>

> [!IMPORTANT]
> After adding the package to `node_modules` by any non-`npm install` method, **clear the Vite optimizer cache** (`rm -rf node_modules/.vite`) and restart the dev server — otherwise the stale dependency graph keeps reporting `Failed to resolve import "custom-font-vue"`.

## CSP &amp; Security

This plugin does **not** bypass or disable Content Security Policy. It only sidesteps **cross-origin header (CORS)** problems during the fetch. Your page CSP must still allow:

| Directive | Requirement | Example |
| :--- | :--- | :--- |
| `style-src` | Allow the injected `<style>` element. | `style-src 'self' 'unsafe-inline'` |
| `font-src` | Allow the Blob URL. | `font-src self blob:` |

If your policy disallows `blob:` fonts or inline `<style>`, the plugin cannot work without adjusting the policy.

> [!NOTE]
> Only **named exports** are provided — use `import { VueFontPlugin, useFont, CONFIG_FONT } from "custom-font-vue"`, never a default import.

## Lifecycle &amp; Memory

* **No DOM pollution**: the previous `font-family` is stored in a `WeakMap<HTMLElement, string>` — no ad-hoc properties are attached to DOM nodes, and entries are garbage-collected with the elements.
* **Refcount-aware cleanup**: multiple handles for the same font name share one `<style>` and one Blob URL; `dispose()` only revokes the URL and removes the style when the last handle is disposed.
* **Idempotent injection**: registering the same name twice never duplicates the `@font-face` rule.
* **Auto-dispose**: `useFont()` registers an `onUnmounted` hook that disposes every handle it created when the component unmounts.
* **Cache tiers**: in-memory `Map` by default; opt into the persistent Cache API (`caches.open("vue-font-loader")`) via `setCache(true)` or the plugin `cache: true` option.

## SSR

Every DOM touch is guarded by an `isBrowser` check. On the server, `register()` returns a handle whose `apply()` is a no-op, so the plugin is safe to import in SSR setups (Nuxt, Vite SSR, etc.). Always call `apply()` inside `onMounted` so it only runs in the browser.

## Development

```shell
git clone <repo> custom-font-vue
cd custom-font-vue
npm install

npm run typecheck   # vue-tsc --noEmit
npm run build       # typecheck + vite build (ESM + UMD + .d.ts)
npm test            # vitest run (jsdom)
npm run test:watch  # vitest in watch mode
```

The test suite (16 cases across `source`, `config-font`, and `plugin`) runs in jsdom and covers detection, injection, override, revert, dispose + Blob URL revocation, `onError`, array multi-select, and silent override on pre-styled elements.

## License

[MIT](./LICENSE) © custom-font-vue contributors.