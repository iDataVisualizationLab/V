4.
import resolve from 'rollup-plugin-node-resolve';
import commonJS from 'rollup-plugin-commonjs'

export default {
    input: 'src/scripts/dimensionalityreduction.js',
    output: {
        file: 'build/js/dimensionalityreduction.min.js',
        format: 'iife',
        sourcemap: 'inline',
    },
    plugins: [
        resolve(),
        commonJS({
            include: ['node_modules/**']
        })
    ]
};
