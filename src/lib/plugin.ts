import semver from 'semver';

import TronWeb from '..';
import utils from '../utils';

export interface IPluginRegisterResult {
    libs: string[];
    plugged: string[];
    skipped: string[];
    error?: string;
}
export interface IPluginDefn {
    // TODO: it can be better
    requires?: string;
    // eslint-disable-next-line @typescript-eslint/ban-types
    components?: Record<string, Record<string, Function>>;
    fullClass?: boolean;
}

export interface IPlugin<T extends Record<string, unknown> | null | unknown> {
    pluginInterface?: (options?: T) => IPluginDefn;
}
type Class<I, Args extends any[] = any[]> = new (...args: Args) => I;

export default class Plugin {
    tronWeb: TronWeb;
    pluginNoOverride: string[];
    disablePlugins: string[] | undefined;

    constructor(tronWeb: TronWeb, options: {disablePlugins?: string[]} = {}) {
        if (!tronWeb || !(tronWeb instanceof TronWeb))
            throw new Error('Expected instance of TronWeb');
        this.tronWeb = tronWeb;
        this.pluginNoOverride = ['register'];
        this.disablePlugins = options.disablePlugins;
    }

    register<T>(PluginCls: Class<IPlugin<T>>, options?: T) {
        let pluginInterface: IPluginDefn = {
            requires: '0.0.0',
            components: {},
        };
        const result: IPluginRegisterResult = {
            libs: [],
            plugged: [],
            skipped: [],
        };
        if (this.disablePlugins) {
            result.error = 'This instance of TronWeb has plugins disabled.';
            return result;
        }
        const plugin = new PluginCls(this.tronWeb);
        if (utils.isFunction(plugin.pluginInterface))
            pluginInterface = plugin.pluginInterface(options);

        if (
            !pluginInterface.requires ||
            semver.satisfies(TronWeb.version, pluginInterface.requires)
        )
            if (pluginInterface.fullClass) {
                // plug the entire class at the same level of tronWeb.trx
                const className = plugin.constructor.name;
                const classInstanceName =
                    className.substring(0, 1).toLowerCase() +
                    className.substring(1);
                if (className !== classInstanceName) {
                    TronWeb[className] = PluginCls;
                    this.tronWeb[classInstanceName] = plugin;
                    result.libs.push(className);
                }
            } else {
                // plug methods into a class, like trx
                for (const component in pluginInterface.components) {
                    if (
                        !Object.prototype.hasOwnProperty.call(
                            this.tronWeb,
                            component,
                        )
                    )
                        continue;

                    const methods = pluginInterface.components[component];
                    const pluginNoOverride =
                        this.tronWeb[component].pluginNoOverride || [];
                    for (const method in methods) {
                        if (
                            method === 'constructor' ||
                            (this.tronWeb[component][method] &&
                                // blacklisted methods
                                (pluginNoOverride.includes(method) ||
                                    // private methods
                                    /^_/.test(method)))
                        ) {
                            result.skipped.push(method);
                            continue;
                        }
                        this.tronWeb[component][method] = methods[method].bind(
                            this.tronWeb[component],
                        );
                        result.plugged.push(method);
                    }
                }
            }
        else
            throw new Error(
                'The plugin is not compatible with this version of TronWeb',
            );

        return result;
    }
}
