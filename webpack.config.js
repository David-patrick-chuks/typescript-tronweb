const path = require('path');
const externals = require('webpack-node-externals');

const basePlugins = [
    '@babel/plugin-proposal-numeric-separator',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-transform-runtime',
    '@babel/plugin-proposal-object-rest-spread',
];

const mode = process.env.NODE_ENV || 'production';

const baseConfig = {
    entry: path.resolve(__dirname, 'src', 'index.ts'),
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-typescript',
                            [
                                '@babel/env',
                                {
                                    targets: {
                                        browsers: ['>0.25%', 'not dead'],
                                    },
                                },
                            ],
                        ],
                        plugins: basePlugins,
                    },
                },
            },
        ],
    },
    resolve: {
        modules: ['node_modules', path.resolve(__dirname, 'src')],
        extensions: ['.ts', '.js'],
        fallback: {
            querystring: require.resolve('querystring-es3'),
        },
    },
    devtool: 'source-map',
    node: {
        fs: 'empty',
    },
    mode,
};

const nodePlugins = [...basePlugins];
if (mode === 'development') nodePlugins.push('source-map-support');

module.exports = [
    {
        ...baseConfig,
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'TronWeb.node.js',
            libraryTarget: 'commonjs2',
            libraryExport: 'default',
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                '@babel/preset-typescript',
                                [
                                    '@babel/env',
                                    {
                                        targets: {
                                            node: 'current',
                                        },
                                        forceAllTransforms: true,
                                    },
                                ],
                            ],
                            plugins: nodePlugins,
                        },
                    },
                },
            ],
        },
        externals: [externals()],
        target: 'node',
        node: {
            fs: 'empty',
        },
    },
    {
        ...baseConfig,
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: 'TronWeb.js',
            library: 'TronWeb',
            libraryTarget: 'umd',
            libraryExport: 'default',
            umdNamedDefine: true,
        },
    },
];
