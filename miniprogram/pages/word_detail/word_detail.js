// pages/word_detail/word_detail.js
import regeneratorRuntime, { async } from '../../lib/runtime/runtime';
const wordApi = require("../../utils/wordApi.js")
const word_utils = require("../../utils/word_utils.js")

const app = getApp()
const colorList = ['#ffb284', '#99c4d3', '#d0e6a5', '#86e3ce', '#ffdd95', '#fa897b',
    '#ccabd8', '#80beaf', '#b3ddd1', '#d1dce2', '#ef9d6d', '#c6c09c', '#f5cec7',
    '#ffc98b', '#b598c6', '#73c8dd', '#c56a4b']
const innerAudioContext = wx.createInnerAudioContext({ useWebAudioImplement: true })

Page({

    /**
     * 页面的初始数据
     */
    data: {
        // bgStyle: '#ffb284',
        // bgStyle: '#d1dce0',
        colorType: 16,
        word_id: 0,
        wordDetail: {},
        voiceUrl: '',
        isInNotebook: false,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        wx.setNavigationBarTitle({
            title: '单词详情',
        })

        let colorType = Math.floor(Math.random() * 17)
        if (options.colorType) {
            colorType = options.colorType
        }
        wx.setNavigationBarColor({
            backgroundColor: colorList[colorType],
            frontColor: '#ffffff',
        })
        this.setData({ colorType })

        console.log(options)
        // let pages = getCurrentPages()
        // let thisPage = pages[pages.length-1]
        // let pagesOptions = thisPage.options
        // console.log(pagesOptions)
        let word_id = parseInt(options.word_id)
        this.getDetail(word_id)
    },

    async getDetail(word_id) {
        let user_id = -1
        let isLogin = app.globalData.isLogin
        if (isLogin) user_id = app.globalData.userInfo.user_id
        let res = await wordApi.getWordDetail({
            word_id,
            user_id,
        })
        let wordDetail = JSON.parse(JSON.stringify(res.data))
        console.log(wordDetail)
        wordDetail = word_utils.handleWordDetail(wordDetail)
        console.log(wordDetail)
        this.setData({
            wordDetail,
            isLogin,
            isInNotebook: wordDetail.in_notebook,
        })
        let voiceUrl = word_utils.getWordVoiceUrl(wordDetail.word)
        innerAudioContext.src = voiceUrl
    },

    playVoice() {
        innerAudioContext.stop()
        innerAudioContext.play()
    },

    // 调整是否添加到生词本
    toggleAddToNB: async function () {
        let add = this.data.isInNotebook
        let res = await wordApi.toggleAddToNB({
            user_id: app.globalData.userInfo.user_id,
            word_id: this.data.wordDetail.word_id,
            add: !add,
        })
        console.log(res)
        if (res.data) {
            this.setData({
                isInNotebook: !add,
            })
        } else {
            wx.showToast({
                title: '操作出错，请重试',
                icon: 'none',
                duration: 1000,
            })
        }
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

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
        if (this.data.wordDetail.in_notebook != this.data.isInNotebook) app.globalData.updatedForOverview = true
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