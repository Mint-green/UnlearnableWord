// pages/index/index.js
const app = getApp()
import regeneratorRuntime, { async } from '../../lib/runtime/runtime';
const format_time = require('../../utils/format_time.js')
const rescontent = require('../../utils/response_content.js')
const wordApi = require('../../utils/wordApi.js')
const userApi = require('../../utils/userApi.js')
const word_utils = require("../../utils/word_utils.js")

// const innerAudioContext = wx.createInnerAudioContext({ useWebAudioImplement: true })

Page({

    /**
     * 页面的初始数据
     */
    data: {
        dailySentence: [],
        sentenceIndex: 0,
        isLogin: false,
        needToLearn: 0,
        needToReview: 0,
        isChangingBook: false,
        allBkData: [],
    },
    control: {
        innerAudioContextList: [],
        isPlayingVoice: false,
        lastIndex: 0,
        isUpdatingData: false,
        loginTimer: -1,
        dataStr: '',
        pageHide: false,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.init()
    },

    init() {
        wx.setNavigationBarColor({
            backgroundColor: '#86e3ce',
            frontColor: '#ffffff',
        })
        this.getDailySentence()
        this.setData({
            isLogin: app.globalData.isLogin
        })
        if (app.globalData.tryingLogin) {
            // console.log('Open tryingLogin listener')
            let _this = this
            this.control.loginTimer = setInterval(function () {
                // console.log('tryingLogin listener')
                if (!app.globalData.tryingLogin) {
                    _this.control.pageHide = true
                    _this.onShow()
                    clearInterval(_this.control.loginTimer)
                }
            }, 200)
        }

        if (this.data.isLogin) {
            if (app.globalData.userInfo.l_book_id == -1) {
                wx.showToast({
                    title: '您还未设置词书，请先设置词书哦',
                    icon: 'none',
                    duration: 1000,
                })
                this.showBookList()
                return
            }
            this.getBasicLearningData()
        }
    },

    async getDailySentence() {
        let dateStr = format_time.formatDate(new Date())
        this.control.dateStr = dateStr
        // let dailySentence = wx.getStorageSync('dailySentence')
        // wx.removeStorageSync('dailySentence')
        // if (dailySentence && dailySentence.date == dateStr) {
        //     dailySentence = dailySentence.data
        // } else {
        let t1 = new Date().getTime()
        console.log('Start', t1)
        let res = await wordApi.getDailySentence()
        console.log(res)
        let t2 = new Date().getTime()
        console.log('Done', t2, 'Time Spent', t2 - t1)

        for (let i = 0; i < res.data.length; i++) {
            if (!(res.data[i].voiceUrl && res.data[i].voiceUrl != '')) {
                res.data[i].voiceUrl = word_utils.getWordVoiceUrl(res.data[i].content)
            }
        }
        // wx.setStorageSync('dailySentence', {
        //     date: dateStr,
        //     data: res.data
        // })
        let dailySentence = res.data
        // }
        this.setData({ dailySentence: dailySentence })

        this.control.innerAudioContextList = []
        for (let j = 0; j < dailySentence.length; j++) {
            let innerAudioContext = wx.createInnerAudioContext({ useWebAudioImplement: true })
            let _this = this
            innerAudioContext.onEnded(() => {
                // console.log('结束播放')
                _this.control.isPlayingVoice = false
            })
            innerAudioContext.volume = 1
            innerAudioContext.src = dailySentence[j].voiceUrl
            this.control.innerAudioContextList.push(innerAudioContext)
        }
    },

    async getBasicLearningData() {
        this.control.isUpdatingData = true
        let res = await wordApi.getBasicLearningData({
            user_id: app.globalData.userInfo.user_id,
            wd_bk_id: app.globalData.userInfo.l_book_id,
        })
        console.log('getBasicLearningData result', res)
        this.setData({
            needToLearn: res.data.needToLearn,
            needToReview: res.data.needToReview,
        })
        this.control.isUpdatingData = false
    },

    playVoice(e) {
        // console.log('playVoice', e)
        let index = e.currentTarget.dataset.index
        console.log('try to play/stop sentence voice')
        if (this.control.isPlayingVoice) {
            this.control.innerAudioContextList[index].stop()
            // console.log('手动停止')
            this.control.isPlayingVoice = false
            return
        }
        this.control.innerAudioContextList[index].play()
        this.control.isPlayingVoice = true
    },

    changeSwiperItem(e) {
        // console.log(e)
        let nextIndex = e.detail.current
        if (this.control.isPlayingVoice) {
            this.control.innerAudioContextList[this.control.lastIndex].stop()
            this.control.isPlayingVoice = false
            // console.log('被动停止')
        }
        this.control.lastIndex = nextIndex
    },

    toOtherPage(e) {
        let type = e.currentTarget.dataset.type
        wx.navigateTo({
            url: `../${type}/${type}`,
        })
    },

    toLearnPage(e) {
        let type = e.currentTarget.dataset.type
        if (this.control.isUpdatingData) {
            wx.showToast({
                title: '更新数据中，请重试',
                icon: 'none',
                duration: 1000,
            })
            return
        }
        if (type == 'learning') {
            if (app.globalData.userInfo.l_book_id == -1) {
                wx.showToast({
                    title: '请选择词书后再进行学习哦',
                    icon: 'none',
                    duration: 1000,
                })
                return
            }
            if (this.data.needToLearn == 0) {
                wx.showToast({
                    title: '已完成本书的学习啦，可以选新的词书哦',
                    icon: 'none',
                    duration: 1000,
                })
                return
            }
        } else if (type == 'review') {
            if (this.data.needToReview == 0) {
                wx.showToast({
                    title: '今日复习任务已完成啦~',
                    icon: 'none',
                    duration: 1000,
                })
                return
            }
        }
        wx.navigateTo({
            url: `../${type}/${type}`,
        })
    },

    touchMove(e) {
        return
        let time = new Date().getTime()
        console.log('手指触摸后移动', time)
        console.log(e)
    },

    async showBookList() {
        this.setData({
            isChangingBook: true,
        })
        let allBkData = this.data.allBkData
        if (!allBkData || allBkData.length == 0) allBkData = (await wordApi.getAllWBData()).data
        this.setData({
            allBkData: allBkData,
        })
    },

    showTips(e) {
        wx.showToast({
            title: '请先选择词书哦',
            icon: 'none',
            duration: 1500,
        })
    },

    async changeWordBook(e) {
        console.log('changeWordBook')
        let index = e.currentTarget.dataset.index
        let bkInfo = this.data.allBkData[index]
        if (bkInfo.wd_bk_id != app.globalData.userInfo.l_book_id) {
            let res = await userApi.changeWordBook({
                user_id: app.globalData.userInfo.user_id,
                wd_bk_id: bkInfo.wd_bk_id,
            })
            if (res.data) {
                app.globalData.userInfo.l_book_id = bkInfo.wd_bk_id
                app.globalData.updatedForOverview = true
                this.getBasicLearningData()
                this.setData({
                    isChangingBook: false,
                })
            } else {
                wx.showToast({
                    title: '更换失败，请重试~',
                    icon: "none",
                    duration: 1500,
                })
            }
        }
    },

    endChange() {
        if (app.globalData.isLogin && app.globalData.userInfo.l_book_id == -1) {
            wx.showToast({
                title: '您还未选择词书，可以在概览页选择哦',
                icon: 'none',
                duration: 1500,
            })
        }
        this.setData({
            isChangingBook: false,
        })
    },

    // 为拥有进入过渡动画用，实际可不做处理
    onEnter() { },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        if (this.control.pageHide) {
            if (this.data.isChangingBook) {
                this.setData({ isChangingBook: false })
            }
            if (this.data.isLogin != app.globalData.isLogin) {
                this.setData({ isLogin: app.globalData.isLogin })
                if (app.globalData.isLogin) {
                    if (app.globalData.userInfo.l_book_id == -1) {
                        wx.showToast({
                            title: '您还未设置词书，请先设置词书哦',
                            icon: 'none',
                            duration: 1000,
                        })
                        this.showBookList()
                    } else {
                        this.getBasicLearningData()
                    }
                    app.globalData.updatedForIndex = false
                }
            }
            if (app.globalData.updatedForIndex) {
                if (app.globalData.isLogin) this.getBasicLearningData()
                app.globalData.updatedForIndex = false
            }
            if (format_time.formatDate(new Date()) != this.control.dateStr) {
                console.log('from onShow, change dailySentence')
                this.getDailySentence()
            }

            this.control.pageHide = false
        }
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {
        this.control.pageHide = true
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