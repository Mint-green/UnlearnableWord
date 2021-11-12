// pages/index/index.js
const app = getApp()
import regeneratorRuntime, { async } from '../../lib/runtime/runtime';
const format_time = require('../../utils/format_time.js')
const rescontent = require('../../utils/response_content.js')
const wordApi = require('../../utils/wordApi.js')

const innerAudioContext = wx.createInnerAudioContext({ useWebAudioImplement: true })

Page({

    /**
     * 页面的初始数据
     */
    data: {
        dailySentence: [],
        sentenceIndex: 0,
        isPlayingVoice: false,
        isLogin: false,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        // wx.setNavigationBarColor({
        //     backgroundColor: '#86e3ce',
        //     frontColor: '#ffffff',
        // })
        this.init()
    },
    sentenceTimer: -1,

    init() {
        this.getDailySentence()
        let _this = this
        innerAudioContext.onEnded(() => {
            console.log('结束播放')
            _this.setData({ isPlayingVoice: false })
        })
        innerAudioContext.volume = 1
    },

    async getDailySentence() {
        let dateStr = format_time.formatDate(new Date())
        let dailySentence = wx.getStorageSync('dailySentence')
        if (dailySentence && dailySentence.date == dateStr) {
            this.setData({ dailySentence: dailySentence.data })
            // app.globalData.dailySentence = dailySentence.data
        } else {
            let t1 = new Date().getTime()
            console.log('Start', t1)
            let res = await wordApi.getDailySentence()
            console.log(res)
            let t2 = new Date().getTime()
            console.log('Done', t2, 'Time Spent', t2 - t1)
            // app.globalData.dailySentence = res.data
            wx.setStorageSync('dailySentence', {
                date: dateStr,
                data: res.data
            })
            this.setData({ dailySentence: res.data })
        }
        let _this = this
        this.sentenceTimer = setInterval(() => {
            _this.setData({
                sentenceIndex: (++_this.data.sentenceIndex) % 3,
            })
            // console.log("trigger timer")
        }, 20000)
    },

    playVoice() {
        console.log('try to play/stop sentence voice')
        let isPlayingVoice = this.data.isPlayingVoice
        if (isPlayingVoice) {
            innerAudioContext.stop()
            this.setData({ isPlayingVoice: false })
            return
        }
        let sentenceIndex = this.data.sentenceIndex
        if (sentenceIndex != 2) {
            let dailySentence = this.data.dailySentence
            // console.log(dailySentence[sentenceIndex].voiceUrl)
            innerAudioContext.src = dailySentence[sentenceIndex].voiceUrl
            // console.log('duration is', innerAudioContext.duration)  // 音频未完全加载，打印duration为0/NaN
            innerAudioContext.play()
            this.setData({ isPlayingVoice: true })
        }
    },

    goLogin() {
        wx.navigateTo({
            url: '../login/login',
        })
    },

    goSearch() {
        wx.navigateTo({
            url: '../search/search',
        })
    },

    touchMove(e) {
        return
        let time = new Date().getTime()
        console.log('手指触摸后移动', time)
        console.log(e)
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        this.setData({
            isLogin: app.globalData.isLogin
        })
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})