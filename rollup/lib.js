import json from 'rollup-plugin-json'
import commonjs from 'rollup-plugin-commonjs'
import uglify from 'rollup-plugin-uglify'
import { minify } from 'uglify-es'

export default {
  input: 'src/wn.js',
  output: {
    file: 'dist/wn.js',
    format: 'cjs',
  },
  plugins: [
    json(),
    commonjs(),
    process.env.BUILD === 'production' ? uglify({}, minify) : false,
  ],
}
