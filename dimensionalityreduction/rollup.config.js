import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
    input: 'src/scripts/dimensionalityreduction.js',
    output: {
        file: 'build/js/dimensionalityreduction.min.js',
        format: 'iife',
        sourcemap: 'inline',
    },
    plugins: [
        resolve({ preferBuiltins: true }),
        commonjs({
            include: ['node_modules/**']
        }),
    ]
};
