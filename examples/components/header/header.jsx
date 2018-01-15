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
