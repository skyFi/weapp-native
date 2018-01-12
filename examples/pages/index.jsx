import { Page, CSS } from 'wn'

CSS`
  .test {
    color: red;
  }
`

export default class extends Page {
  render() {
    return (
      <view class="test">
        你好，小程序！        
      </view>
    )
  }
}
