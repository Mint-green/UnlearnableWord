// pages/overview/overview.js
import regeneratorRuntime, { async } from '../../lib/runtime/runtime';
const wordApi = require("../../utils/wordApi.js")
const userApi = require("../../utils/userApi.js")
const word_utils = require("../../utils/word_utils.js")
// const sm_5_js = require("../../lib/sm-5.js")
// const jStat = require("../../lib/jstat.min.js")
const format_time = require('../../utils/format_time.js')
import * as echarts from '../../components/ec-canvas/echarts'
// import * as echarts from '../../components/ec-canvas/echartsForBar'
const color = require("../../utils/color.js")

const app = getApp()

let chart = null
let isInit = false
let chartColor = {
    normalText: '#757575',
    textHighlight: '#ff831e',
    learnBar: '#ffc8cb',
    learnBarHighlight: '#fcaaae',
    reviewBar: '#87cafe',
    reviewBarHighlight: '#50b3ff',
    //     learnBar: '#87cafe',
    //     learnBarHighlight: '#50b3ff',
    //     reviewBar: '#ffc8cb',
    //     reviewBarHighlight: '#fcaaae',
}

function initChart(canvas, width, height, dpr) {
    chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr // new
    });
    canvas.setChart(chart);
    isInit = true
    return chart
}

