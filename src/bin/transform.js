const babylon = require('babylon')
const traverse = require('@babel/traverse').default
const t = require('@babel/types')
const generate = require('@babel/generator').default
const { transformSync: transformFrom } = require('@babel/core')
const prettifyXml = require('prettify-xml')
const { zip } = require('lodash')
const _path = require('path')
const fs = require('fs')

const propTypes = {
  string: 'String',
  number: 'Number',
  bool: 'Boolean',
  object: 'Object',
  array: 'Array',
}

function parse(src) {
  const options = {
    babelrc: false,
    sourceType: 'module',
    plugins: ['jsx', 'objectRestSpread', 'classProperties'],
  }

  return babylon.parse(src, options)
}

const transform = ({
  id,
  code,
  dependedModules = {},
  referencedBy = [],
  sourcePath,
}) => {
  const Attrs = []
  const Methods = []
  const Properties = {}
  const ImportPages = []
  const ImportComponents = {}
  const ImportTemplates = {}
  const ImportSources = []
  const ComponentRelations = {}
  const JSONAttrs = {}
  const output = {
    type: 'local_module',
  }
  const isTemplate = function() {
    return output.type === 'template'
  }
  const isComponent = function() {
    return output.type === 'component'
  }
  const isPage = function() {
    return output.type === 'page'
  }
  const isApp = function() {
    return output.type === 'app'
  }
  const isGame = function() {
    return output.type === 'game'
  }
  const visitCSS = {
    TaggedTemplateExpression(path) {
      const { tag, quasi } = path.node
      if (/CSS|WXSS/.test(tag.name)) {
        output[tag.name.toLowerCase()] = quasi.quasis[0].value.raw
        path.remove()
      }
    },
  }
  const visitJSX = {
    JSXOpeningElement(path) {
      if (ImportTemplates[path.node.name.name]) {
        const templateName = path.node.name.name
        path.node.name.name = 'template'

        const templateData = path.node.attributes
          .reduce((all, x) => {
            if (x.type === 'JSXSpreadAttribute')
              all.push(`...${x.argument.name}`)
            else if (x.value.type === 'StringLiteral')
              all.push(`${x.name.name}: '${x.value.value}'`)
            else if (x.value.type === 'JSXExpressionContainer') {
              const v = generate(x.value.expression).code
              if (x.value.expression.type === 'Identifier' && v === x.name.name)
                all.push(`${v}`)
              else if (
                x.value.expression.type === 'Identifier' &&
                v !== x.name.name
              ) {
                return all // attribute MUST be defined
              }
              else all.push(`${x.name.name}: ${v}`)
            }
            return all
          }, [])
          .join(', ') //?

        path.node.attributes = [
          t.jSXAttribute(t.jSXIdentifier('is'), t.stringLiteral(templateName)),
          t.jSXAttribute(
            t.jSXIdentifier('data'),
            t.stringLiteral(`{{${templateData}}}`)
          ),
        ]
        path.node.selfClosing = false
        path.parent.closingElement = t.jSXClosingElement(
          t.jSXIdentifier('template')
        )
      }
    },

    JSXExpressionContainer(path) {
      path.node.expression = t.identifier(
        `{${generate(path.node.expression).code}}`
      )
    },

    JSXAttribute(path) {
      const { name, value } = path.node
      path.node.name.name = /if|elif|else|for|key|for-index|for-item/.test(name.name)
        ? `wx:${name.name}`
        : /^on(\w*)$/.test(name.name)
          ? name.name.replace(/^on(\w*)$/, 'bind$1').toLowerCase()
          : name.name
      if (value && !value.expression) return
      if (!value) {
        if (/else/.test(name.name)) return
        path.node.value = t.stringLiteral('{{true}}')
      } else if (t.isTemplateLiteral(value.expression)) {
        path.node.value = t.stringLiteral(
          zip(
            value.expression.quasis.map(x => x.value.raw),
            value.expression.expressions.map(x => x.name)
          ).reduce((v, [raw, name]) => {
            return !raw && !name ? v : name ? v + `${raw}{{${name}}}` : v + raw
          }, '')
        )
      } else if (t.isObjectExpression(value.expression)) {
        const newValue = generate(value.expression, { concise: true }).code
        path.node.value = t.stringLiteral(`{${newValue}}`)
      } else if (/^bind/.test(path.node.name.name)) {
        const newValue =   generate(value.expression).code
        path.node.value = t.stringLiteral(newValue.replace('this.', ''))
      } else {
        const newValue = generate(value.expression).code
        path.node.value = t.stringLiteral(`{{${newValue}}}`)
      }
    },
  }
  const visitor = {
    CallExpression(path) {
      if (
        t.isMemberExpression(path.node.callee) &&
        path.node.callee.property.name === 'setState'
      ) {
        path.node.callee.property.name = 'setData'
      }
    },

    ClassProperty(path) {
      if (/state/.test(path.node.key.name)) {
        Attrs.push(t.objectProperty(t.identifier('data'), path.node.value))
      } else if (isComponent() && /defaultProps/.test(path.node.key.name)) {
        path.node.value.properties.forEach(property => {
          const value = property.value
          const key = property.key.name
          Properties[key] = Properties[key] || {}
          Properties[key].value = value
        })
      } else if (isComponent() && /propTypes/.test(path.node.key.name)) {
        path.node.value.properties.forEach(property => {
          const value = property.value
          const key = property.key.name
          Properties[key] = Properties[key] || {}
          if (value.object.name === 'PropTypes') {
            const type = propTypes[value.property.name]
            if (!type) return
            // compProperties[key].type = t.arrayLiteral()
            Properties[key].type = t.identifier(type)
          }
        })
      } else if ( isApp() && /window|tabBar|networkTimeout|debug/.test(path.node.key.name)) {
        const v = generate(path.node.value, {
          concise: true,
          comments: false,
          jsonCompatibleStrings: true,
        })
          .code.replace(/'/g, '"')
          .replace(/([A-Za-z0-9_$]*):/g, '"$1":')

        JSONAttrs[path.node.key.name] = JSON.parse(v)
      }  else if ( isPage() && /window|navigationBarBackgroundColor|navigationBarTextStyle|navigationBarTitleText|backgroundColor|backgroundTextStyle|enablePullDownRefresh|disableScroll|onReachBottomDistance/.test(path.node.key.name)) {
        const v = generate(path.node.value, {
          concise: true,
          comments: false,
          jsonCompatibleStrings: true,
        })
          .code.replace(/'/g, '"')
          .replace(/([A-Za-z0-9_$]*):/g, '"$1":')

        const vObj = JSON.parse(v)
        if (path.node.key.name === 'window') {
          Object.keys(vObj).forEach((key) => {
            JSONAttrs[key] = vObj[key]
          })
        } else {
          JSONAttrs[path.node.key.name] = vObj
        }
      } else if ( isGame() && /deviceOrientation|showStatusBar|networkTimeout|workers/.test(path.node.key.name)) {
        const v = generate(path.node.value, {
          concise: true,
          comments: false,
          jsonCompatibleStrings: true,
        })
          .code.replace(/'/g, '"')
          .replace(/([A-Za-z0-9_$]*):/g, '"$1":')

        JSONAttrs[path.node.key.name] = JSON.parse(v)
      } else {
        Attrs.push(
          t.objectProperty(t.identifier(path.node.key.name), path.node.value)
        )
      }
    },

    ClassMethod: {
      enter(path) {
        const methodName = path.node.key.name

        if (methodName === 'render') {
          if (path.node.body.body.length > 1) {
            console.error('render 方法只能 return !')
          }
          return
        } else if (/created|attached|ready|moved|detached/.test(methodName)) {
          // Component life cycle fn.
          if (!isComponent()) return
          const fn = t.objectProperty(
            t.identifier(methodName),
            t.functionExpression(null, path.node.params, path.node.body, path.node.generator, path.node.async)
          )
          Attrs.push(fn)
        } else if (isComponent()) {
          const fn = t.objectProperty(
            t.identifier(methodName),
            t.functionExpression(null, path.node.params, path.node.body, path.node.generator, path.node.async)
          )
          Methods.push(fn)
        // } else if (t.isClassMethod(path.node, { async: true })) {
          // console.log('method', methodName, path.node)
        } else {
          const fn = t.objectProperty(
            t.identifier(methodName),
            t.functionExpression(null, path.node.params, path.node.body, path.node.generator, path.node.async)
          )
          Attrs.push(fn)
        }
      },
      exit(path) {
        const methodName = path.node.key.name
        if (methodName === 'render') {
          const result = path.node.body.body.find(
            x => x.type === 'ReturnStatement'
          )
          if (!result) return
          if (result.argument.type === 'JSXElement') {
            output.wxml = prettifyXml(
              generate(result.argument, { concise: true }).code,
              { indent: 2 }
            )
          }
        }
      },
    },

    ImportDeclaration(path) {
      const source = path.node.source.value
      let moduleName = path.node.specifiers.length
        ? path.node.specifiers[0].local.name
        : '' //?
      let typedModule
      
      if (id) {
        const { dir } = _path.parse(id)
        const dependedModuleId = _path.resolve(dir, source)
        typedModule = dependedModules[dependedModuleId]
      } else {
        typedModule = dependedModules[source]
      }
      if (typedModule) {
        switch (typedModule.type) {
          case 'page': {
            const { dir, name } = _path.parse(source)
            const pagePath = _path.join(dir.replace(`.${_path.sep}`, ''), name)
            ImportPages.push(pagePath)
            path.remove()
            break
          }
          case 'component': {
            const { dir, name } = _path.parse(source)
            const componentPath = _path.format({ dir, name })
            const modulePath = _path.join('..', componentPath)
            ImportComponents[moduleName] = modulePath
            ComponentRelations[_path.join('..', componentPath)] = { type: 'child' }
            path.remove()
            break
          }
          case 'template': {
            const { dir, name } = _path.parse(source)
            const modulePath = _path.join('..', dir, `${name}.wxml`)
            ImportTemplates[moduleName] = modulePath
            path.remove()
            break
          }
        }
      } else if (!_path.parse(source).dir) {
        // from node_modules
        if (/wn/.test(source)) {
          const wnModules = []
          path.node.specifiers.forEach(node => {
            if (/App|Page|Component|Game/.test(node.local.name)) return
            wnModules.push(node)
          })
          if (!wnModules.length) {
            path.remove()
            return
          }
          path.node.specifiers = wnModules
          path.node.source.value = 'wn-cli'
        }
        const modulePath = _path.format({
          dir: _path.join(
            _path.relative(_path.dirname(id), sourcePath),
            'modules'
          ),
          name: source,
          ext: '.js',
        })
        path.node.source.value = modulePath
        ImportSources.push(path.node.source)
      } else {
        // from local modules
        const extName = _path.extname(source) || 'js'
        const modulePath = `${source}.${extName}`
        path.node.source.value = modulePath
        ImportSources.push(path.node.source)
      }
    },

    ExportDefaultDeclaration: {
      enter(path) {
        const { node: { declaration } } = path
        const { superClass } = declaration

        if (
          t.isFunctionDeclaration(declaration) ||
          t.isArrowFunctionExpression(declaration)
        ) {
          const returned = declaration.body.body.find(t.isReturnStatement)
          if (!returned) return
          if (t.isJSXElement(returned.argument)) {
            // Template
            output.type = 'template'
          }
        }

        if (superClass && /App|Page|Component|Game/.test(superClass.name)) {
          output.type = superClass.name.toLowerCase()
        }
      },
      exit(path) {
        // ParentModuleName = path.node.superClass.name
        const { node: { declaration } } = path
        const { superClass } = declaration

        if (isTemplate()) {
          const returned = declaration.body.body.find(t.isReturnStatement)
          if (declaration.id) output.name = declaration.id.name
          output.wxml = prettifyXml(
            `<template name="${output.name}">\n ${
              generate(returned.argument, { concise: true }).code
            } \n</template>`,
            { indent: 2 }
          )
          path.remove()
        }
        // add component relations
        if (isComponent()) {
          const objProps = []
          referencedBy.forEach(function(referencedId) {
            const { dir, name } = _path.parse(referencedId)
            const componentPath = _path.format({ dir, name })
            ComponentRelations[componentPath] = { type: 'parent' }
          })

          Object.keys(ComponentRelations).forEach(key => {
            if (/pages/.test(key)) {
              return // TODO more specific check
            }
            const { name } = _path.parse(key)
            const componentPath = _path.format({ dir: key, name })
            objProps.push(
              t.objectProperty(
                t.stringLiteral(componentPath),
                t.objectExpression([
                  t.objectProperty(
                    t.identifier('type'),
                    t.stringLiteral(ComponentRelations[key].type)
                  ),
                ])
              )
            )
          })
          objProps.length && Attrs.push(
            t.objectProperty(
              t.identifier('relations'),
              t.objectExpression(objProps)
            )
          )
        }
        const componentProperties = []
        Object.keys(Properties).forEach(key => {
          const { type, value } = Properties[key]
          const property = []
          // if (!type) return
          property.push(t.objectProperty(t.identifier('type'), type))
          value && property.push(t.objectProperty(t.identifier('value'), value))

          componentProperties.push(
            t.objectProperty(t.identifier(key), t.objectExpression(property))
          )
        })

        Methods.length &&
          Attrs.push(
            t.objectProperty(
              t.identifier('methods'),
              t.objectExpression(Methods)
            )
          )
        componentProperties.length &&
          Attrs.push(
            t.objectProperty(
              t.identifier('properties'),
              t.objectExpression(componentProperties)
            )
          )

        if (superClass && /App|Page|Component|Game/.test(superClass.name)) {
          // if (declaration.id) output.name = path.node.id.name
          path.replaceWith(
            t.CallExpression(t.identifier(superClass.name), [
              t.objectExpression(Attrs),
            ])
          )
        }
      },
    },
  }

  const css = (id) => {
    const { dir, name } = _path.parse(id)
    const cssPathname = _path.resolve(dir, `${name}.css`)
    if (fs.existsSync(cssPathname)) {
      const css = fs.readFileSync(cssPathname, 'utf-8')
      output.css = css
    }
  }

  css(id)

  const AST = parse(code)
  // traverse(AST, Object.assign({}, visitor, visitJSX, visitCSS))
  traverse(AST, Object.assign({}, visitor, visitJSX))

  // reference templates
  if (Object.keys(ImportTemplates).length) {
    output.wxml =
      Object.entries(ImportTemplates)
        .map(([, src]) => `<import src="${src}" />\n`)
        .join('') + output.wxml
  }

  // .json
  const _json = isApp() || isGame() // 小程序配置
    ? ImportPages.length
      ? Object.assign({ pages: ImportPages }, JSONAttrs)
      : Object.keys(JSONAttrs).length ? JSONAttrs : undefined
    : isComponent() // 组件配置
      ? {
        component: true,
        usingComponents: Object.keys(ImportComponents).length
          ? ImportComponents
          : undefined,
      }
      : isPage() // 页面配置
        ? Object.assign(Object.keys(ImportComponents).length ? {
          usingComponents: ImportComponents,
        } : {}, JSONAttrs || {})
        : undefined
  output.json = _json && JSON.stringify(_json)

  // .js
  // ImportSources.forEach(function(source) {
  //   if (isComponent() || isPage()) {
  //     source.value = _path.join('..', source.value)
  //   }
  // })
  output.js = isTemplate()
    ? null
    : transformFrom(generate(AST).code, {
      babelrc: false,
      plugins: [
        '@babel/plugin-proposal-object-rest-spread',
        [
          '@babel/plugin-transform-modules-commonjs',
          {
            loose: true,
            noInterop: true,
          },
        ],
      ],
    }).code.replace('"use strict";\n\n', '')

  return output
}

module.exports = transform
