const path = require('path')
const transform = require('../transform')
const { log, code } = require('./util')

describe('Import modules', () => {
  test('import virtual wn', () => {
    const jsx = `
import { Page } from 'wn'
export default class extends Page {
}
`
    const expected = {
      js: code`
Page({});
`,

    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.json === expected.json).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })

  test('import node modules', () => {
    const jsx = `
import { App } from 'wn'
import { createStore } from 'redux'
export default class extends App {
  onLaunch() {
    createStore(state => state, { value: 1 })
  }
}
`
    const expected = {
      js: code`
var _redux = require("modules/redux.js");

App({
  onLaunch: function () {
    (0, _redux.createStore)(state => state, {
      value: 1
    });
  }
});
`,

    }
    const output = transform({
      code: jsx,
      id: '/app.jsx',
      sourcePath: '/'
    })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.json === expected.json).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })

test('import local modules', () => {
    const app = `
import rootReducer from './reducer'
export default class extends Page {
  onLoad() {
    rootReducer()
  }
}
`
    const reducer = `
const rootReducer = state => state
export default rootReducer
`
    const expected = {
      js: code`
var _reducer = require("../reducer.js");

Page({
  onLoad: function () {
    (0, _reducer.default)();
  }
});
`,
    }
    const dep = transform({
      id: path.resolve('./reducer.jsx'),
      code: reducer,
      sourcePath: './',
      referencedBy: ['./app.jsx']
    })
    const output = transform({
      id: './app.jsx',
      sourcePath: './',
      code: app,
      dependedModules: {
        [path.resolve('./reducer.jsx')]: {
          ...dep,
          id: path.resolve('./reducer.jsx'),
        }
      }
    })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.json === expected.json).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })

  test('import wx from wn', () => {
    const jsx = `
import { Page, wx } from 'wn'
export default class extends Page {
}
`
    const expected = {
      js: code`
var _wn = require("../modules/wn.js");

Page({});
`,

    }
    const output = transform({
      id: path.resolve('./page.jsx'),
      code: jsx,
      sourcePath: './',
    })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.json === expected.json).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })
})