Page({

    /**
     * 页面的初始数据
     */
    data: {
        learnConfig: {},
        learnPercentage: 0,
        learnReset: false,
        reviewConfig: {},
        reviewPercentage: 0,
        reviewReset: false,
        percentage: 100,
        resetCanvas: false,
        isStop: false,
        ec: { onInit: initChart },
        bkDetail: {},
        bkLearnData: {},
        allLearnData: {},
        notebookWord: [],
        todayLearnData: {},
        selectedDay: {},
        isChangingBook: false,
        allBkData: [],
        dailyTask: {},
    },
    chartdata: {},
    control: {
        checkTimer: -1,
        highlightIndex: -1,
        highlightIndexHide: false,
        skip: 0,
        hasMore: true,
        isLoading: false,
        dateTime: -1,
        pageHide: false,
        isLogin: false,
        loginTimer: -1,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.init()
    },

    async init() {
        wx.setNavigationBarTitle({
            title: '概览',
        })
        this.control.isLogin = app.globalData.isLogin
        this.createEmptylearnData()
        this.createEmptyDailySum()
        this.checkEchartInit()
        this.control.dateTime = format_time.getDayZeroTime()
        this.initDailyTask()

        if (!this.control.isLogin) {
            wx.showToast({
                title: '您还未登录哦~',
                icon: 'none',
                duration: 1500,
            })
            if (app.globalData.tryingLogin) {
                let _this = this
                this.control.loginTimer = setInterval(function () {
                    if (!app.globalData.tryingLogin) {
                        _this.control.pageHide = true
                        _this.onShow()
                        clearInterval(_this.control.loginTimer)
                    }
                }, 200)
            }
            return
        }
        this.getSingleWBData()
        this.initLearnData()
    },

    createEmptylearnData() {
        let bkDetail = {
            name: '',
            total: 0
        }
        let bkLearnData = {
            notLearn: 0,
            learn: 0,
            master: 0
        }
        let allLearnData = {
            learn: 0,
            master: 0,
        }
        let notebookWord = []
        let todayLearnData = {
            learn: 0,
            review: 0,
        }
        this.setData({
            bkDetail,
            bkLearnData,
            allLearnData,
            notebookWord,
            todayLearnData,
        })
    },

    async getSingleWBData() {
        let res = await wordApi.getSingleWBData({
            wd_bk_id: app.globalData.userInfo.l_book_id
        })
        this.setData({
            bkDetail: res.data,
        })
    },

    async initLearnData(needUpdateDailySum = false) {
        let t1 = new Date().getTime()
        // console.log('the same time')
        let promise1 = wordApi.getWBLearnData({
            user_id: app.globalData.userInfo.user_id,
            wd_bk_id: app.globalData.userInfo.l_book_id
        })
        let promise2 = wordApi.getAllLearnData({
            user_id: app.globalData.userInfo.user_id
        })
        let promise3 = wordApi.getNoteBookWord({
            user_id: app.globalData.userInfo.user_id,
            num: 10,
        })
        let promise4 = wordApi.getTodayLearnData({
            user_id: app.globalData.userInfo.user_id,
        })
        let taskList = [promise1, promise2, promise3, promise4]
        let resList = await Promise.all(taskList)
        let t2 = new Date().getTime()
        console.log('use', t2 - t1)
        console.log('resList', resList)

        this.setData({
            bkLearnData: resList[0].data,
            allLearnData: resList[1].data,
            notebookWord: resList[2].data,
            todayLearnData: resList[3].data,
        })
        this.updateDailyTaskPercentage()
        this.data.learnReset = false
        this.data.reviewReset = false
        this.setData({
            learnReset: true,
            reviewReset: true,
        })
        // console.log('reset')

        if (needUpdateDailySum) this.updateTodayDailySum()
    },

    initDailyTask() {
        this.initProgress('learn')
        this.initProgress('review')
    },

    updateDailyTaskPercentage() {
        if (this.control.isLogin) {
            // console.log('settings', app.globalData.userInfo.settings)
            if (app.globalData.userInfo.settings.daily_task) {
                let dailyTask = {}
                dailyTask.dailyTask = true
                let groupSize = app.globalData.userInfo.settings.group_size
                let dailyLearn = app.globalData.userInfo.settings.daily_learn
                let dailyReview = app.globalData.userInfo.settings.daily_review
                if (groupSize === undefined) groupSize = 20
                if (dailyLearn === undefined) dailyLearn = 1
                if (dailyReview === undefined) dailyReview = 1
                dailyTask.dailyLearn = dailyLearn * groupSize
                dailyTask.dailyReview = dailyReview * groupSize
                let learnPercentage = this.data.todayLearnData.learn / dailyTask.dailyLearn * 100
                let reviewPercentage = this.data.todayLearnData.review / dailyTask.dailyReview * 100
                if (learnPercentage > 100) learnPercentage = 100
                if (reviewPercentage > 100) reviewPercentage = 100
                // console.log('dailyTask', dailyTask)
                // console.log('learnPercentage', learnPercentage)
                // console.log('reviewPercentage', reviewPercentage)
                this.setData({
                    dailyTask,
                    learnPercentage,
                    reviewPercentage,
                })
                return
            }
        }
        this.setData({
            dailyTask: { dailyLearn: 0, dailyReview: 0 },
            learnPercentage: 0,
            reviewPercentage: 0,
        })
    },

    initProgress(type = 'learn') {
        // let colorStart = undefined
        let colorEnd = undefined
        if (type == 'learn') {
            // colorStart = '#ffffff'
            colorEnd = chartColor.learnBar
            // colorEnd = chartColor.reviewBar
        } else if (type == 'review') {
            // colorStart = '#ffffff'
            colorEnd = chartColor.reviewBar
            // colorEnd = chartColor.learnBar
        }
        let config = {
            canvasSize: {
                width: 200,
                height: 200
            },
            percent: 100,
            barStyle: [
                { width: 16, fillStyle: '#f6f6f6' },
                {
                    width: 16,
                    animate: true,
                    // fillStyle: [ // 这个渐变是背景的渐变，不太一样。。。
                    //     { position: 0, color: colorStart },
                    //     { position: 1, color: colorEnd }
                    // ],
                    fillStyle: colorEnd,
                    lineCap: 'round'
                }],
            totalTime: 1000,
        }
        if (type == 'learn') {
            this.setData({
                learnConfig: config,
                learnReset: false,
                // learnPercentage: 20,
            })
        } else if (type == 'review') {
            this.setData({
                reviewConfig: config,
                reviewReset: false,
                // reviewPercentage: 20,
            })
        }
    },

    toWordDetail(e) {
        let word_id = e.currentTarget.dataset.word_id
        wx.navigateTo({
            url: `../word_detail/word_detail?word_id=${word_id}`,
        })
    },

    async showBookList() {
        if (!this.checkLogin()) return
        this.setData({
            isChangingBook: true,
        })
        let allBkData = this.data.allBkData
        if (!allBkData || allBkData.length == 0) allBkData = (await wordApi.getAllWBData()).data
        this.setData({
            allBkData: allBkData,
        })
    },

    async changeWordBook(e) {
        let index = e.currentTarget.dataset.index
        let bkInfo = this.data.allBkData[index]
        if (bkInfo.wd_bk_id != app.globalData.userInfo.l_book_id) {
            let res = await userApi.changeWordBook({
                user_id: app.globalData.userInfo.user_id,
                wd_bk_id: bkInfo.wd_bk_id,
            })
            if (res.data) {
                let wbLearnDataRes = await wordApi.getWBLearnData({
                    user_id: app.globalData.userInfo.user_id,
                    wd_bk_id: bkInfo.wd_bk_id
                })
                app.globalData.userInfo.l_book_id = bkInfo.wd_bk_id
                app.globalData.updatedForIndex = true
                this.setData({
                    bkDetail: {
                        color: bkInfo.color,
                        coverType: bkInfo.coverType,
                        description: bkInfo.description,
                        name: bkInfo.name,
                        total: bkInfo.total,
                    },
                    bkLearnData: wbLearnDataRes.data,
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

    getWordList(e) {
        if (!this.checkLogin()) return
        let type = e.currentTarget.dataset.type
        wx.navigateTo({
            url: `../word_list/word_list?type=${type}`,
        })
    },

    endChange() {
        this.setData({
            isChangingBook: false,
        })
    },

    // 为拥有进入过渡动画用，实际可不做处理
    onEnter() { },

    // 历史每日学习统计图表所用函数
    // ---------------------------------------------------------------------------------

    // 获取统计数据，初始配置、图表左侧(数轴反转了)触底时调用
    async getDailySum() {
        if (!this.control.isLogin) return
        if (!this.control.hasMore) return
        if (this.control.isLoading) return
        this.control.isLoading = true
        let res = await wordApi.getDailySum({
            user_id: app.globalData.userInfo.user_id,
            skip: this.control.skip
        })
        // console.log('getDailySum', res)
        let dailySumList = res.data
        this.control.hasMore = (dailySumList.length < 10) ? false : true
        if (dailySumList.length == 0) return
        // console.log('dailySumList length', dailySumList.length)
        let chartdataLengthBefore = this.chartdata.time.length
        let chartdata = this.control.skip == 0 ? {
            time: [],
            total: [],
            learn: [],
            review: [],
        } : this.chartdata

        let lastTime = format_time.getDayZeroTime() + 86400000
        if (this.control.skip > 0) lastTime = format_time.getDayZeroTime('2021-' + this.chartdata.time[this.chartdata.time.length - 1])
        // console.log('lastTime', lastTime)
        // console.log(new Date(lastTime))
        for (let i = 0; i < dailySumList.length; i++) {
            if (dailySumList[i].date < lastTime - 86400000) {
                while (dailySumList[i].date < lastTime - 86400000) {
                    lastTime = lastTime - 86400000
                    let time1 = format_time.formatDate(lastTime)
                    time1 = time1.substring(5)
                    chartdata.time.push(time1)
                    chartdata.learn.push(0)
                    chartdata.review.push(0)
                    chartdata.total.push(0)
                }
            }
            let time = format_time.formatDate(dailySumList[i].date)
            time = time.substring(5)
            chartdata.time.push(time)
            chartdata.learn.push(dailySumList[i].learn)
            chartdata.review.push(dailySumList[i].review)
            chartdata.total.push(dailySumList[i].learn + dailySumList[i].review)
            lastTime = dailySumList[i].date
        }
        this.chartdata = JSON.parse(JSON.stringify(chartdata))
        this.control.skip += dailySumList.length

        if (!isInit) return
        // 设置显示内容
        let highlightIndex = this.control.highlightIndex
        if (highlightIndex == -1) {
            highlightIndex = 0
            this.control.highlightIndex = 0
            chart.dispatchAction({
                type: 'highlight',
                dataIndex: highlightIndex
            })
        }
        if (this.control.skip == dailySumList.length) {
            this.setData({
                selectedDay: {
                    time: chartdata.time[0],
                    learn: chartdata.learn[0],
                    review: chartdata.review[0],
                }
            })
        }
        let highlightxAxisItem = {
            value: chartdata.time[highlightIndex],
            textStyle: {
                color: chartColor.textHighlight
            }
        }
        chartdata.time[highlightIndex] = highlightxAxisItem
        let chartOption = chart.getOption()
        let series = chartOption.series
        series[0].data = this.chartdata.total
        // series[1].data = this.chartdata.learn
        // series[2].data = this.chartdata.review
        series[1].data = this.chartdata.review
        series[2].data = this.chartdata.learn
        let startValue = 0
        let endValue = 0
        let dataZoom = chartOption.dataZoom
        // 设置新范围为当前触底数据范围往后移一格
        if (this.control.skip == dailySumList.length) {
            startValue = 0
            endValue = 6
        } else {
            startValue = chartdataLengthBefore - 1 + 1 - 6
            endValue = chartdataLengthBefore - 1 + 1
        }
        if (!this.control.highlightIndexHide & startValue > this.control.highlightIndex) this.control.highlightIndexHide = true
        dataZoom[0].startValue = startValue
        dataZoom[0].endValue = endValue
        // console.log('startValue', startValue)
        // console.log('endValue', endValue)
        // console.log(chartOption)
        chart.setOption({
            xAxis: {
                data: chartdata.time
            },
            series: series,
            dataZoom: dataZoom,
        })
        this.control.isLoading = false
    },

    // 生成最近一周的空数据（onLoad时调用），用于在未获得真实数据前“占位”
    createEmptyDailySum() {
        let time = new Date().getTime()
        // let date = format_time.formatDate(time)
        // console.log(date.substring(5))
        let chartdata = {
            time: [],
            total: [],
            learn: [],
            review: [],
        }
        for (let i = 0; i < 7; i++) {
            let date = format_time.formatDate(time)
            date = date.substring(5)
            // date = date.replace('-', '.')
            // let learn = Math.floor(Math.random() * 5) * 10
            // let review = Math.floor(Math.random() * 30) * 10
            // let total = learn + review
            chartdata.time.push(date)
            chartdata.learn.push(0)
            chartdata.review.push(0)
            chartdata.total.push(0)
            time -= 86400000
        }
        this.chartdata = chartdata
    },

    // 应用空数据
    setEmptyDailySum() {
        let chartOption = chart.getOption()
        let series = chartOption.series
        series[0].data = this.chartdata.total
        series[1].data = this.chartdata.review
        series[2].data = this.chartdata.learn
        this.control.highlightIndex = -1
        this.control.highlightIndexHide = false
        chart.setOption({
            xAxis: {
                data: this.chartdata.time
            },
            series: series,
        })
        this.setData({
            selectedDay: {
                time: this.chartdata.time[0],
                learn: this.chartdata.learn[0],
                review: this.chartdata.review[0],
            }
        })
    },

    // 更新当日学习数据到图表中
    updateTodayDailySum() {
        let todayLearnData = this.data.todayLearnData
        let chartOption
        if (isInit) {
            chartOption = chart.getOption()
            let series = chartOption.series
            this.chartdata.total[0] = todayLearnData.learn + todayLearnData.review
            this.chartdata.review[0] = todayLearnData.review
            this.chartdata.learn[0] = todayLearnData.learn
            series[0].data[0] = todayLearnData.learn + todayLearnData.review
            series[1].data[0] = todayLearnData.review
            series[2].data[0] = todayLearnData.learn
            let dataZoom = chartOption.dataZoom
            chart.setOption({
                series: series,
                dataZoom: dataZoom,
            })
            let dateTime = new Date()
            let time = format_time.formatDate(dateTime)
            time = time.substring(5)
            if (this.data.selectedDay.time == time) {
                this.setData({
                    selectedDay: {
                        time: this.chartdata.time[0],
                        learn: this.chartdata.learn[0],
                        review: this.chartdata.review[0],
                    }
                })
            }
        }
    },

    // 拖动位置时触发，监测到左侧触底则进行数据获取、隐藏的高亮柱形重新显现则重新将之高亮
    dataZoomEvent(e) {
        // console.log('dataZoom', e)
        // console.log('highlightIndexHide', this.control.highlightIndexHide)
        // console.log('percentage', (this.control.highlightIndex + 1) / this.chartdata.time.length)
        if (e.batch[0].end > 99) {
            if (!this.control.hasMore) {
                wx.showToast({
                    title: '已经没有再早的数据了噢',
                    icon: 'none',
                    duration: 1000,
                })
                return
            }
            this.getDailySum()
        } else if (!this.control.highlightIndexHide) {
            let nowPercentage = ((this.control.highlightIndex + 1) / this.chartdata.time.length) * 100
            let startBigger = (e.batch[0].start > nowPercentage) ? true : false
            let endSmaller = (e.batch[0].end < nowPercentage) ? true : false
            if (startBigger || endSmaller) {
                this.control.highlightIndexHide = true
            }
        } else if (this.control.highlightIndexHide) {
            let nowPercentage = ((this.control.highlightIndex + 1) / this.chartdata.time.length) * 100
            let startSmaller = (e.batch[0].start < nowPercentage) ? true : false
            let endBigger = (e.batch[0].end > nowPercentage) ? true : false
            if (startSmaller && endBigger) {
                // 对应设置高亮与否
                let _this = this
                setTimeout(function () {
                    chart.dispatchAction({
                        type: 'highlight',
                        dataIndex: _this.control.highlightIndex
                    })
                    let downPlayIndex = []
                    for (let i = 0; i < _this.chartdata.time.length; i++) {
                        if (i != _this.control.highlightIndex) downPlayIndex.push(i)
                    }
                    chart.dispatchAction({
                        type: 'downplay',
                        dataIndex: downPlayIndex
                    })
                    _this.control.highlightIndexHide = false
                }, 100)
            }
        }
    },

    // 检测图表一整列范围内被点击则触发对应列柱形和标签高亮
    dataColumnClicked(e) {
        let pointInPixel = [e.offsetX, e.offsetY]
        if (chart.containPixel('grid', pointInPixel)) {
            let xIndex = chart.convertFromPixel({ seriesIndex: 0 }, [e.offsetX, e.offsetY])[0]
            // console.log(xIndex)
            xIndex = Math.abs(xIndex)
            this.control.highlightIndex = xIndex

            let chartxAxis = chart.getOption().xAxis
            // console.log(chart.getOption().dataZoom)
            let dataZoom = chart.getOption().dataZoom
            let xData = JSON.parse(JSON.stringify(this.chartdata.time)) // 深复制，防止对time数组的更改影响数据源
            let xAxisItem = {
                value: this.chartdata.time[xIndex],
                textStyle: {
                    color: chartColor.textHighlight
                }
            }
            xData.splice(xIndex, 1, xAxisItem)
            chartxAxis[0].data = xData
            chart.setOption({
                xAxis: chartxAxis,
                dataZoom: dataZoom
            })
            // 更新显示内容，显示点击日期当天的数据
            this.setData({
                selectedDay: {
                    time: this.chartdata.time[xIndex],
                    learn: this.chartdata.learn[xIndex],
                    review: this.chartdata.review[xIndex],
                }
            })
            // console.log('dataColumnClicked get option', chart.getOption())
            // 对应设置高亮与否
            chart.dispatchAction({
                type: 'highlight',
                dataIndex: xIndex
            })
            let downPlayIndex = []
            for (let i = 0; i < this.chartdata.time.length; i++) {
                if (i != xIndex) downPlayIndex.push(i)
            }
            chart.dispatchAction({
                type: 'downplay',
                dataIndex: downPlayIndex
            })
            this.control.highlightIndexHide = false
        }
    },

    // 图例标签被点击则触发，更新总和数据、高亮范围(由图例切换复现的所有图形会自动高亮，要取消)
    legendChange(e) {
        // console.log('legendChange', e)
        if (!isInit) return
        let totalArr = undefined
        let bothUnselected = false
        let changeName = ''
        if (e.selected['学习'] && e.selected['复习']) {
            totalArr = this.chartdata.total
        } else if (e.selected['学习'] && !e.selected['复习']) {
            totalArr = this.chartdata.learn
        } else if (!e.selected['学习'] && e.selected['复习']) {
            totalArr = this.chartdata.review
        } else {
            let name = e.name
            changeName = name == '学习' ? '复习' : '学习'
            bothUnselected = true
        }
        if (bothUnselected) {
            chart.dispatchAction({
                type: 'legendToggleSelect',
                name: changeName
            })
            // legendToggleSelect会触发legendchange事件，故这里退出以下设置部分可以不用运行以节省资源
            return
        }
        let series = chart.getOption().series
        let dataZoom = chart.getOption().dataZoom
        series[0].data = totalArr
        chart.setOption({
            // dataset: {
            //     source: {
            //         total: totalArr
            //     }
            // }
            series: series,
            dataZoom: dataZoom
        })
        let _this = this
        // 由于由legend调整显示的图形默认高亮，且有动画延时，需在动画开始之后（柱子出现后）再设置取消高亮
        // 故需加到“任务队列”中，即使Timeout为0也可，执行完该轮Event Loop再设置高亮与否，即可成功
        setTimeout(function () {
            let downPlayIndex = []
            for (let i = 0; i < _this.chartdata.time.length; i++) {
                if (i != _this.control.highlightIndex) downPlayIndex.push(i)
            }
            if (_this.control.highlightIndex != -1) {
                chart.dispatchAction({
                    type: 'highlight',
                    dataIndex: _this.control.highlightIndex
                })
            }
            chart.dispatchAction({
                type: 'downplay',
                dataIndex: downPlayIndex,
            })
        }, 0)
    },

    // 检测图表是否初始化完毕，是则传入基础配置，由于宽高等数据单位为px
    // 需要转换成rpx以自适应屏幕大小，故参数传入均在此处给出
    async checkEchartInit() {
        let _this = this
        this.control.checkTimer = setInterval(function () {
            // console.log('interval time out')
            if (!isInit) {
                // console.log('not init')
            } else {
                clearInterval(_this.control.checkTimer)
                // console.log('windowWidth', wx.getSystemInfoSync().windowWidth)
                // 750:needwidth(rpx) = realwidth:needwidth(px)
                // needwidth(px) = realwidth*needwidth(rpx)/750
                let rectRatio = wx.getSystemInfoSync().windowWidth / 750
                // console.log('time out print', chart)

                let option = {
                    legend: {
                        top: 10 * 2 * rectRatio,
                        right: 20 * 2 * rectRatio,
                        data: [
                            {
                                name: '学习',
                                icon: 'circle',
                            },
                            {
                                name: '复习',
                                icon: 'circle',
                            },
                        ],
                        itemWidth: 12 * 2 * rectRatio,
                        itemHeight: 12 * 2 * rectRatio,
                        textStyle: {
                            fontSize: 12 * 2 * rectRatio,
                            color: chartColor.normalText,
                            fontWeight: 600,
                        },
                        borderRadius: 6 * 2 * rectRatio,
                    },
                    grid: {
                        left: '3%',
                        right: '4%',
                        bottom: '3%',
                        containLabel: true
                    },
                    xAxis: {
                        type: 'category',
                        inverse: true,
                        axisTick: {
                            alignWithLabel: true
                        },
                        axisLabel: {
                            fontSize: 10 * 2 * rectRatio,
                            fontWeight: 600,
                            color: chartColor.normalText,
                        },
                        data: JSON.parse(JSON.stringify(_this.chartdata.time)),
                    },
                    yAxis: {
                        axisLabel: {
                            fontSize: 10 * 2 * rectRatio,
                            fontWeight: 600,
                            color: chartColor.normalText,
                        }
                    },
                    dataZoom: [
                        {
                            id: 'dataZoomX',
                            type: 'inside',
                            filterMode: 'empty',
                            startValue: 0,
                            endValue: 6,
                            rangeMode: ['value', 'value'],
                            // zoomLock: true,
                            minValueSpan: 6,
                            maxValueSpan: 6,
                            zoomOnMouseWheel: false,
                        },
                    ],
                    series: [
                        {
                            type: 'bar',
                            label: {
                                show: true,
                                position: 'top',
                                fontWeight: 600,
                                color: chartColor.normalText,
                            },
                            barWidth: 10 * 2 * rectRatio,
                            emphasis: {
                                label: {
                                    color: chartColor.textHighlight
                                }
                            },
                            itemStyle: {
                                color: 'rgba(255, 255, 255, 0)',
                            },
                            data: JSON.parse(JSON.stringify(_this.chartdata.total)),
                        },
                        {
                            type: 'bar',
                            // name: '学习',
                            name: '复习',
                            barGap: "-100%", // 这里设置后两个的堆积柱形与前一个(总)的柱形位置重合
                            barWidth: 10 * 2 * rectRatio,
                            emphasis: {
                                itemStyle: {
                                    // color: chartColor.learnBarHighlight,
                                    color: chartColor.reviewBarHighlight,
                                },
                            },
                            stack: 'data',
                            itemStyle: {
                                // color: chartColor.learnBar,
                                color: chartColor.reviewBar,
                            },
                            // data: JSON.parse(JSON.stringify(_this.chartdata.learn)),
                            data: JSON.parse(JSON.stringify(_this.chartdata.review)),
                        },
                        {
                            type: 'bar',
                            // name: '复习',
                            name: '学习',
                            barGap: "-100%", // 这里设置后两个的堆积柱形与前一个(总)的柱形位置重合
                            barWidth: 10 * 2 * rectRatio,
                            emphasis: {
                                itemStyle: {
                                    // color: chartColor.reviewBarHighlight,
                                    color: chartColor.learnBarHighlight,
                                }
                            },
                            stack: 'data',
                            itemStyle: {
                                // color: chartColor.reviewBar,
                                color: chartColor.learnBar,
                            },
                            // data: JSON.parse(JSON.stringify(_this.chartdata.review)),
                            data: JSON.parse(JSON.stringify(_this.chartdata.learn)),
                        },
                    ],
                }
                chart.setOption(option)
                // console.log('init print', chart)
                chart.on('legendselectchanged', '', _this.legendChange)
                chart.on('dataZoom', '', _this.dataZoomEvent)
                chart.getZr().on('click', _this.dataColumnClicked)

                _this.getDailySum()
                // 默认高亮最右边这一项（第一项）
                let chartxAxis = chart.getOption().xAxis
                let xData = JSON.parse(JSON.stringify(_this.chartdata.time))
                let xAxisItem = {
                    value: _this.chartdata.time[0],
                    textStyle: {
                        color: chartColor.textHighlight
                    }
                }
                xData[0] = xAxisItem
                chartxAxis[0].data = xData
                chart.setOption({
                    xAxis: chartxAxis
                })
                chart.dispatchAction({
                    type: 'highlight',
                    dataIndex: 0
                })
                // console.log(chart.getOption())
            }
        }, 100)
    },
    // ---------------------------------------------------------------------------------

    async testAddLearningRecord() {
        // let wordDetailList = wx.getStorageSync('wordDetailList')
        let learnDataRes = await wordApi.getLearningData({
            user_id: app.globalData.userInfo.user_id,
            // wd_bk_id: app.globalData.userInfo.l_book_id,
            wd_bk_id: 5,
            groupSize: 20,
            sample: false,
            // user_id: 2,
            // wd_bk_id: 2,
            // groupSize: 20,
        })
        // let learnDataRes = await wordApi.getReviewData({
        //     user_id: app.globalData.userInfo.user_id,
        //     wd_bk_id: app.globalData.userInfo.l_book_id,
        //     groupSize: 10,
        //     sample: false,
        // })

        let wordDetailList = learnDataRes.data
        let wordLearningRecord = []
        // console.log(wordDetailList)
        let now = new Date()
        now.setMilliseconds(0)
        now.setSeconds(0)
        now.setMinutes(0)
        now.setHours(0)
        let last_l = now.getTime()
        let next_l = last_l + 86400000
        // let next_l = now.getTime()
        // let last_l = next_l - 86400000

        for (let i = 0; i < wordDetailList.length; i++) {
            // let record = wordDetailList[i].record
            // record.q = 3 + Math.floor(Math.random() * 3)
            // wordLearningRecord.push(record)
            wordLearningRecord.push({
                word_id: wordDetailList[i].word_id,
                last_l,
                next_l,
                NOI: 1,
                EF: "2.5",
                next_n: 0,
                // master: false,
                master: (Math.random() * 6 < 5) ? false : true
            })
        }

        let res = await wordApi.addLearningRecord({
            learnedRecord: wordLearningRecord,
            user_id: app.globalData.userInfo.user_id
        })
        console.log(res)
        return

        // wordLearningRecord[8].q = 2
        // wordLearningRecord[9].q = 1
        console.log('upload wordLearningRecord', wordLearningRecord)

        // let of_matrix = {
        //     '1.3': [5],
        //     '1.4': [5],
        //     '1.5': [5],
        //     '1.6': [5],
        //     '1.7': [5],
        //     '1.8': [5],
        //     '1.9': [5],
        //     '2.0': [5],
        //     '2.1': [5],
        //     '2.2': [5],
        //     '2.3': [5],
        //     '2.4': [5],
        //     '2.5': [5],
        //     '2.6': [5],
        //     '2.7': [5],
        //     '2.8': [5],
        // }
        // let resList = []
        // for (let j = 0; j < wordLearningRecord.length; j++) {
        //     let result = sm_5_js.sm_5(of_matrix, wordLearningRecord[j])
        //     let record = result.wd_learning_record
        //     of_matrix = result.OF
        //     resList.push(record)
        // }
        // console.log('resList', resList)
        // console.log('of_matrix', of_matrix)

        let res1 = await wordApi.updateLearningRecord({
            wordLearningRecord: wordLearningRecord,
            user_id: app.globalData.userInfo.user_id
        })
        console.log(res1)
    },

    async getBasicLearningData() {
        let res = await wordApi.getBasicLearningData()
        console.log('getBasicLearningData result', res)
        this.setData({
            needToLearn: res.data.needToLearn,
            needToReview: res.data.needToReview,
        })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    checkLogin() {
        if (this.control.isLogin) {
            return true
        } else {
            wx.showToast({
                title: '登录后才可以查看哦~',
                icon: 'none',
                duration: 1500,
            })
            return false
        }
    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        if (this.control.pageHide) {
            if (this.control.isLogin != app.globalData.isLogin) {
                this.control.isLogin = app.globalData.isLogin
                if (app.globalData.isLogin) {    // 若登录状态变为已登录则获取数据并更新相应图表
                    this.getDailySum()
                    this.getSingleWBData()
                    this.initLearnData()
                } else {    // 若登录状态变为使用空数据替代
                    this.control.skip = 0
                    this.createEmptylearnData()
                    this.createEmptyDailySum()
                    this.setEmptyDailySum()
                }
                this.updateDailyTaskPercentage()
                app.globalData.updatedForOverview = false
            }

            if (app.globalData.updatedForOverview) {
                this.initLearnData(true)
                if (app.globalData.userInfo.settings.daily_task) {    //若启用每日任务，则进行更新
                    this.control.pageHide = false
                    app.globalData.updatedForOverview = false
                    // initLearnData里已经更新过dailyTask数据且刷新图表，为防止重复刷新，就直接返回
                    return
                } else {    //若未启用每日任务，则使用注入空数据
                    let dailyTask = {}
                    dailyTask.dailyTask = false
                    dailyTask.dailyLearn = 0
                    dailyTask.dailyReview = 0
                    this.setData({
                        dailyTask,
                        learnPercentage: 0,
                        reviewPercentage: 0,
                    })
                }
                app.globalData.updatedForOverview = false
            }
            // 重置进度条
            this.data.learnReset = false
            this.data.reviewReset = false
            console.log('reset')
            this.setData({
                learnReset: true,
                reviewReset: true,
            })

            this.control.pageHide = false
        }
    },

    // 调试用
    getControl(e) {
        console.log('control', this.control)
        console.log('option', chart.getOption())
        console.log('chartdata', this.chartdata)
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