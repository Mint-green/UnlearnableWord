// pages/word_list/word_list.js
import regeneratorRuntime, { async } from '../../lib/runtime/runtime';
const wordApi = require("../../utils/wordApi.js")
const word_utils = require("../../utils/word_utils.js")
const color = require("../../utils/color.js")

const app = getApp()

let typeParameter = {
    getBkLearnedWord: { navTitle: '本书已学', user_id: true, wd_bk_id: true },
    getBkMasteredWord: { navTitle: '本书已掌握', user_id: true, wd_bk_id: true },
    getBkUnlearnedWord: { navTitle: '本书未学', user_id: true, wd_bk_id: true },
    getBkWord: { navTitle: '本书全部单词', user_id: false, wd_bk_id: true },
    getLearnedWord: { navTitle: '已学单词', user_id: true, wd_bk_id: false },
    getMasteredWord: { navTitle: '已掌握单词', user_id: true, wd_bk_id: false },
    getReviewWord: { navTitle: '复习中单词', user_id: true, wd_bk_id: false },
    getNoteBookWord: { navTitle: '收藏夹', user_id: true, wd_bk_id: false },
    today: { navTitle: '今日学习&复习', user_id: true, wd_bk_id: false },
}

Page({

    /**
     * 页面的初始数据
     */
    data: {
        wordList: [],
        hasMore: true,
        learnHasMore: true,
        reviewHasMore: true,
        isToday: false,
        todayLearn: undefined,
        todayReview: undefined,
        todayType: -1,
    },
    skip: 0,
    learnSkip: undefined,
    reviewSkip: undefined,
    type: '',

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        let type = this.options.type
        console.log('type', type)

        wx.setNavigationBarTitle({
            title: typeParameter[type].navTitle,
        })
        this.type = type

        if (type != 'today') {
            this.getData()
        } else {
            this.setData({
                todayType: 0
            })
            this.getTodayWord(0)
            this.getTodayWord(1)
        }
    },

    async getData() {
        let type = this.type
        if (!this.data.hasMore) return
        wx.showLoading({
            title: '加载中...',
        })
        let parameters = {}
        if (typeParameter[type].user_id) parameters.user_id = app.globalData.userInfo.user_id
        if (typeParameter[type].wd_bk_id) parameters.wd_bk_id = app.globalData.userInfo.l_book_id
        parameters.skip = this.skip
        let wordList = this.data.wordList
        console.log('parameters', parameters)
        let res = await wordApi[type](parameters)

        console.log('res', res)

        for (let i = 0; i < res.data.length; i++) {
            if (res.data[i].translation.indexOf('\n') != -1) {
                res.data[i].translation = res.data[i].translation.substring(0, res.data[i].translation.indexOf('\n'))
            }
            // console.log('rect length of:', directres[i], word_utils.getResObjRectLength(directres[i]))
        }

        wordList = wordList.concat(res.data)
        this.skip = wordList.length
        let hasMore = true
        if (res.data.length < 20) hasMore = false

        this.setData({
            wordList,
            hasMore
        })
        wx.hideLoading()
    },

    async getTodayWord(todayType) {
        if (todayType === undefined) todayType = this.data.todayType
        let hasMoreType = ['learnHasMore', 'reviewHasMore']
        if (!this.data[hasMoreType[todayType]]) return
        wx.showLoading({
            title: '加载中...',
        })
        let apiNameType = ['getTodayLearnWord', 'getTodayReviewWord']
        let skipType = ['getTodayLearnWord', 'getTodayReviewWord']
        let wordListType = ['todayLearn', 'todayReview']
        let type = apiNameType[todayType]
        let parameters = {}
        parameters.user_id = app.globalData.userInfo.user_id
        if (this[skipType[todayType]] === undefined) this[skipType[todayType]] = 0
        parameters.skip = this[skipType[todayType]]
        if (this.data[wordListType[todayType]] === undefined) this.data[wordListType[todayType]] = []
        let wordList = this.data[wordListType[todayType]]

        console.log('parameters', parameters)
        let res = await wordApi[type](parameters)

        console.log('res', res)

        for (let i = 0; i < res.data.length; i++) {
            if (res.data[i].translation.indexOf('\n') != -1) {
                res.data[i].translation = res.data[i].translation.substring(0, res.data[i].translation.indexOf('\n'))
            }
            // console.log('rect length of:', directres[i], word_utils.getResObjRectLength(directres[i]))
        }

        wordList = wordList.concat(res.data)
        this[skipType[todayType]] = wordList.length
        let hasMore = true
        if (res.data.length < 20) hasMore = false

        let updateData = {}
        updateData[wordListType[todayType]] = wordList
        updateData[hasMoreType[todayType]] = hasMore

        this.setData(updateData)
        wx.hideLoading()
    },

    getWordDetail(e) {
        let wordListName = 'wordList'
        if (this.data.todayType != -1) {
            let wordListType = ['todayLearn', 'todayReview']
            wordListName = wordListType[this.data.todayType]
        }
        let index = e.currentTarget.dataset.index
        let word_id = this.data[wordListName][index].word_id
        wx.navigateTo({
            url: `../word_detail/word_detail?word_id=${word_id}`,
        })
    },

    changeType() {
        this.setData({
            todayType: (this.data.todayType + 1) % 2
        })
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        console.log('onReachBottom')
        if (this.data.todayType == -1) {
            this.getData()
        } else {
            this.getTodayWord()
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

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})