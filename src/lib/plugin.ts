import TronWeb from 'index';
import utils from 'utils';
import semver from 'semver';

export default class Plugin {
    constructor(tronWeb = false, options = {}) {
        if (!tronWeb || !tronWeb instanceof TronWeb)
            throw new Error('Expected instance of TronWeb');
        this.tronWeb = tronWeb;
        this.pluginNoOverride = ['register'];
        this.disablePlugins = options.disablePlugins;
    }

    register(Plugin, options) {
        let pluginInterface = {
            requires: '0.0.0',
            components: {},
        };
        const result = {
            libs: [],
            plugged: [],
            skipped: [],
        };
        if (this.disablePlugins) {
            result.error = 'This instance of TronWeb has plugins disabled.';
            return result;
        }
        const plugin = new Plugin(this.tronWeb);
        if (utils.isFunction(plugin.pluginInterface))
            pluginInterface = plugin.pluginInterface(options);

        if (semver.satisfies(TronWeb.version, pluginInterface.requires)) {
            if (pluginInterface.fullClass) {
                // plug the entire class at the same level of tronWeb.trx
                const className = plugin.constructor.name;
                const classInstanceName =
                    className.substring(0, 1).toLowerCase() +
                    className.substring(1);
                if (className !== classInstanceName) {
                    TronWeb[className] = Plugin;
                    this.tronWeb[classInstanceName] = plugin;
                    result.libs.push(className);
                }
            } else {
                // plug methods into a class, like trx
                for (const component in pluginInterface.components) {
                    if (!this.tronWeb.hasOwnProperty(component)) continue;

                    const methods = pluginInterface.components[component];
                    const pluginNoOverride =
                        this.tronWeb[component].pluginNoOverride || [];
                    for (const method in methods) {
                        if (
                            method === 'constructor' ||
                            (this.tronWeb[component][method] &&
                                (pluginNoOverride.includes(method) || // blacklisted methods
                                    /^_/.test(method))) // private methods
                        ) {
                            result.skipped.push(method);
                            continue;
                        }
                        this.tronWeb[component][method] = methods[method].bind(
                            this.tronWeb[component]
                        );
                        result.plugged.push(method);
                    }
                }
            }
        } else {
            throw new Error(
                'The plugin is not compatible with this version of TronWeb'
            );
        }
        return result;
    }
}
