import { AppliedFont, UseEntry } from '../types';
/***
 * apidoc for <useFont>
 * Wraps CONFIG_FONT.use with automatic lifecycle tracking: every AppliedFont
 * returned through this composable is disposed when the hosting component
 * unmounts (releasing Blob URLs and injected <style>)
 */
export declare function useFont(): {
    use: {
        (entry: UseEntry): AppliedFont;
        (entries: UseEntry[]): AppliedFont[];
    };
    setConfig: typeof import('../config-font').setConfig;
    getConfig: typeof import('../config-font').getConfig;
    setCache: typeof import('../config-font').setCache;
};//# sourceMappingURL=composable.d.ts.map