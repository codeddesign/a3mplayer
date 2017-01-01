import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';

/**
 * Env defaults
 */

const env = {
    name: process.env.build || 'production',
};

/**
 * Plugins list.
 */

const plugins = [
    // babel({
    //     babelrc: false,
    //     presets: ['es2015-rollup'],
    //     exclude: 'node_modules/**'
    // }),

    babel({
        babelrc: false,
        "presets": [
            ["es2015", { "modules": false }]
        ],
        "plugins": [
            "external-helpers"
        ]
    }),

    replace({
        ENVIRONMENT: JSON.stringify(env.name)
    }),

    resolve({
        jsnext: true,
        module: true
    }),

    commonjs({})
];

/**
 * Adjustments based on build.
 */

if (env.name == 'production') {
    // add uglify in production
    plugins.push(
        uglify()
    );
}


/**
 * Export Config.
 */

export default {
    format: 'iife',
    plugins: plugins
};
