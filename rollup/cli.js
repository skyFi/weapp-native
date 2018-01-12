import string from 'rollup-plugin-string'
import json from 'rollup-plugin-json'
import commonjs from 'rollup-plugin-commonjs'
import uglify from 'rollup-plugin-uglify'
import { minify } from 'uglify-es'
import { dependencies } from '../package.json'

const external = [...Object.keys(dependencies), 'fs', 'path']
export default {
  input: 'src/bin/index.js',
  output: {
    file: 'dist/wn-cli',
    format: 'cjs',
    banner: '#!/usr/bin/env node',
  },
  plugins: [
    json(),
    string({ include: '**/*.md' }),
    commonjs({
      sourceMap: false,
      namedExports: {
        'src/bin/transform.js': ['transform'],
      },
      ignore: [
        '@babel/traverse',
        '@babel/generator',
      ]
    }),
    process.env.BUILD === 'production' ? uglify({}, minify) : false,
  ],
  external,
}
