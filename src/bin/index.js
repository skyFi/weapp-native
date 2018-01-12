import fs from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'
import chalk from 'chalk'
import chokidar from 'chokidar'
import minimist from 'minimist'
import rollup from 'rollup'
import rp_babel from 'rollup-plugin-babel'
import { invert, remove } from 'lodash'

import helpInfo from './help.zh.md'
import { version } from '../../package.json'
import transform from './transform'

const prompt = (str, ...rest) => console.log(
  chalk.greenBright.bold(`${str}`, rest),
)
const help = () => {
  console.log(`\n${helpInfo.replace('__VERSION__', version)}\n`)
}
const error = (str, ...rest) => console.log(
  chalk.red.bold(`[ERR] ${str}`, rest),
)
const INFO_TYPE = {
  app: '应用',
  page: '页面',
  component: '组件',
  template: '模版',
  local_module: '模块',
  node_module: 'NPM包',
  game: '游戏',
}
const info = (type, str, ...rest) => console.log(
  chalk.cyanBright.bold(`[${INFO_TYPE[type]}]\t`),
  chalk.dim.bold(`${str}`, rest),
)

function copyNodeModule(source, target) {
  const modulesPath = path.join(target, 'modules')
  const type = 'node_module'
  let nodeModuleSource
  let name
  let filePath

  if (source === 'wn') {
    name = 'wn-cli'
    nodeModuleSource = path.resolve('node_modules', name, 'dist', `${source}.js`)
    filePath = path.join(modulesPath, `${source}.js`)
  } else {
    name = source
    nodeModuleSource = path.resolve('node_modules', name, 'dist', `${name}.js`)
    filePath = path.join(modulesPath, `${name}.js`)
    // Let`s guess
    if (!fs.existsSync(nodeModuleSource)) nodeModuleSource = path.resolve('node_modules', name, `${name}.js`)
    if (!fs.existsSync(nodeModuleSource)) return error(`无法加载 ${name}`)
  }

  if (!fs.existsSync(modulesPath)) mkdirp.sync(modulesPath)
  if (!fs.existsSync(filePath)) {
    fs.copyFileSync(nodeModuleSource, filePath)
    info(type, path.relative('', nodeModuleSource))
  }
}

async function scan(input, target) {
  const inputOptions = {
    input,
    // external: ['wn'],
    plugins: [
      rp_babel({
        exclude: 'node_modules/**',
        babelrc: false,
        presets: [
          '@babel/preset-react',
        ],
        plugins: [
          '@babel/plugin-proposal-object-rest-spread',
          '@babel/plugin-proposal-class-properties'
        ]
      }),
    ],
    onwarn({ code, source, importer, names, message, url }) {
      switch(code) {
        case 'UNRESOLVED_IMPORT': {
          copyNodeModule(source, target)
          return
        }
        case 'UNUSED_EXTERNAL_IMPORT': return
        case 'NON_EXISTENT_EXPORT': return
        default: {
          error(message)
        }
      }

    }
  }
  let bundle
  try {
    bundle = await rollup.rollup(inputOptions)
  } catch(err) {
    err.SyntaxError && error('??', err.SyntaxError)
    throw err
  }

  const modules = {} 
  const referenced = {}
  bundle.modules.forEach(function({ id, dependencies, originalCode, resolvedIds }) {
    // if (!dependencies.length) return
    if (id === 'rollupPluginBabelHelpers') return
    remove(dependencies, id => id === 'rollupPluginBabelHelpers')
    dependencies.forEach(function(refId) {
      if (refId === 'rollupPluginBabelHelpers') return

      if (!Array.isArray(referenced[refId])) referenced[refId] = []
      referenced[refId].push(path.relative(refId, id))
    })
    const resolved = invert(resolvedIds)
    modules[id] = {
      id,
      // ast,
      depended: dependencies,
      code: originalCode,
      // cjs: code,
      resolved,
      // resolvedExternalIds,
    }
  })

  return {
    modules,
    referenced,
    main: bundle.modules[bundle.modules.length - 1].id,
  }
}

function writeOutput(output, paths) {
  const { id, type, js, } = output
  const { target, src } = paths
  const { name, dir } = path.parse(path.join(target, path.relative(src, id)))
  const dirname = /page|component/.test(type) ? path.resolve(dir, name) : dir

  if (type) {
    info(type, path.relative(src, id))
    if (!fs.existsSync(dirname)) mkdirp.sync(dirname)
    Object.entries(output).forEach(function([fileSuffix, data]) {
      if (data && /json|js|wxml|wxss|css/.test(fileSuffix)) {
        if (fileSuffix === 'css') {
          fileSuffix = 'wxss'
        }
        const filePath = path.join(dirname, `${name}.${fileSuffix}`)
        fs.writeFileSync(filePath, data)
      }
    })
  } else {
    error(id, js)
  }
}

function gen(id, modules, transformedModules, paths, referenced) {
  const { depended,code } = modules[id]
  if (depended.length) {
    depended.reduce((transformedModules, id) => gen(id, modules, transformedModules, paths, referenced), transformedModules)
    if (!transformedModules[id]) {
      const dependedModules = depended.reduce((dependedModules, dependedId) => (dependedModules[dependedId] = transformedModules[dependedId]) && dependedModules, {})
      transformedModules[id] = Object.assign({ id }, transform({ id, code, dependedModules, referencedBy: referenced[id], sourcePath: paths.src }))
      writeOutput(transformedModules[id], paths)
    }
  } else {
    if (!transformedModules[id]) {
      transformedModules[id] = Object.assign({ id }, transform({ id,  code, referencedBy: referenced[id], sourcePath: paths.src }))
      writeOutput(transformedModules[id], paths)
    }
  }
  return transformedModules
}


async function build(sourcePath, targetPath) {
  const source = fs.statSync(sourcePath).isDirectory() ? path.join(sourcePath, 'app.jsx') : sourcePath
  const target = path.isAbsolute(targetPath) ? targetPath : path.resolve(targetPath)

  const {
    modules,
    referenced,
    main,
  } = await scan(source, target)
  const transformedModules = {}
  const src = path.parse(path.resolve(source)).dir

  console.log('SCANNED', Object.keys(modules))
  gen(main, modules, transformedModules, { target, src }, referenced)
  return modules
}

(async function () {
  const command = minimist(process.argv.slice(2), {
    alias: {
      w: 'watch',
      v: 'version',
      h: 'help',
    }
  })
  const [sourcePath, targetPath = './dist'] = command._

  if (command.help || (process.argv.length <= 2 && process.stdin.isTTY)) {
    help()
    return
  } else if (command.version) {
    prompt(`wn 版本 ${version}`)
    return
  } else if (!sourcePath) {
    prompt('请输入源码目录路径或app.jsx, game.js文件路径')
    return
  } else if (!targetPath) {
    prompt('请输入生成小程序的目标路径，默认为当前目录下./dist')
    return
  }

  let modules
  try {
    modules = await build(sourcePath, targetPath)
    const now = new Date
    prompt(`[${now.toLocaleDateString()} ${now.toLocaleTimeString()}] 生成${targetPath}`)
  } catch (e) {
    error(e)
  }


  if (command.watch) {
    try {
      const watcher = chokidar.watch(Object.keys(modules))

      watcher.on('change', async function(path) {
        modules = await build(sourcePath, targetPath)
        const now = new Date
        prompt(`[${now.toLocaleDateString()} ${now.toLocaleTimeString()}] 更新`)
        watcher.add(Object.keys(modules))
      })

      watcher.on('error', function(err) {
        error(err)
      })
    } catch (e) {
      error('因错退出监听模式', e) 
    }
  }

})()
