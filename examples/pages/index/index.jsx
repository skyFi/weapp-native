import { Page, CSS, wx } from 'wn'
import header from '../../components/header/header.jsx';

export default class extends Page {
  window = {
    navigationBarTitleText: 'hello'
  }
  navigationBarTextStyle = 'black'
  async onShow() {
    const userInfo = await wx.getSystemInfo()
    console.log(userInfo);
  }
  render() {
    return (
      <view class="test">
        <header></header>
        你好，小程序！        
      </view>
    )
  }
}
