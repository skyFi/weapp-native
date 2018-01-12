/* global wx*/
import promisify, { promisifyReturns } from '../util/promisify'
const exceptProgramAPI = `closeSocket
stopRecord
getRecorderManager
pauseVoice
stopVoice
pauseBackgroundAudio
stopBackgroundAudio
getBackgroundAudioManager
createAudioContext
createInnerAudioContext
createVideoContext
createMapContext
canIUse
hideToast
hideLoading
showNavigationBarLoading
hideNavigationBarLoading
navigateBack
createAnimation
pageScrollTo
createSelectorQuery
createCanvasContext
createContext
drawCanvas
stopPullDownRefresh
createSelectorQuery
getExtConfigSync
createCameraContext
createLivePlayerContext
createLivePusherContext`

const exceptGameAPI = `createImage
loadFont
setPreferredFramesPerSecond
getFileSystemManager`

const promisifiedWxApi = promisify(wx, {
  objectParams: true,
  exclude: [
    /^on/,
    /^off/,
    /Sync$/,
    new RegExp(exceptProgramAPI.split(/\r\n|\r|\n/).join('|'), 'gi'),
    new RegExp(exceptGameAPI.split(/\r\n|\r|\n/).join('|'), 'gi'),
  ],
})

if (wx.createCameraContext) {
  promisifiedWxApi.createCameraContext = promisifyReturns(wx.createCameraContext.bind(wx), {
    takePhoto: { objectParams: true },
    startRecord: { objectParams: true },
    stopRecord: { objectParams: true },
  })
}

if (wx.createLivePlayerContext) {
  promisifiedWxApi.createLivePlayerContext = promisifyReturns(wx.createLivePlayerContext.bind(wx), {
    play: { objectParams: true },
    stop: { objectParams: true },
    mute: { objectParams: true },
    requestFullScreen: { objectParams: true },
    exitFullScreen: { objectParams: true },
  })
}

if (wx.createLivePusherContext) {
  promisifiedWxApi.createLivePusherContext = promisifyReturns(wx.createLivePusherContext.bind(wx), {
    play: { objectParams: true },
    stop: { objectParams: true },
    mute: { objectParams: true },
    requestFullScreen: { objectParams: true },
    exitFullScreen: { objectParams: true },
  })
}

if (wx.getFileSystemManager) {
  promisifiedWxApi.getFileSystemManager = promisifyReturns(wx.getFileSystemManager.bind(wx), {
    access: { objectParams: true },
    copyFile: { objectParams: true },
    getFileInfo: { objectParams: true },
    mkdir: { objectParams: true },
    rmdir: { objectParams: true },
    rename: { objectParams: true },
    readFile: { objectParams: true },
    readdir: { objectParams: true },
    saveFile: { objectParams: true },
    stat: { objectParams: true },
    writeFile: { objectParams: true },
    unlink: { objectParams: true },
  })
}
// if (wx.connectSocket) 
export default promisifiedWxApi
