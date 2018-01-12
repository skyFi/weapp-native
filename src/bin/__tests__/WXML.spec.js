const transform = require('../transform')
const { log, code } = require('./util')

describe('JSX to WXML', () => {
  test('数据绑定:内容', () => {
    const jsx = `
export default class Test extends Page {
  render() {
    return (
      <view>{message}</view>
    )
  }
}
`
    const expected = {
      wxml: code`
<view>{{message}}</view>
`,
      js: 'Page({});',
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })

  test('数据绑定:组件属性', () => {
    const jsx = '\n' +
'export default class Test extends Page {\n' +
'  render() {\n' +
'    return (\n' +
'      <view>\n' +
'        <view id={`item-${id}`}></view>\n' +
'        <view id={`${prefix}item-${id}-${index}`}></view>\n' +
'      </view>\n' +
'    )\n' +
'  }\n' +
'}\n'

    const expected = {
      wxml: code`
<view>
  <view id="item-{{id}}">
  </view>
  <view id="{{prefix}}item-{{id}}-{{index}}">
  </view>
</view>
`,
      js: 'Page({});',
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })

  test('数据绑定:控制属性', () => {
    const jsx = `
export default class Test extends Page {
  data = {
    condition: true,
  }
  render() {
    return (
      <view if={condition}></view>
    )
  }
}
`

    const expected = {
      wxml: code`
<view wx:if="{{condition}}">
</view>
`,
      js: code`
Page({
  data: {
    condition: true
  }
});
`,
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })

  test('数据绑定:关键字', () => {
    const jsx = `
export default class Test extends Page {
  render() {
    return (
      <view>
        <view checked={false}></view>
        <view checked></view>
      </view>
    )
  }
}
`

    const expected = {
      wxml: code`
<view>
  <view checked="{{false}}">
  </view>
  <view checked="{{true}}">
  </view>
</view>
`,
      js: 'Page({});',
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })
  test('数据绑定:三元运算', () => {
    const jsx = `
export default class Test extends Page {
  data = {
    flag: "need to show",
  }
  render() {
    return (
      <view hidden={flag ? true: false}></view>
    )
  }
}
`

    const expected = {
      wxml: code`
<view hidden="{{flag ? true : false}}">
</view>
`,
      js: code`
Page({
  data: {
    flag: "need to show"
  }
});
`,
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })

  test('数据绑定:算数运算', () => {
    const jsx = `
export default class Test extends Page {
  data = {
    a: 1,
    b: 2,
    c: 3,
  }
  render() {
    return (
      <view>{a + b} + {c} + d</view>
    )
  }
}
`

    const expected = {
      wxml: code`
<view>{{a + b}} + {{c}} + d</view>
`,
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.wxml === expected.wxml).toBe(true)
  })
  test('数据绑定:逻辑判断', () => {
    const jsx = `
export default class Test extends Page {
  data = {
    length: 5,
  }
  render() {
    return (
      <view if={length > 5}></view>
    )
  }
}
`

    const expected = {
      wxml: code`
<view wx:if="{{length > 5}}">
</view>
`,
      js: code`
Page({
  data: {
    length: 5
  }
});
`,
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })

  test('数据绑定:字符串运算', () => {
    const jsx = `
export default class Test extends Page {
  data = {
    name: 'MINA',
  }
  render() {
    return (
      <view>{"hello " + name}</view>
    )
  }
}
`

    const expected = {
      wxml: code`
<view>{{"hello " + name}}</view>
`,
      js: code`
Page({
  data: {
    name: 'MINA'
  }
});
`,
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })

  test('数据绑定:数据路径运算', () => {
    const jsx = `
export default class Test extends Page {
  data = {
    object: {
      key: 'hello',
    },
    array: 'MINA',
  }
  render() {
    return (
      <view>{object.key} {array[0]}</view>
    )
  }
}
`

    const expected = {
      wxml: code`
<view>{{object.key}} {{array[0]}}</view>
`,
      js: code`
Page({
  data: {
    object: {
      key: 'hello'
    },
    array: 'MINA'
  }
});
`,
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })

  test('数据绑定:数组', () => {
    const jsx = `
export default class Test extends Page {
  data = {
    zero: 0,
  }
  render() {
    return (
      <view for={[zero, 1, 2, 3, 4]}> {item} </view>
    )
  }
}
`

    const expected = {
      wxml: code`
<view wx:for="{{[zero, 1, 2, 3, 4]}}"> {{item}} </view>
`,
      js: code`
Page({
  data: {
    zero: 0
  }
});
`,
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })

  test('列表渲染:block', () => {
    const jsx = `
export default class Test extends Page {
  render() {
    return (
<block for={[1, 2, 3]}>
  <view> {index}: {item} </view>
</block>
    )
  }
}
`

    const expected = {
      wxml: code`
<block wx:for="{{[1, 2, 3]}}">
  <view> {{index}}: {{item}} </view>
</block>
`,
      js: code`
Page({});
`,
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })

  test('列表渲染:for', () => {
    const jsx = `
export default class Test extends Page {
  data = {
    array: [{
      message: 'foo',
    }, {
      message: 'bar'
    }]
  }
  render() {
    return (
      <view for={array} key="message"> {index}: {item.message} </view>
    )
  }
}
`

    const expected = {
      wxml: code`
<view wx:for="{{array}}" wx:key="message"> {{index}}: {{item.message}} </view>
`,
      js: code`
Page({
  data: {
    array: [{
      message: 'foo'
    }, {
      message: 'bar'
    }]
  }
});
`,
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })

  test('列表渲染:对象', () => {
    const jsx = `
export default class Test extends Page {
  render() {
    return (
      <view data={{ foo: 0, bar: 1 }}></view>
    )
  }
}
`

    const expected = {
      wxml: code`
<view data="{{ foo: 0, bar: 1 }}">
</view>
`,
      js: code`
Page({});
`,
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })

  test('条件渲染:block', () => {
    const jsx = `
export default class Test extends Page {
  render() {
    return (
      <block if={true}>
        <view> 1 </view>
      </block>
    )
  }
}
`

    const expected = {
      wxml: code`
<block wx:if="{{true}}">
  <view> 1 </view>
</block>
`,
      js: code`
Page({});
`,
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })

  test('条件渲染:if', () => {
    const jsx = `
export default class Test extends Page {
  render() {
    return (
      <view>
        <view if={x > 5}> 1 </view>
        <view elif={x > 2}> 2 </view>
        <view else> 3 </view>
      </view>
    )
  }
}
`

    const expected = {
      wxml: code`
<view>
  <view wx:if="{{x > 5}}"> 1 </view>
  <view wx:elif="{{x > 2}}"> 2 </view>
  <view wx:else> 3 </view>
</view>
`,
      js: code`
Page({});
`,
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })

  test('事件绑定', () => {
    const jsx = `
export default class Test extends Page {
  count = 1
  handleTap(event) {
    this.count++
  }
  render() {
    return (
      <button onTap={this.handleTap}>click</button>
    )
  }
}
`
    const expected = {
      wxml: code`
<button bindtap="handleTap">click</button>
`,
      js: code`
Page({
  count: 1,
  handleTap: function (event) {
    this.count++;
  }
});
`,
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.js === expected.js).toBe(true)
    expect(output.wxml === expected.wxml).toBe(true)
  })
  test('模板: function', () => {
    const jsx = `
export default function template({index, msg, time}) {
  return (
    <view>
      <text> {index}: {msg} </text>
      <text> Time: {time} </text>
    </view>    
  )
}
`

    const expected = {
      wxml: code`
<template name="template">
  <view>
    <text> {{index}}: {{msg}} </text>
    <text> Time: {{time}} </text>
  </view>
</template>
`,
    }
    const output = transform({ code: jsx })
    log([output, expected])
    expect(output.wxml === expected.wxml).toBe(true)
  })

//   test('模板: arrow function', () => {
//     const jsx = `
//  export default ({index, msg, time}) => {
//   return (
//     <view>
//       <text> {index}: {msg} </text>
//       <text> Time: {time} </text>
//     </view>    
//   )
// }
// `

//     const expected = {
//       wxml: `
// <template name="template2">
//   <view>
//       <text> {{index}}: {{msg}} </text>
//       <text> Time: {{time}} </text>
//     </view>
// </template>
// `,
//     }
//     const output = transform({ code: jsx })
//     log([output, expected])
//     expect(output.wxml === expected.wxml).toBe(true)
//   })

  test('模板: 引用,属性', () => {
    const _module = transform({
      code: `
export default function MsgItem({index, msg, time}) {
  return (
    <view>
      <text> {index}: {msg} </text>
      <text> Time: {time} </text>
    </view>    
  )
}
`,
    }) //?
    const page = `
import MsgItem from './msg-item.jsx'

export default class Test extends Page {
  data = {
    x: 'hi',
    item: {
      index: 0,
      msg: 'this is a template',
      time: '2016-09-15'
    }
  }
  render() {
    return (
      <view>
        <MsgItem {...item} {...rest} title="hi" index={1} x={x} maybeNot={x}/>
      </view>
    )
  }
}
`

    const expected = {
      wxml: code`
<import src="../msg-item.wxml" />
<view>
  <template is="MsgItem" data="{{...item, ...rest, title: \'hi\', index: 1, x}}">
  </template>
</view>
`,
    }
    const output = transform({
      code: page,
      dependedModules: { './msg-item.jsx': _module },
    })
    log([output, expected])
    expect(output.wxml === expected.wxml).toBe(true)
  })
})
