import { App } from 'wn';
import './pages/index.jsx';
import './pages/me.jsx';

export default class extends App {
  debug = true

  window = {
    navigationBarTitleText: '问塔',
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
        text: '塔',
      },
      {
        pagePath: 'pages/me/me',
        text: '我',
      },
    ],
  }

  myData = '自定义公共变量'

  hello() { return '自定义公共函数' }

  // 生命周期�函数
  onLaunch() { console.log('app: hello world') }
  onShow() { console.log('app: yes, I am') }
  onHide() { console.log('app: just minutes') }
  onError() { console.log('app: woops') }
}
