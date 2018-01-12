const transform = require('../transform')
const { log, code } = require('./util')

describe('App', () => {
  test('类定义配置 -> app.json', () => {
    const jsx = `
export default class Test extends App {
  debug = true
  window = {
    navigationBarTitleText: '你好，小程序',
  }
  tabBar = {
    list: [
      {
        pagePath: 'pages/index/index',
        text: 'index',
      },
    ]
  }
  networkTimeout = {
    request: 10000,
  }
 
  custom = {
    value: 1
  }
}
`
    const expected = {
      js: code`
App({
  custom: {
    value: 1
  }
});
`,
      json: '{"debug":true,"window":{"navigationBarTitleText":"你好，小程序"},"tabBar":{"list":[{"pagePath":"pages/index/index","text":"index"}]},"networkTimeout":{"request":10000}}',
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.json === expected.json).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })

  test('import 页面 -> app.json', () => {
    const index = `
export default class extends Page {
  render() {
    return (
      <view>
        Hello World!
      </view>
    )
  }
}
`
    const page1 = `
export default class extends Page {
  render() {
    return (
      <view>
        Page 1 
      </view>
    )
  }
}
`
    const jsx = `
import './pages/index.jsx'
import './pages/page1.jsx'
export default class Test extends App {
  debug = true
  custom = {
    value: 1
  }
}
`
    const expected = {
      js: code`
App({
  custom: {
    value: 1
  }
});
`,
      json: '{"pages":["pages/index/index","pages/page1/page1"],"debug":true}',
    }
    const output = transform({
      code: jsx,
      dependedModules: {
        './pages/index.jsx': transform({ code: index }),
        './pages/page1.jsx': transform({ code: page1 }),
      },
    })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.json === expected.json).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })
})