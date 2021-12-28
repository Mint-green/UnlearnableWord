// pages/learning/learning.js
import regeneratorRuntime, { async } from '../../lib/runtime/runtime';
const rescontent = require("../../utils/response_content.js")
const wordApi = require("../../utils/wordApi.js")
const word_utils = require("../../utils/word_utils.js")
const color = require("../../utils/color.js")

const app = getApp()

// const innerAudioContext = wx.createInnerAudioContext({ useWebAudioImplement: true })

let mode = {
    chooseTrans: { wordMode: 0, contentMode: 0, controlMode: 0 },   // 看词选义
    recallTrans: { wordMode: 0, contentMode: 2, controlMode: 1 },   // 看词识义
    recallWord: { wordMode: 1, contentMode: 1, controlMode: 1 },    // 看义识词
    all: { wordMode: 0, contentMode: 1, controlMode: 3 },           // 不做遮挡
    // 如果不倒计时，会在init里进行调整，故没有用const声明
}
let insertIndex = 4
let listMinLength = 4

Page({

    /**
     * 页面的初始数据
     */
    data: {
        colorType: 0,
        learnedNum: 0,
        learnNum: 0,
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
        learnDone: false,
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
        // 学习队列
        unLearnedList: undefined,
        repeatOnce: undefined,
        repeatTwice: undefined,
        repeatThree: undefined,
        learnedList: undefined,
        queNameList: [],
        modeList: undefined,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        wx.setNavigationBarTitle({
            title: '学习',
        })

        this.init()
        this.initLearningData()
    },

    init() {
        wx.enableAlertBeforeUnload({
            message: '现在退出将导致学习数据丢失哦',
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
        settings.repeat_times = (!(userSettings.learn_repeat_t)) ? 3 : userSettings.learn_repeat_t
        settings.group_size = (!(userSettings.group_size)) ? 20 : userSettings.group_size
        settings.first_mode = (!(userSettings.learn_first_m)) ? 'chooseTrans' : userSettings.learn_first_m
        settings.second_mode = (settings.repeat_times >= 2 && !(userSettings.learn_second_m)) ? 'recallTrans' : userSettings.learn_second_m
        settings.third_mode = (settings.repeat_times >= 3 && !(userSettings.learn_third_m)) ? 'recallWord' : userSettings.learn_third_m
        settings.fourth_mode = (settings.repeat_times == 4 && !(userSettings.learn_fourth_m)) ? 'recallTrans' : userSettings.learn_fourth_m
        settings.timing = (userSettings.timing === undefined) ? true : userSettings.timing
        settings.timing_duration = (userSettings.timing_duration === undefined) ? 1500 : userSettings.timing_duration
        settings.autoplay = (userSettings.autoplay === undefined) ? true : userSettings.autoplay
        this.settings = settings
        let queNameList = ['unLearnedList', 'repeatOnce', 'repeatTwice', 'repeatThree', 'learnedList']
        for (let i = settings.repeat_times; i < 4; i++) queNameList[i] = 'learnedList'
        this.control.queNameList = queNameList

        // 初始化显示内容组合
        let modeList = []
        if (!(settings.timing)) {
            mode.recallTrans.contentMode = 3
            mode.recallWord.wordMode = 2
        }
        modeList.push(settings.first_mode)
        if (settings.repeat_times >= 2) modeList.push(settings.second_mode)
        if (settings.repeat_times >= 3) modeList.push(settings.third_mode)
        if (settings.repeat_times == 4) modeList.push(settings.fourth_mode)
        this.control.modeList = modeList
        
        // 检查题型是否包含“选义”题，包含则需要获取混淆选项
        let chooseTransIndex = modeList.indexOf('chooseTrans')
        this.settings.sample = (chooseTransIndex != -1) ? true : false

        this.setData({
            colorType,
            repeatTimes: settings.repeat_times,
        })
    },

    async initLearningData() {
        console.log('before getting data', new Date().getTime())
        let learnDataRes = await wordApi.getLearningData({
            user_id: app.globalData.userInfo.user_id,
            wd_bk_id: app.globalData.userInfo.l_book_id,
            groupSize: this.settings.group_size,
            sample: this.settings.sample,
        })
        // wx.setStorageSync('wordDetailList', learnDataRes.data)
        let wordDetailList = learnDataRes.data
        // let wordDetailList = wx.getStorageSync('wordDetailList')
        wordDetailList = word_utils.batchHandleWordDetal(wordDetailList, { getShortTrans: true })
        console.log(wordDetailList)
        console.log('after handling data', new Date().getTime())

        let wordLearningRecord = []
        let unLearnedList = []
        let repeatOnce = this.settings.repeat_times >= 2 ? [] : undefined
        let repeatTwice = this.settings.repeat_times >= 3 ? [] : undefined
        let repeatThree = this.settings.repeat_times == 4 ? [] : undefined
        for (let i = 0; i < wordDetailList.length; i++) {
            wordDetailList[i].innerAudioContext = wx.createInnerAudioContext({ useWebAudioImplement: true })
            wordDetailList[i].innerAudioContext.src = wordDetailList[i].voiceUrl
            wordLearningRecord.push({
                word_id: wordDetailList[i].word_id,
                repeatTimes: 0,
                reStartTimes: 0,
                master: false,
            })

            // 云端会将有学习过的记录一起返回，下面将已经学习过的词在词汇数组中的索引根据上次学习的重复次数添加到对应学习队列
            // 并将学习时重复次数添加入当前页面的记录，而reStartTimes等则重置
            if (!(wordDetailList[i].learning_record) || JSON.stringify(wordDetailList[i].learning_record) == "{}" || this.settings.repeat_times == 1) {
                unLearnedList.push(i)
            } else if (wordDetailList[i].learning_record.repeatTimes == 1) { // 要求重复次数不为1的话，则至少为2，这里无需再判断
                wordLearningRecord[i].repeatTimes = 1
                repeatOnce.push(i)
            } else if (wordDetailList[i].learning_record.repeatTimes == 2) {
                if (this.settings.repeat_times == 2) {
                    wordLearningRecord[i].repeatTimes = 1
                    repeatOnce.push(i)
                } else {
                    wordLearningRecord[i].repeatTimes = 2
                    repeatTwice.push(i)
                }
            } else if (wordDetailList[i].learning_record.repeatTimes == 3) {
                if (this.settings.repeat_times == 2) {
                    wordLearningRecord[i].repeatTimes = 1
                    repeatOnce.push(i)
                } else if (this.settings.repeat_times == 3) {
                    wordLearningRecord[i].repeatTimes = 2
                    repeatTwice.push(i)
                } else {
                    wordLearningRecord[i].repeatTimes = 3
                    repeatThree.push(i)
                }
            }
        }
        this.wordDetailList = wordDetailList
        this.wordLearningRecord = wordLearningRecord
        this.control.unLearnedList = unLearnedList
        this.control.repeatOnce = repeatOnce
        this.control.repeatTwice = repeatTwice
        this.control.repeatThree = repeatThree
        this.control.learnedList = []
        this.setData({
            learnNum: wordDetailList.length < this.settings.group_size ? wordDetailList.length : this.settings.group_size
        })

        // 将未学习的队列的第一项“放出来”学习
        let nowIndex = this.control.unLearnedList.shift()
        this.showNextWord(nowIndex)
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
        let nowRepeatTimes = this.wordLearningRecord[nowIndex].repeatTimes
        // let queNameList = ['unLearnedList', 'repeatOnce', 'repeatTwice', 'repeatThree', 'learnedList']
        // for (let i = this.settings.repeat_times; i < 4; i++) queNameList[i] = 'learnedList'
        if (thisChoice == rightIndex) {
            this.wordLearningRecord[nowIndex].repeatTimes += 1
            // this.control.repeatOnce.push(nowIndex)
            this.control[this.control.queNameList[this.wordLearningRecord[nowIndex].repeatTimes]].push(nowIndex)
            if (this.wordLearningRecord[nowIndex].repeatTimes >= this.settings.repeat_times) this.updateLearned()
        } else {
            choiceBgList[thisChoice] = 'falseChoice'
            if (this.wordLearningRecord[nowIndex].reStartTimes >= 3) {
                this.control[this.control.queNameList[this.wordLearningRecord[nowIndex].repeatTimes]].splice(insertIndex, 0, nowIndex)
            } else {
                this.wordLearningRecord[nowIndex].reStartTimes += 1
                this.wordLearningRecord[nowIndex].repeatTimes = 0
                this.control['unLearnedList'].splice(insertIndex, 0, nowIndex)
            }
        }
        this.setData({
            choiceBgList,
            thisWordRepeatTime: this.wordLearningRecord[nowIndex].repeatTimes,
        })
        this.control.nextIndex = this.getNextIndex(nowRepeatTimes)

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

        let nowIndex = this.control.nowIndex
        let nowRepeatTimes = this.wordLearningRecord[nowIndex].repeatTimes
        let rightIndex = this.control.rightIndex
        let choiceBgList = ['', '', '', '']
        choiceBgList[rightIndex] = 'rightChoice'
        // let queNameList = ['unLearnedList', 'repeatOnce', 'repeatTwice', 'repeatThree', 'learnedList']
        // for (let i = this.settings.repeat_times; i < 4; i++) queNameList[i] = 'learnedList'
        if (this.wordLearningRecord[nowIndex].reStartTimes >= 3) {
            this.control[this.control.queNameList[this.wordLearningRecord[nowIndex].repeatTimes]].splice(insertIndex, 0, nowIndex)
        } else {
            this.wordLearningRecord[nowIndex].reStartTimes += 1
            this.wordLearningRecord[nowIndex].repeatTimes = 0
            this.control['unLearnedList'].splice(insertIndex, 0, nowIndex)
        }
        this.setData({
            choiceBgList,
            thisWordRepeatTime: this.wordLearningRecord[nowIndex].repeatTimes,
        })
        // this.control.unLearnedList.splice(2, 0, nowIndex) // 如果数组长度超出2则会自动加在末尾
        this.control.nextIndex = this.getNextIndex(nowRepeatTimes)

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

    setAsKnown() {
        this.setData({ isBtnActive: false })
        // 正常标记为认识
        let nowIndex = this.control.nowIndex
        this.wordLearningRecord[nowIndex].repeatTimes += 1
        // let queNameList = ['unLearnedList', 'repeatOnce', 'repeatTwice', 'repeatThree', 'learnedList']
        // for (let i = this.settings.repeat_times; i < 4; i++) queNameList[i] = 'learnedList'
        this.control[this.control.queNameList[this.wordLearningRecord[nowIndex].repeatTimes]].push(nowIndex)
        if (this.wordLearningRecord[nowIndex].repeatTimes >= this.settings.repeat_times) this.updateLearned()
        this.control.nextIndex = this.getNextIndex(this.wordLearningRecord[nowIndex].repeatTimes - 1)

        // 更改显示
        if (this.data.contentMode != 1) {
            this.setData({
                contentTimingStop: true,
                controlMode: 2,
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
                controlMode: 2,
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

    setAsUnknown() {
        this.setData({ isBtnActive: false })
        let nowIndex = this.control.nowIndex
        let nowRepeatTimes = this.wordLearningRecord[nowIndex].repeatTimes
        // let queNameList = ['unLearnedList', 'repeatOnce', 'repeatTwice', 'repeatThree', 'learnedList']
        // for (let i = this.settings.repeat_times; i < 4; i++) queNameList[i] = 'learnedList'
        if (this.wordLearningRecord[nowIndex].reStartTimes >= 3) {
            this.control[this.control.queNameList[this.wordLearningRecord[nowIndex].repeatTimes]].splice(insertIndex, 0, nowIndex)
        } else {
            this.wordLearningRecord[nowIndex].reStartTimes += 1
            this.wordLearningRecord[nowIndex].repeatTimes = 0
            this.control['unLearnedList'].splice(insertIndex, 0, nowIndex)
        }
        this.control.nextIndex = this.getNextIndex(nowRepeatTimes)

        // 更改显示
        if (this.data.contentMode != 1) {
            this.setData({
                contentTimingStop: true,
                controlMode: 3,
                thisWordRepeatTime: this.wordLearningRecord[nowIndex].repeatTimes,
            })
            this.setData({
                contentMode: 1,
                isBtnActive: true,
            })
        } else if (this.data.wordMode != 0) {
            this.setData({
                wordTimingStop: true,
                controlMode: 3,
                thisWordRepeatTime: this.wordLearningRecord[nowIndex].repeatTimes,
            })
            this.setData({
                wordMode: 0,
                isBtnActive: true,
            })
        } else {
            this.showNextWord()
        }
    },

    changeToUnknown() {
        wx.showToast({
            title: '已标记为不认识',
            icon: 'none',
            duration: 1000,
        })
        let nowIndex = this.control.nowIndex
        // 现在repeatTimes是加过1后的，也在加过1后对应次数的队列里，在对应列队中找到该单词（索引）并删除加到未学习队列中/次数太多就只退一级
        // let queNameList = ['unLearnedList', 'repeatOnce', 'repeatTwice', 'repeatThree', 'learnedList']
        // for (let i = this.settings.repeat_times; i < 4; i++) queNameList[i] = 'learnedList'
        let nowRepeatTimes = this.wordLearningRecord[nowIndex].repeatTimes
        let wrongPlaceIndex = this.control[this.control.queNameList[nowRepeatTimes]].indexOf(nowIndex)
        let removedWord = -1
        if (wrongPlaceIndex != -1) removedWord = this.control[this.control.queNameList[nowRepeatTimes]].splice(wrongPlaceIndex, 1)
        if (removedWord != nowIndex && removedWord != -1) this.control[this.control.queNameList[nowRepeatTimes]].splice(wrongPlaceIndex, 0, removedWord)
        if (this.wordLearningRecord[nowIndex].reStartTimes >= 3) {
            this.wordLearningRecord[nowIndex].repeatTimes -= 1
            this.control[this.control.queNameList[this.wordLearningRecord[nowIndex].repeatTimes]].splice(insertIndex, 0, nowIndex)
        } else {
            this.wordLearningRecord[nowIndex].reStartTimes += 1
            this.wordLearningRecord[nowIndex].repeatTimes = 0
            this.control['unLearnedList'].splice(insertIndex, 0, nowIndex)
        }
        this.showNextWord()
    },

    toNextWord() {
        // 由于页面事件的第一个参数默认是event，与showNextWord默认参数有冲突，故用此函数间接调用
        this.setData({ isBtnActive: false })
        this.showNextWord()
    },

    getNextIndex(thisWordRepeatTime) {
        // 获取下一个单词的索引，单词顺序是 未学过的->学过一次的->(学过两次的->学过三次的->)未学过的

        // 先检查该轮到的队列的长度是不是超过listMinLength（如果是1的话，就会出现刚学完第一次又从学过一次的队列中取出来学第二次的情况），小于listMinLength则要暂时跳过该队列，循环repeat_times次
        // 最后一次不满足相当于所有队列都不满足，且没有break的话出来的i会再加一次1，相加一取余，相当于又回到第一次检测的队列（即没人救得了(length>listMinLength)就还是自己硬扛）
        let i = 0
        for (i; i < this.settings.repeat_times; i++) {
            if (this.control[this.control.queNameList[(thisWordRepeatTime + i + 1) % (this.settings.repeat_times)]].length > listMinLength) {
                break
            }
        }
        thisWordRepeatTime = (thisWordRepeatTime + i) % (this.settings.repeat_times)

        let nextIndex = -1
        if (thisWordRepeatTime == 0) {
            if (this.settings.repeat_times >= 2 && this.control.repeatOnce.length > 0) {
                nextIndex = this.control.repeatOnce.shift()
            } else if (this.settings.repeat_times >= 3 && this.control.repeatTwice.length > 0) {
                nextIndex = this.control.repeatTwice.shift()
            } else if (this.settings.repeat_times == 4 && this.control.repeatThree.length > 0) {
                nextIndex = this.control.repeatThree.shift()
            } else if (this.control.unLearnedList.length > 0) {
                nextIndex = this.control.unLearnedList.shift()
            }
        } else if (thisWordRepeatTime == 1) {
            if (this.settings.repeat_times >= 3 && this.control.repeatTwice.length > 0) {
                nextIndex = this.control.repeatTwice.shift()
            } else if (this.settings.repeat_times == 4 && this.control.repeatThree.length > 0) {
                nextIndex = this.control.repeatThree.shift()
            } else if (this.control.unLearnedList.length > 0) {
                nextIndex = this.control.unLearnedList.shift()
            } else if (this.settings.repeat_times >= 2 && this.control.repeatOnce.length > 0) {
                nextIndex = this.control.repeatOnce.shift()
            }
        } else if (thisWordRepeatTime == 2) {
            if (this.settings.repeat_times == 4 && this.control.repeatThree.length > 0) {
                nextIndex = this.control.repeatThree.shift()
            } else if (this.control.unLearnedList.length > 0) {
                nextIndex = this.control.unLearnedList.shift()
            } else if (this.settings.repeat_times >= 2 && this.control.repeatOnce.length > 0) {
                nextIndex = this.control.repeatOnce.shift()
            } else if (this.settings.repeat_times >= 3 && this.control.repeatTwice.length > 0) {
                nextIndex = this.control.repeatTwice.shift()
            }
        } else if (thisWordRepeatTime == 3) {
            if (this.control.unLearnedList.length > 0) {
                nextIndex = this.control.unLearnedList.shift()
            } else if (this.settings.repeat_times == 2 && this.control.repeatOnce.length > 0) {
                nextIndex = this.control.repeatOnce.shift()
            } else if (this.settings.repeat_times == 3 && this.control.repeatTwice.length > 0) {
                nextIndex = this.control.repeatTwice.shift()
            } else if (this.settings.repeat_times == 4 && this.control.repeatThree.length > 0) {
                nextIndex = this.control.repeatThree.shift()
            }
        }
        if (nextIndex == -1) console.log('GetNextIndex Err!')
        return nextIndex
    },

    showNextWord(nextIndex) {
        if (this.checkDone()) return
        // 获取单词索引后，根据该单词的学习记录设置显示内容
        if (!(nextIndex) && nextIndex != 0) nextIndex = this.control.nextIndex
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
            contentTimingStop: false,
            wordTimingStop: false,
            isInNotebook: this.wordDetailList[nextIndex].in_notebook ? true : false,
            isBtnActive: true,
        })
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
        let repeatTimes = this.wordLearningRecord[nowIndex].repeatTimes
        if (repeatTimes == this.settings.repeat_times) {
            wx.showToast({
                title: '该词已完成学习啦',
                icon: 'none',
                duration: 1000,
            })
            if (type == 'master') this.wordLearningRecord[nowIndex].master = true
            this.setData({ isBtnActive: true })
            return
        }
        let index = this.control[this.control.queNameList[repeatTimes]].indexOf(nowIndex)
        if (index != -1) this.control[this.control.queNameList[repeatTimes]].splice(index, 1)
        this.control.learnedList.push(this.control.nowIndex)
        this.wordLearningRecord[nowIndex].repeatTimes = this.settings.repeat_times
        if (type == 'master') this.wordLearningRecord[nowIndex].master = true
        this.control.nextIndex = this.getNextIndex(repeatTimes)
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
        if (this.updateLearned()) return
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

    updateLearned() {
        let learnedNum = this.control.learnedList.length
        this.setData({ learnedNum })
    },

    checkDone() {
        let learnedNum = this.control.learnedList.length
        if (learnedNum != this.data.learnedNum) this.setData({ learnedNum })
        if (learnedNum >= this.data.learnNum) {
            console.log('本组单词学习完毕啦~')
            this.setData({
                isBtnActive: false,
                learnDone: true,
            })
            this.sendLearningData()
            return true
        }
        return false
    },

    async sendLearningData() {
        wx.showLoading({
            title: '学习数据上传中...',
            mask: true,
        })
        console.log('sendLearningData')

        // 生成已完成的单词学习记录
        let now = new Date()
        now.setMilliseconds(0)
        now.setSeconds(0)
        now.setMinutes(0)
        now.setHours(0)
        let last_l = now.getTime()
        // let next_l = last_l + 86400000
        let learnedRecord = []
        let user_id = app.globalData.userInfo.user_id

        for (let i = 0; i < this.control.learnedList.length; i++) {
            learnedRecord.push({
                word_id: this.wordLearningRecord[this.control.learnedList[i]].word_id,
                user_id,
                // last_l,
                // next_l,
                // NOI: 1,
                // EF: "2.5",
                // next_n: 0,
                master: this.wordLearningRecord[this.control.learnedList[i]].master,
            })
        }

        // 生成正在学习的单词队列学习记录
        let learningRecord = []
        for (let j = 1; j < this.settings.repeat_times; j++) {
            let queName = this.control.queNameList[j]
            for (let k = 0; k < this.control[queName].length; k++) {
                learningRecord.push({
                    word_id: this.wordLearningRecord[this.control[queName][k]].word_id,
                    user_id,
                    learn_time: last_l,
                    repeatTimes: k,
                })
            }
        }
        console.log('learningRecord', learningRecord)

        let res = await wordApi.addLearningRecord({
            learnedRecord,
            learningRecord,
            user_id: app.globalData.userInfo.user_id
        })
        console.log('addLearningRecord res', res)
        app.globalData.updatedForIndex = true
        app.globalData.updatedForOverview = true
        wx.hideLoading()
        wx.disableAlertBeforeUnload()
        if (res.errorcode != rescontent.SUCCESS.errorcode) {
            wx.showToast({
                title: '很抱歉，数据上传出错',
                icon: 'none',
                duration: 1000,
            })
        }
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
            // isWordTimingInit: this.control.isWordTimingInit,
            // isContentTimingInit: this.control.isContentTimingInit,
            isWordTimingInit: false,
            isContentTimingInit: false,
            // 选择题显示答案后停留计时器
            isShowAllTimerSet: false,
            showAllTimer: -1,
            // 学习队列
            unLearnedList: undefined,
            repeatOnce: undefined,
            repeatTwice: undefined,
            repeatThree: undefined,
            learnedList: undefined,
            queNameList: [],
            modeList: undefined,
        }
        this.setData({
            learnedNum: 0,
            learnNum: 0,
            wordDetail: {},
            repeatTimes: 0,
            thisWordRepeatTime: 1,
            wordMode: 2,
            contentMode: 3,
            controlMode: 2,
            learnDone: false,
        })
        this.init()
        this.initLearningData()
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
        console.log('disableAlertBeforeUnload')
        wx.disableAlertBeforeUnload()
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})