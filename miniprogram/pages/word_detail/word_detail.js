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
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        let colorType = Math.floor(Math.random() * 17)
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
        // console.log(res)
        // wx.setStorageSync('wordDetail', res.data)
        // let wordDetail = res.data
        let wordDetail = wx.getStorageSync('wordDetail')
        if (wordDetail.word_id != word_id) {
            let res = await wordApi.getWordDetail({ word_id })
            wordDetail = res.data
        }
        let tagList = word_utils.getTagList(wordDetail)
        let definitionList = wordDetail.definition.split('\n')
        let transList = word_utils.toTransList(wordDetail.translation)
        let exchangeList = word_utils.toExchangeList(wordDetail.exchange)
        wordDetail.tag = tagList
        wordDetail.definition = definitionList
        wordDetail.translation = transList
        wordDetail.exchange = exchangeList
        console.log(wordDetail)
        this.setData({ wordDetail })
    },

    playVoice() {
        let word = this.data.wordDetail.word
        let voiceUrl = word_utils.getWordVoiceUrl(word)
        innerAudioContext.stop()
        innerAudioContext.src = voiceUrl
        innerAudioContext.play()
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