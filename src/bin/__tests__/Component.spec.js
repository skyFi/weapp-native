const path = require('path')
const transform = require('../transform')
const { log, code } = require('./util')

describe('Component', () => {
  test('methods in Component should be transformed as the property of methods', () => {
    const jsx = `
export default class Test extends Component {
  onClick(event) {
    console.log(event)
    this.setState({ open: true })
    this.setData({ open: true })
  }
}
`
    const expected = {
      json: '{"component":true}',
      js: code`
Component({
  methods: {
    onClick: function (event) {
      console.log(event);
      this.setData({
        open: true
      });
      this.setData({
        open: true
      });
    }
  }
});
`,
    }
    const output = transform({ code: jsx })
    log([output, expected])
    log(output.js.length, expected.js.length)
    expect(output.js === expected.js).toBe(true)
    expect(output.json === expected.json).toBe(true)
  })

  test('propTypes and defaultProps in Component should be transformed as type in properties', () => {
    const jsx = `
export default class Test extends Component {
  static propTypes = {
    b: PropTypes.string,
    a: PropTypes.array,
  }
  static defaultProps = {
    a: {},
    b: 'hi',
  }
}
`
    const expected = {
      json: '{"component":true}',
      js: code`
Component({
  properties: {
    b: {
      type: String,
      value: 'hi'
    },
    a: {
      type: Array,
      value: {}
    }
  }
});
`,
    }
    const output = transform({ code: jsx })
    log([output, expected])
    // log(output.js.length,expected.js.length)
    expect(output.js === expected.js).toBe(true)
    expect(output.json === expected.json).toBe(true)
  })

  test('state in Component should be transformed as data property', () => {
    const jsx = `
export default class Test extends Component {
  state = {
    open: false,
  }
}
`
    const expected = {
      json: '{"component":true}',
      js: code`
Component({
  data: {
    open: false
  }
});
`,
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.json === expected.json).toBe(true)
  })

  test('created/attached/detached/moved in Component should be transformed as built-in life cycle methods', () => {
    const jsx = `
export default class Test extends Component {
  onClick(event) { return true }
  created() { return true }
  attached() { return true }
  detached() { return true }
  moved() { return true }
}
`
    const expected = {
      json: '{"component":true}',
      js: code`
Component({
  created: function () {
    return true;
  },
  attached: function () {
    return true;
  },
  detached: function () {
    return true;
  },
  moved: function () {
    return true;
  },
  methods: {
    onClick: function (event) {
      return true;
    }
  }
});
`,
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.json === expected.json).toBe(true)
  })

  test('what render() returns in Component should be transformed as a wxml file', () => {
    const jsx = `
export default class Test extends Component {
  render() {
    return (
      <view>hi</view>
    )
  }
}
`
    const expected = {
      json: '{"component":true}',
      wxml: code`
<view>hi</view>
`,
      js: code`
Component({});
`,
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.json === expected.json).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })

  test('child components in render() should be added as relations', () => {
    const child = `
export default class extends Component {
  render() {
    return (
      <view>
        子级组件
      </view>
    )

  }
}
`
    const parent = `
import child from './child.jsx'
export default class parent extends Component {
  render() {
    return (
      <view>
        <child>hi</child>
      </view>
    )
  }
}
`
    const expectedParent = {
      json: '{"component":true,"usingComponents":{"child":"../child/child"}}',
      wxml: code`
<view>
  <child>hi</child>
</view>
`,
      js: code`
Component({
  relations: {
    "../child/child": {
      type: "child"
    }
  }
});
`,
    }
    const expectedChild = {
      json: '{"component":true}',
      wxml: code`
<view>
  子级组件
</view>
`,
      js: code`
Component({
  relations: {
    "../parent/parent": {
      type: "parent"
    }
  }
});
`,
    }

    const outputChild = transform({
      id: path.resolve('./child.jsx'),
      code: child,
      sourcePath: './',
      referencedBy: ['../parent.jsx']
    })

    log([outputChild, expectedChild])
    expect(outputChild.js === expectedChild.js).toBe(true)
    expect(outputChild.json === expectedChild.json).toBe(true)
    expect(outputChild.wxml === expectedChild.wxml).toBe(true)

    const outputParent = transform({
      id: './parent.jsx',
      sourcePath: './',
      code: parent,
      dependedModules: {
        [path.resolve('./child.jsx')]: {
          ...outputChild,
          id: path.resolve('./child.jsx'),
        }
      },
    })
    log([outputParent, expectedParent])
    expect(outputParent.js === expectedParent.js).toBe(true)
    expect(outputParent.json === expectedParent.json).toBe(true)
    expect(outputParent.wxml === expectedParent.wxml).toBe(true)
  })
})
