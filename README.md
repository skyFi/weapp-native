# **wn-cli**

wn-cli 像React组件开发一样来开发微信小程序

名字由来：**wn -> weapp native** 取第一个字母

# Install

```
npm install wn-cli --save-dev
// 或者
yarn add wn-cli --dev
```

# Usage

```
// 构建
npx wn ./examples ./dist

// 监听模式
npx wn ./examples ./dist -w
```
如果你遇到一个错误，让拷贝 `wn.js` 文件，请按提示信息将 `node_modules` 中的 `node_modules/wn-cli/dist/wn.js` 文件拷贝到 `modules` 文件夹中

你的目录可能是这样的：
```
├── dist
│   ├── app.js
│   ├── app.json
│   ├── app.wxss
│   ├── modules
│   │   └── wn.js
│   ├── pages
│   │   ├── index
│   │   │   ├── index.js
│   │   │   ├── index.json
│   │   │   └── index.wxml
│   │   │   └── index.wxss
│   │   └── me
│   │       ├── me.js
│   │       ├── me.json
│   │       └── me.wxml
│   │       └── me.wxss
│   └── project.config.json
├── package.json
├── project.config.json
├── src
│   ├── app.jsx
│   ├── app.css
│   └── pages
│       ├── index
│       │   ├── index.css
│       │   └── index.jsx
│       └── me
│       │   ├── me.css
│           └── me.jsx
└── yarn.lock

```
然后在微信开发者工具中打开 `dist/` 文件夹，就可以预览开发了，可以选择你喜欢的编辑器。

# API

## 注册小程序

创建 `app.jsx` 文件，这也是小程序的入口文件，可能像下面这样写
```JavaScript
// src/app.jsx
import { App } from 'wn';
// 引入所有的页面，相对路径
import './pages/index/index.jsx';
import './pages/me/me.jsx';

export default class extends App {
  debug = true

  window = {
    navigationBarTitleText: 'hello',
    navigationBarTextStyle: 'black',
    navigationBarBackgroundColor: '#f4f5f6',
    backgroundColor: '#f4f5f6',
  }

  tabBar = {
    color: '#333333',
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: 'pages/index/index', // 编译后js路径
        text: '首页',
      },
      {
        pagePath: 'pages/me/me',
        text: '我',
      },
    ],
  }

  myData = '自定义公共变量'

  hello() { return '自定义公共函数' }

  // 生命周期函数
  onLaunch() { console.log('app: hello onLaunch') }
  onShow() { console.log('app: hello onShow') }
  onHide() { console.log('app: hello onHide') }
  onError() { console.log('app: hello onError') }
}

```

同样的，可以通过在 `app.js` 同目录下创建 `app.css` ，来书写公用的 `css` 。
```css
/* src/app.css */
.test {
  color: red;
}
```
如此，小程序就注册好了。

## 创建页面

创建第一个页面，在 `src/pages` 下面创建页面文件，如 `index/index.jsx`，可以这样写：
```javascript
// src/pages/index/index.jsx
import { Page, wx } from 'wn'

export default class extends Page {
  window = {
    navigationBarTitleText: 'hello'
  }
  navigationBarTextStyle = 'black'

  async onShow() {
    const systemInfo = await wx.getSystemInfo()
    console.log('系统信息', systemInfo);
  }

  data = {
    name: '小程序'
  }

  render() {
    return (
      <view class="test">
        你好，{name}      
      </view>
    )
  }
}

``` 

添加文件作用域的样式文件，相当于`css module`，在 `src/pages/index` 文件夹下面创建同名 `css` 文件 `index.css`，不用再导入，只需要命名和同文件下的 `.jsx` 文件相同就可以了
```css
/* src/pages/index/index.css */
.test {
  color: blue;
  text-align: center;
}
```
如此第一个页面就创建好了，接下来你可以添加自己的 `me.jsx` 页面。

## 创建组件

创建第一个组件，如 `header`，在 `src/components`下面创建 `header/header.jsx` 和 `header/header.css`，两文件
``` javascript
// src/components/header/header.jsx
import { Component } from 'wn'

export default class extends Component {
  render() {
    return (
      <view class="header">
        <slot></slot>  
      </view>
    )
  }
}

```

* `slot` 表示组件的 `children` 放置的位置，还可以指定位置，设置 `slot` 的 `name`。

```css
/* src/components/header/header.css */
.header {
  color: blue;
}
```

## 使用组件

创建了组件后，在页面中使用，首先在页面中导入：
```javascript
import header from '../../components/header/header.jsx';
```
然后在需要的时候使用：
```javascript
render() {
    return (
      <view class="test">
        <header>
          hello
        </header>
        你好，{name}      
      </view>
    )
  }
```
也可以组件嵌套等。

# Promise 化微信 API，即使用 Promise 代理 wx 中的异步方法

如：

```javascript
// ...
async onShow() {
    const systemInfo = await wx.getSystemInfo()
    console.log(systemInfo);
  }
// ...
```

* 注：原生 `API` 配置中的 `complete` 方法并没有代理

# 以上

* 暂时的功能能满足大多数简单的微信小程序开发，后续在使用中遇到瓶颈了，再配置兼容性开发高级 API 满足需求。

* 最后的目的是能满足所有（99%）微信小程序开发者的需求，全面（99%）覆盖小程序开发。像 `React Native` 开发 `APP` 一样，用`wn-cli` 开发 `weapp （微信小程序）`。

* 离目标还有不小的距离，如果你也是 `React` 派，对微信小程序有兴趣，可以 `fork` 代码共同建设维护这个工程 ，或许比较懒，那就直接提 [`ISSUE`](https://github.com/skyFi/weapp-native/issues/new)，这两样都会使我开心一整天的，当然，你的`star`也会令我开心好久。
