import { Page, CSS, wx } from 'wn'
import header from '../../components/header/header.jsx';

export default class extends Page {
  window = {
    navigationBarTitleText: 'hello'
  }
  navigationBarTextStyle = 'black'

  async onShow() {
    const systemInfo = await wx.getSystemInfo()
    console.log(systemInfo);
  }

  data = {
    a: 1
  }
  
  ontap(e) {
    console.log('点击了我', e);
    this.setState({ a: 2 });
  }

  render() {
    return (
      <view class="test">
        <header ontap={this.ontap}>
          out
          <header />
        </header>
        你好，小程序      
      </view>
    )
  }
}
