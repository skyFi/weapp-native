const transform = require('../transform')
const { log, code } = require('./util')

describe('Game', () => {
  test('类定义配置 -> game.json', () => {
    const js = `
export default class extends Game {
  networkTimeout = {
    request: 5000,
    connectSocket: 5000,
  }
  deviceOrientation = 'landscape'

}
`
    const expected = {
      js: code`
Game({});
`,
      json: '{"networkTimeout":{"request":5000,"connectSocket":5000},"deviceOrientation":"landscape"}'
    }
    const output = transform({ code: js })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.json === expected.json).toBe(true)
  })

})