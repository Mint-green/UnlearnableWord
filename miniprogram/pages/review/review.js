// pages/review/review.js
import regeneratorRuntime, { async } from '../../lib/runtime/runtime';
const rescontent = require("../../utils/response_content.js")
const wordApi = require("../../utils/wordApi.js")
const word_utils = require("../../utils/word_utils.js")
const color = require("../../utils/color.js")

const app = getApp()
// const innerAudioContext = wx.createInnerAudioContext({ useWebAudioImplement: true })
let mode = {
    chooseTrans: { wordMode: 0, contentMode: 0, controlMode: 0 },
    recallTrans: { wordMode: 0, contentMode: 2, controlMode: 1 },
    recallWord: { wordMode: 1, contentMode: 1, controlMode: 1 },
    all: { wordMode: 0, contentMode: 1, controlMode: 3 },
    // 如果不倒计时，会在init里进行调整，故没有用const声明
}

Page({

    /**
     * 页面的初始数据
     */
    data: {
        colorType: 0,
        reviewedNum: 0,
        reviewNum: 0,
        wordDetail: {},
        repeatTimes: 0,
        thisWordRepeatTime: 1,
        wordMode: 2,
        contentMode: 3,
        controlMode: 2,
        // 选择题相关
        wrongTransWordList: [],
        choiceOrder: [],
        choiceBgList: [],
        // 倒计时用到
        wordTimingConfig: {},
        wordTimingReset: false,
        wordTimingStop: false,
        contentTimingConfig: {},
        contentTimingReset: false,
        contentTimingStop: false,
        // innerAudioContextIndex: 0,
        isInNotebook: false,
        isBtnActive: false,
        reviewDone: false,
        reviewRes: [],
    },
    settings: {},
    wordDetailList: [],
    wordLearningRecord: [],
    control: {
        // 当前&下一个词汇在原数组中下标
        nowIndex: -1,
        nextIndex: -1,
        // 正确选项的下标
        rightIndex: -1,
        // 单词音频播放器
        innerAudioContext: undefined,
        // 倒计时模块是否初始化
        isWordTimingInit: false,
        isContentTimingInit: false,
        // 选择题显示答案后停留计时器
        isShowAllTimerSet: false,
        showAllTimer: -1,
        // 复习队列
        reviewingList: undefined,
        reviewedList: undefined,
        // queNameList: [],
        modeList: undefined,
        isQuickTimer: false,
        quickTimer: -1,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        wx.setNavigationBarTitle({
            title: '复习',
        })

        this.init()
        this.initReviewData()
    },

    tempShow() {
        let reviewData = wx.getStorageSync('reviewData')
        let wordDetailList = wx.getStorageSync('wordDetailList')
        let temp = 0
        for (let i = 0; i < reviewData.length; i++) {
            for (let j = 0; j < wordDetailList.length; j++) {
                let innerTemp = (temp + j) % wordDetailList.length
                if (reviewData[i].word_id == wordDetailList[innerTemp].word_id) {
                    reviewData[i].word = wordDetailList[innerTemp].word
                    temp = innerTemp
                    break
                }
            }
        }
        this.setData({
            reviewRes: reviewData,
        })
    },

    init() {
        // this.tempShow()
        wx.enableAlertBeforeUnload({
            message: '现在退出将导致复习数据丢失哦',
            success: () => { console.log('success') },
            fail: () => { console.log('fail') },
        })

        // 初始化页面颜色
        let colorType = Math.floor(Math.random() * color.colorList.length)
        wx.setNavigationBarColor({
            backgroundColor: color.colorList[colorType],
            frontColor: '#ffffff',
        })

        // 初始化设置
        let userSettings = app.globalData.userInfo.settings
        let settings = {}
        settings.repeat_times = (!(userSettings.review_repeat_t)) ? 1 : userSettings.review_repeat_t
        settings.group_size = (!(userSettings.group_size)) ? 20 : userSettings.group_size
        settings.first_mode = (!(userSettings.review_first_m)) ? 'recallTrans' : userSettings.review_first_m
        settings.second_mode = (!(userSettings.review_second_m)) ? 'recallWord' : userSettings.review_second_m
        settings.third_mode = (!(userSettings.review_third_m)) ? 'recallTrans' : userSettings.review_third_m
        settings.timing = (userSettings.timing === undefined) ? true : userSettings.timing
        settings.timing_duration = (userSettings.timing_duration === undefined) ? 1500 : userSettings.timing_duration
        settings.autoplay = (userSettings.autoplay === undefined) ? true : userSettings.autoplay
        this.settings = settings
        // let queNameList = ['unLearnedList', 'repeatOnce', 'repeatTwice','learnedList']
        // for (let i = settings.repeat_times; i < 3; i++) queNameList[i] = 'learnedList'
        // this.control.queNameList = queNameList

        // 初始化显示内容组合
        let modeList = []
        if (!(settings.timing)) {
            mode.recallTrans.contentMode = 3
            mode.recallWord.wordMode = 2
        }
        modeList.push(settings.first_mode)
        modeList.push(settings.second_mode)
        modeList.push(settings.third_mode)
        this.control.modeList = modeList

        let chooseTransIndex = modeList.indexOf('chooseTrans')
        this.settings.sample = (chooseTransIndex != -1) ? true : false

        this.setData({
            colorType,
            repeatTimes: settings.repeat_times,
        })
    },

    async initReviewData() {
        console.log('before getting data', new Date().getTime())
        let learnDataRes = await wordApi.getReviewData({
            user_id: app.globalData.userInfo.user_id,
            wd_bk_id: app.globalData.userInfo.l_book_id,
            groupSize: this.settings.group_size,
            sample: this.settings.sample,
        })
        console.log(learnDataRes)
        // wx.setStorageSync('wordDetailList', learnDataRes.data)
        let wordDetailList = learnDataRes.data
        // let wordDetailList = wx.getStorageSync('wordDetailList')
        wordDetailList = word_utils.batchHandleWordDetal(wordDetailList, { getShortTrans: true })
        console.log(wordDetailList)
        console.log('after handling data', new Date().getTime())

        // let reviewingList = [...new Array(wordDetailList.length).keys()] // 不知道为啥会报错
        let reviewingList = []
        let wordLearningRecord = []
        for (let i = 0; i < wordDetailList.length; i++) {
            wordDetailList[i].innerAudioContext = wx.createInnerAudioContext({ useWebAudioImplement: true })
            wordDetailList[i].innerAudioContext.src = wordDetailList[i].voiceUrl
            reviewingList.push(i)

            wordLearningRecord.push({
                word_id: wordDetailList[i].word_id,
                repeatTimes: 0,
                wrongTimes: 0,
                uncertainTimes: 0,
                master: false,
                q: -1,
            })
        }
        this.wordDetailList = wordDetailList
        this.wordLearningRecord = wordLearningRecord
        this.control.reviewingList = reviewingList
        this.control.reviewedList = []
        this.setData({
            reviewNum: wordDetailList.length < this.settings.group_size ? wordDetailList.length : this.settings.group_size
        })

        // 将未学习的队列的第一项“放出来”学习
        this.showNextWord()
    },

    // 生成干扰项数组（最后一项为正确答案），生成用于打乱和标记背景颜色的数组以及正确选项索引
    getWrongTrans(nowIndex) {
        if (!(nowIndex)) nowIndex = this.control.nowIndex
        let numList = word_utils.randNumList(8, 3)
        let wrongTransWordList = []
        for (let j = 0; j < numList.length; j++) {
            wrongTransWordList.push(this.wordDetailList[nowIndex].sample_list[numList[j]])
        }
        wrongTransWordList.push(this.wordDetailList[nowIndex].sample_list[9])

        let choiceOrder = [0, 1, 2, 3]
        choiceOrder = word_utils.randArr(choiceOrder)
        let rightIndex = choiceOrder.indexOf(3)
        let choiceBgList = ['', '', '', '']
        // choiceBgList[rightIndex] = 'rightchoice'
        // choiceBgList[(rightIndex + 1) % 4] = 'falsechoice'
        this.control.rightIndex = rightIndex
        this.setData({
            wrongTransWordList,
            choiceOrder,
            choiceBgList,
        })
    },

    initTiming(type = 'content') {
        let colorType = this.data.colorType
        let config = {
            canvasSize: {
                width: 80,
                height: 80
            },
            percent: 100,
            barStyle: [
                { width: 8, fillStyle: '#f6f6f6' },
                {
                    width: 8,
                    animate: true,
                    fillStyle: color.deeperColorList[colorType],
                    lineCap: 'round'
                }],
            totalTime: this.settings.timing_duration,
        }
        if (type == 'content') {
            this.setData({
                contentTimingConfig: config,
                contentTimingReset: false,
                contentTimingStop: false,
            })
            this.control.isContentTimingInit = true
        } else if (type == 'word') {
            this.setData({
                wordTimingConfig: config,
                wordTimingReset: false,
                wordTimingStop: false,
            })
            this.control.isWordTimingInit = true
        }
        // this.resetCanvasFunc()
    },

    playVoice() {
        this.control.innerAudioContext.stop()
        this.control.innerAudioContext.play()
        // this.wordDetailList[this.data.innerAudioContextIndex].innerAudioContext.stop()
        // this.wordDetailList[this.data.innerAudioContextIndex].innerAudioContext.play()
    },

    checkChoice(e) {
        this.setData({ isBtnActive: false })
        // console.log(e)
        let thisChoice = e.currentTarget.dataset.index
        let rightIndex = this.control.rightIndex
        // let choiceOrder = this.data.choiceOrder
        let choiceBgList = ['', '', '', '']
        choiceBgList[rightIndex] = 'rightChoice'

        // 如果显示答案的倒计时已经设置了，则“加速”，同时进行错误选项的检测
        if (this.control.isShowAllTimerSet) {
            if (thisChoice != rightIndex) choiceBgList[thisChoice] = 'falseChoice'
            this.setData({
                contentMode: 1,
                controlMode: 3,
                choiceBgList,
                isBtnActive: true
            })
            clearTimeout(this.control.showAllTimer)
            this.control.isShowAllTimerSet = false
            this.checkDone()
            return
        }

        let nowIndex = this.control.nowIndex
        if (thisChoice == rightIndex) {
            // 如果是第一次，则作为recall质量的判定
            if (this.wordLearningRecord[nowIndex].wrongTimes == 0 && this.wordLearningRecord[nowIndex].repeatTimes == 0 && this.wordLearningRecord[nowIndex].uncertainTimes == 0) {
                if (this.control.isQuickTimer) {
                    this.wordLearningRecord[nowIndex].q = 5
                    clearTimeout(this.control.quickTimer)
                    this.control.isQuickTimer = false
                } else {
                    this.wordLearningRecord[nowIndex].q = 4
                }
            }
            this.wordLearningRecord[nowIndex].repeatTimes += 1
            if (this.wordLearningRecord[nowIndex].repeatTimes >= 3) {
                this.updateReviewed()
            } else if (this.wordLearningRecord[nowIndex].wrongTimes == 0 && this.wordLearningRecord[nowIndex].uncertainTimes == 0 && this.wordLearningRecord[nowIndex].repeatTimes >= this.settings.repeat_times) {
                this.updateReviewed()
            } else {
                this.control.reviewingList.push(nowIndex)
            }
        } else {
            choiceBgList[thisChoice] = 'falseChoice'
            if (this.wordLearningRecord[nowIndex].wrongTimes <= 3) {
                this.wordLearningRecord[nowIndex].repeatTimes = 0
            }
            this.wordLearningRecord[nowIndex].q = 3
            this.wordLearningRecord[nowIndex].wrongTimes += 1
            this.control.reviewingList.push(nowIndex)
        }
        this.setData({
            choiceBgList,
            thisWordRepeatTime: this.wordLearningRecord[nowIndex].repeatTimes,
        })

        // 设置1s之后显示详情
        let _this = this
        this.control.isShowAllTimerSet = true
        this.control.showAllTimer = setTimeout(function () {
            _this.setData({
                contentMode: 1,
                controlMode: 3,
            })
            _this.control.isShowAllTimerSet = false
            _this.checkDone()
        }, 1000)
        this.setData({ isBtnActive: true })
    },

    showAnswer() {
        this.setData({ isBtnActive: false })
        // 如果显示答案的倒计时已经设置了，则“加速”
        if (this.control.isShowAllTimerSet) {
            clearTimeout(this.control.showAllTimer)
            this.setData({
                contentMode: 1,
                controlMode: 3,
                isBtnActive: true,
            })
            this.control.isShowAllTimerSet = false
            this.checkDone()
            return
        }

        let rightIndex = this.control.rightIndex
        let choiceBgList = ['', '', '', '']
        choiceBgList[rightIndex] = 'rightChoice'

        // 按照错误处理
        let nowIndex = this.control.nowIndex
        if (this.wordLearningRecord[nowIndex].wrongTimes <= 3) {
            this.wordLearningRecord[nowIndex].repeatTimes = 0
        }
        this.wordLearningRecord[nowIndex].q = 3
        this.wordLearningRecord[nowIndex].wrongTimes += 1
        this.control.reviewingList.push(nowIndex)
        this.setData({
            choiceBgList,
            thisWordRepeatTime: this.wordLearningRecord[nowIndex].repeatTimes,
        })

        // 设置1s之后显示详情
        let _this = this
        this.control.isShowAllTimerSet = true
        this.control.showAllTimer = setTimeout(function () {
            _this.setData({
                contentMode: 1,
                controlMode: 3,
            })
            _this.control.isShowAllTimerSet = false
        }, 1000)
        this.setData({ isBtnActive: true })
    },

    setAsType(e) {
        this.setData({ isBtnActive: false })
        let type = e.currentTarget.dataset.type
        let nowIndex = this.control.nowIndex

        if (type == 'known') {
            // 如果是第一次，则作为recall质量的判定
            if (this.wordLearningRecord[nowIndex].wrongTimes == 0 && this.wordLearningRecord[nowIndex].repeatTimes == 0 && this.wordLearningRecord[nowIndex].uncertainTimes == 0) {
                if (this.control.isQuickTimer) {
                    this.wordLearningRecord[nowIndex].q = 5
                    clearTimeout(this.control.quickTimer)
                    this.control.isQuickTimer = false
                } else {
                    this.wordLearningRecord[nowIndex].q = 4
                }
            }
            this.wordLearningRecord[nowIndex].repeatTimes += 1
            if (this.wordLearningRecord[nowIndex].repeatTimes >= 3) {
                this.updateReviewed()
            } else if (this.wordLearningRecord[nowIndex].wrongTimes == 0 && this.wordLearningRecord[nowIndex].uncertainTimes == 0 && this.wordLearningRecord[nowIndex].repeatTimes >= this.settings.repeat_times) {
                this.updateReviewed()
            } else {
                this.control.reviewingList.push(nowIndex)
            }
        } else if (type == 'uncertain') {
            // 模糊按照错误的方法处理，但增加不确定次数，若是第一次则判定相应质量为4
            if (this.wordLearningRecord[nowIndex].wrongTimes == 0 && this.wordLearningRecord[nowIndex].repeatTimes == 0 && this.wordLearningRecord[nowIndex].uncertainTimes == 0) {
                this.wordLearningRecord[nowIndex].q = 4
                clearTimeout(this.control.quickTimer)
                this.control.isQuickTimer = false
            }
            if (this.wordLearningRecord[nowIndex].q == 5) this.wordLearningRecord[nowIndex].q = 4
            if (this.wordLearningRecord[nowIndex].wrongTimes <= 3) {
                this.wordLearningRecord[nowIndex].repeatTimes = 0
            }
            this.wordLearningRecord[nowIndex].uncertainTimes += 1
            this.control.reviewingList.push(nowIndex)
        } else if (type == 'unknown') {
            // 不认识/错误则在错误次数不大于3次时重置学习次数
            if (this.wordLearningRecord[nowIndex].wrongTimes == 0 && this.wordLearningRecord[nowIndex].repeatTimes == 0 && this.wordLearningRecord[nowIndex].uncertainTimes == 0) {
                clearTimeout(this.control.quickTimer)
                this.control.isQuickTimer = false
            }
            if (this.wordLearningRecord[nowIndex].wrongTimes <= 3) {
                this.wordLearningRecord[nowIndex].repeatTimes = 0
            }
            this.wordLearningRecord[nowIndex].q = 3
            this.wordLearningRecord[nowIndex].wrongTimes += 1
            this.control.reviewingList.push(nowIndex)
        } else if (type == 'changeToUnknown') {
            wx.showToast({
                title: '已标记为不认识',
                icon: 'none',
                duration: 1000,
            })
            // 从认识/模糊转成忘记时，一样按照错误处理一次，若复习队列最后一项不是该词的话，将之添加进学习队列
            if (this.wordLearningRecord[nowIndex].wrongTimes <= 3) {
                this.wordLearningRecord[nowIndex].repeatTimes = 0
            }
            this.wordLearningRecord[nowIndex].q = 3
            this.wordLearningRecord[nowIndex].wrongTimes += 1
            if (this.control.reviewedList.indexOf(nowIndex) >= 0) this.control.reviewingList.push(nowIndex)
        }
        let control_m = {
            known: 2,
            uncertain: 2,
            unknown: 3,
        }

        // 更改显示
        if (this.data.contentMode != 1) {
            this.setData({
                contentTimingStop: true,
                controlMode: control_m[type],
                thisWordRepeatTime: this.wordLearningRecord[nowIndex].repeatTimes,
            })
            this.setData({
                contentMode: 1,
                isBtnActive: true,
            })
            this.checkDone()
        } else if (this.data.wordMode != 0) {
            this.setData({
                wordTimingStop: true,
                controlMode: control_m[type],
                thisWordRepeatTime: this.wordLearningRecord[nowIndex].repeatTimes,
            })
            this.setData({
                wordMode: 0,
                isBtnActive: true,
            })
            this.checkDone()
        } else {
            this.showNextWord()
        }
    },

    toNextWord() {
        // 由于页面事件的第一个参数默认是event，与showNextWord默认参数有冲突，故用此函数间接调用
        this.setData({ isBtnActive: false })
        this.showNextWord()
    },

    showNextWord() {
        if (this.checkDone()) return
        // 获取单词索引后，根据该单词的学习记录设置显示内容
        let nextIndex = this.control.reviewingList.shift()
        console.log('nextIndex:', nextIndex)
        if (nextIndex == -1) console.log('学完本组单词啦~')
        this.control.nowIndex = nextIndex
        let repeatTimes = this.wordLearningRecord[nextIndex].repeatTimes
        let modeDetail = mode[this.control.modeList[repeatTimes]]
        if (modeDetail.contentMode == 0) this.getWrongTrans(nextIndex)
        if (modeDetail.wordMode == 1) {
            if (!(this.control.isWordTimingInit)) {
                this.initTiming('word')
            } else {
                // this.resetCanvas('word')
            }
        }
        if (modeDetail.contentMode == 2) {
            if (!(this.control.isContentTimingInit)) {
                this.initTiming('content')
            } else {
                // this.resetCanvas('content')
            }
        }
        // this.setData(modeDetail)
        this.setData({
            ...modeDetail,
            wordDetail: {
                word: this.wordDetailList[nextIndex].word,
                word_id: this.wordDetailList[nextIndex].word_id,
                phonetic: this.wordDetailList[nextIndex].phonetic,
                shortTrans: this.wordDetailList[nextIndex].shortTrans,
            },
            thisWordRepeatTime: this.wordLearningRecord[nextIndex].repeatTimes,
            repeatTimes: (this.wordLearningRecord[nextIndex].wrongTimes == 0 && this.wordLearningRecord[nextIndex].uncertainTimes == 0) ? this.settings.repeat_times : 3,
            contentTimingStop: false,
            wordTimingStop: false,
            isInNotebook: this.wordDetailList[nextIndex].in_notebook ? true : false,
            isBtnActive: true,
        })
        if (this.wordLearningRecord[nextIndex].repeatTimes == 0 && this.wordLearningRecord[nextIndex].wrongTimes == 0 && this.wordLearningRecord[nextIndex].uncertainTimes == 0) {
            let _this = this
            this.control.isQuickTimer = true
            this.control.quickTimer = setTimeout(function () {
                _this.control.isQuickTimer = false
            }, 2000)
        }
        if (this.control.innerAudioContext) this.control.innerAudioContext.stop()
        this.control.innerAudioContext = this.wordDetailList[nextIndex].innerAudioContext
        if (this.settings.autoplay && modeDetail.wordMode == 0) this.control.innerAudioContext.play()
    },

    //  实际重新显示的时候会再次触发config内容更改（重新获取）从而再次触发重绘，无需手动设置reset
    resetCanvas(type = 'content') {
        if (type == 'content') {
            this.setData({
                contentTimingReset: false,
                // contentTimingStop: false,
            })
            this.setData({
                contentTimingReset: true,
            })
        } else if (type == 'word') {
            this.setData({
                wordTimingReset: false,
                // wordTimingStop: false,
            })
            this.setData({
                wordTimingReset: true,
            })
        }
    },

    showTrans() {
        this.setData({
            contentTimingStop: true,
        })
        this.setData({
            contentMode: 1,
        })
    },

    showWord() {
        this.setData({
            wordTimingStop: true,
        })
        if (this.settings.autoplay) this.control.innerAudioContext.play()
        this.setData({
            wordMode: 0,
        })
    },

    timingOut(e) {
        // console.log('receive from myprogress', e)
        let type = e.currentTarget.dataset.type
        if (e.detail.timeout) {
            if (type == 'content') {
                if (this.data.contentMode == 2) { this.showTrans() } else { console.log('content倒计时没真正没关掉') }
            }
            if (type == 'word') {
                if (this.data.wordMode == 1) { this.showWord() } else { console.log('word倒计时没真正没关掉') }
            }
        }
    },

    toDetail: function () {
        wx.navigateTo({
            url: '../word_detail/word_detail?word_id=' + this.data.wordDetail.word_id + '&colorType=' + this.data.colorType,
        })
    },

    // 跳过当前环节/设置为已掌握
    skip(e) {
        this.setData({ isBtnActive: false })
        let type = e.currentTarget.dataset.type
        let nowIndex = this.control.nowIndex
        if (this.control.reviewedList.indexOf(nowIndex) >= 0) {
            wx.showToast({
                title: '该词已完成学习啦',
                icon: 'none',
                duration: 1000,
            })
            if (type == 'master') this.wordLearningRecord[nowIndex].master = true
            this.setData({ isBtnActive: true })
            return
        }
        // this.control.reviewedList.push(nowIndex)
        this.wordLearningRecord[nowIndex].repeatTimes = this.settings.repeat_times
        if (type == 'master') this.wordLearningRecord[nowIndex].master = true

        this.setData({
            thisWordRepeatTime: this.settings.repeat_times,
            ...mode.all,
            isBtnActive: true,
        })
        let tips = (type == 'master') ? '已掌握' : '跳过该轮学习'
        wx.showToast({
            title: `已将该词设置为${tips}`,
            icon: 'none',
            duration: 1000,
        })
        this.updateReviewed()
        this.setData({ isBtnActive: true })
    },

    // 调整是否添加到生词本
    toggleAddToNB: async function () {
        this.setData({ isBtnActive: false })
        let add = this.data.isInNotebook
        let res = await wordApi.toggleAddToNB({
            user_id: app.globalData.userInfo.user_id,
            word_id: this.wordDetailList[this.control.nowIndex].word_id,
            add: !add,
        })
        console.log(res)
        if (res.data) {
            this.wordDetailList[this.control.nowIndex].in_notebook = !add
            this.setData({
                isInNotebook: !add,
                isBtnActive: true
            })
        } else {
            wx.showToast({
                title: '操作出错，请重试',
                icon: 'none',
                duration: 1000,
            })
            this.setData({ isBtnActive: true })
        }
    },

    updateReviewed() {
        this.control.reviewedList.push(this.control.nowIndex)
        let reviewedNum = this.control.reviewedList.length
        this.setData({ reviewedNum })
    },

    checkDone() {
        let reviewedNum = this.control.reviewedList.length
        if (reviewedNum != this.data.reviewedNum) this.setData({ reviewedNum })
        if (reviewedNum >= this.data.reviewNum) {
            console.log('本组单词复习完毕啦~')
            this.setData({
                isBtnActive: false,
                reviewDone: true,
            })
            this.updateLearningData()
            return true
        }
        return false
    },

    async updateLearningData() {
        wx.showLoading({
            title: '复习数据上传中...',
            mask: true,
        })

        let wordLearningRecord = []
        for (let i = 0; i < this.control.reviewedList.length; i++) {
            let record = this.wordDetailList[i].record
            let q = this.wordLearningRecord[this.control.reviewedList[i]].q
            // 只要错q就为3，每多错两次q-1，即>0则q=3, >2则q=2, >4则q=1, >6则q=0
            if (this.wordLearningRecord[this.control.reviewedList[i]].wrongTimes > 0) {
                q = 3
                q = q + 1 - Math.ceil(this.wordLearningRecord[this.control.reviewedList[i]].wrongTimes / 2)
                if (q < 0) q = 0
            }
            record.q = q
            record.master = this.wordLearningRecord[this.control.reviewedList[i]].master
            wordLearningRecord.push(record)
        }
        console.log('upload wordLearningRecord', wordLearningRecord)

        let res = await wordApi.updateLearningRecord({
            wordLearningRecord: wordLearningRecord,
            user_id: app.globalData.userInfo.user_id
        })
        console.log(res)
        app.globalData.updatedForIndex = true
        app.globalData.updatedForOverview = true
        wx.hideLoading()
        wx.disableAlertBeforeUnload()
        // wx.setStorageSync('reviewData', res.data)
        if (res.errorcode != rescontent.SUCCESS.errorcode) {
            wx.showToast({
                title: '很抱歉，数据上传出错',
                icon: 'none',
                duration: 1000,
            })
            return
        }

        let reviewData = JSON.parse(JSON.stringify(res.data))
        let temp = 0
        for (let i = 0; i < reviewData.length; i++) {
            for (let j = 0; j < this.wordDetailList.length; j++) {
                let innerTemp = (temp + j) % this.wordDetailList.length
                if (reviewData[i].word_id == this.wordDetailList[innerTemp].word_id) {
                    reviewData[i].word = this.wordDetailList[innerTemp].word
                    temp = innerTemp
                    break
                }
            }
        }
        this.setData({
            reviewRes: reviewData,
        })
    },

    goBack() {
        wx.navigateBack({
            delta: 1,
        })
    },

    reInit() {
        // 数据恢复初始状态
        this.settings = {}
        this.wordDetailList = []
        this.wordLearningRecord = []
        this.control = {
            // 当前&下一个词汇在原数组中下标
            nowIndex: -1,
            nextIndex: -1,
            // 正确选项的下标
            rightIndex: -1,
            // 单词音频播放器
            innerAudioContext: undefined,
            // 倒计时模块是否初始化
            isWordTimingInit: false,
            isContentTimingInit: false,
            // 选择题显示答案后停留计时器
            isShowAllTimerSet: false,
            showAllTimer: -1,
            // 复习队列
            reviewingList: undefined,
            reviewedList: undefined,
            modeList: undefined,
            isQuickTimer: false,
            quickTimer: -1,
        }
        this.setData({
            reviewedNum: 0,
            learnNum: 0,
            reviewNum: {},
            repeatTimes: 0,
            thisWordRepeatTime: 1,
            wordMode: 2,
            contentMode: 3,
            controlMode: 2,
            reviewDone: false,
            reviewRes: [],
        })
        this.init()
        this.initReviewData()
    },

    // 调试用
    showInfo(e) {
        let infoName = e.currentTarget.dataset.name
        console.log(infoName, ':', this[infoName])
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
        console.log('onReady')
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
        wx.disableAlertBeforeUnload()
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})