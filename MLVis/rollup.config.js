import typescript from 'rollup-plugin-typescript';
import resolve from 'rollup-plugin-node-resolve';
import commonJS from 'rollup-plugin-commonjs'
export default {
    input: 'src/scripts/index.js',
    output:{
        file:'build/js/index.min.js',
        format: 'iife',
        sourcemap: 'inline',
    },
    onwarn: warning => {  // overwite the default warning function
        const str = warning.toString();
        if (str.indexOf("Circular dependency")>=0)
        else{
            console.log(str);
        }
    },
    plugins: [
        resolve(),
        commonJS({
            include: ['node_modules/**']
        }),
        typescript()
    ]
};
