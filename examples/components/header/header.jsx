import { Component } from 'wn'

export default class extends Component {
  render() {
    return (
      <view>
        <slot></slot>  
      </view>
    )
  }
}
