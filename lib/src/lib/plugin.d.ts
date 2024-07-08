import TronWeb from '..';
export interface IPluginRegisterResult {
    libs: string[];
    plugged: string[];
    skipped: string[];
    error?: string;
}
export interface IPluginDefn {
    requires?: string;
    components?: Record<string, Record<string, Function>>;
    fullClass?: boolean;
}
export interface IPlugin<T extends Record<string, unknown> | null | unknown> {
    pluginInterface?: (options?: T) => IPluginDefn;
}
declare type Class<I, Args extends any[] = any[]> = new (...args: Args) => I;
export default class Plugin {
    tronWeb: TronWeb;
    pluginNoOverride: string[];
    disablePlugins: string[] | undefined;
    constructor(tronWeb: TronWeb, options?: {
        disablePlugins?: string[];
    });
    register<T>(PluginCls: Class<IPlugin<T>>, options?: T): IPluginRegisterResult;
}
export {};
//# sourceMappingURL=plugin.d.ts.map