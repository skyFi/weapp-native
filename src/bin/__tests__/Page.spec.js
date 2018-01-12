const transform = require('../transform')
const { log, code } = require('./util')

describe('Page', () => {
  test('WXSS -> page.wxss', () => {
    const jsx = `
WXSS\`
.hi { color: red; }
\`
export default class extends Page {
}
`
    const expected = {
      js: code`
Page({});
`,
      wxss: `
.hi { color: red; }
`,
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.json === expected.json).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
    expect(output.wxss === expected.wxss).toBe(true)
  })

})