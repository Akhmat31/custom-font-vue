import { AppliedFont, URICONF, UseEntry } from './types';

export declare function setConfig(next: Partial<URICONF>): URICONF;
export declare function getConfig(): URICONF;
/** Enable/disable persistent binary cache via the Cache API */
export declare function setCache(enabled: boolean): void;
/** Single entry -> AppliedFont; array -> AppliedFont[]*/
declare function use(entry: UseEntry): AppliedFont;
declare function use(entries: UseEntry[]): AppliedFont[];
declare const CONFIG_FONT: {
    setConfig: typeof setConfig;
    getConfig: typeof getConfig;
    setCache: typeof setCache;
    use: typeof use;
};
export default CONFIG_FONT;
//# sourceMappingURL=config-font.d.ts.map