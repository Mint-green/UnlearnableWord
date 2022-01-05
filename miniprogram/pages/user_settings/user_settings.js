// pages/user_settings/user_settings.js
import regeneratorRuntime, { async } from '../../lib/runtime/runtime';
const wordApi = require("../../utils/wordApi.js")
const userApi = require("../../utils/userApi.js")

const app = getApp()
let timingRange = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, '自定义']
let groupSizeRange = [10, 15, 20, 25, 30, 35, 40, '自定义']
let voiceTypeRange = ['英式', '美式']
let lRepeatRange = [1, 2, 3, 4]
let rRepeatRange = [1, 2, 3]
let modeNameRange = ['看词选义', '看词识义', '看义识词']
let modeRange = ['chooseTrans', 'recallTrans', 'recallWord']
let taskLoadRange = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, '自定义']
let placeholderText = {
    timing_duration: '请输入想要延时的毫秒数如 1500',
    group_size: '请输入每组单词数量如 20',
    daily_learn: '请输入目标学习量为几组单词如 2',
    daily_review: '请输入目标复习量为几组单词如 2',
}

Page({

    /**
     * 页面的初始数据
     */
    data: {
        timingRange: timingRange,
        groupSizeRange: groupSizeRange,
        voiceTypeRange: voiceTypeRange,
        lRepeatRange: lRepeatRange,
        rRepeatRange: rRepeatRange,
        modeNameRange: modeNameRange,
        taskLoadRange: taskLoadRange,
        switchSettings: {},
        picker: {},
        customTypeValue: {},
        isCustomize: false,
        focus: true,
        inputValue: '',
    },
    settings: {},
    isChange: false,
    customObj: {},

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        wx.setNavigationBarTitle({
            title: '设置',
        })
        this.init()
    },

    init() {
        let settings = JSON.parse(JSON.stringify(app.globalData.userInfo.settings))
        this.settings = settings
        let wx_user = app.globalData.userInfo.wx_user
        let switchSettings = {}
        let picker = {}
        let customTypeValue = {}
        if (wx_user) {
            switchSettings.auto_update_avatar = (settings.auto_update_avatar === undefined) ? true : settings.auto_update_avatar
            switchSettings.auto_update_username = (settings.auto_update_username === undefined) ? true : settings.auto_update_username
        }

        switchSettings.timing = (settings.timing === undefined) ? true : settings.timing
        switchSettings.autoplay = (settings.autoplay === undefined) ? true : settings.autoplay
        switchSettings.daily_task = (settings.daily_task === undefined) ? false : settings.daily_task

        picker.timing_duration = (settings.timing_duration === undefined) ? 2 : ((timingRange.indexOf(settings.timing_duration) == -1) ? 10 : (timingRange.indexOf(settings.timing_duration)))
        picker.group_size = (settings.group_size === undefined) ? 2 : ((groupSizeRange.indexOf(settings.group_size) == -1) ? 7 : (groupSizeRange.indexOf(settings.group_size)))
        picker.voice_type = (settings.voice_type === undefined) ? 1 : (settings.voice_type - 1)

        picker.learn_repeat_t = (settings.learn_repeat_t === undefined) ? 2 : lRepeatRange.indexOf(settings.learn_repeat_t)
        picker.learn_first_m = (settings.learn_first_m === undefined) ? 0 : modeRange.indexOf(settings.learn_first_m)
        picker.learn_second_m = (settings.learn_second_m === undefined) ? 1 : modeRange.indexOf(settings.learn_second_m)
        picker.learn_third_m = (settings.learn_third_m === undefined) ? 2 : modeRange.indexOf(settings.learn_third_m)
        picker.learn_fourth_m = (settings.learn_fourth_m === undefined) ? 1 : modeRange.indexOf(settings.learn_fourth_m)

        picker.review_repeat_t = (settings.review_repeat_t === undefined) ? 0 : rRepeatRange.indexOf(settings.review_repeat_t)
        picker.review_first_m = (settings.review_first_m === undefined) ? 1 : modeRange.indexOf(settings.review_first_m)
        picker.review_second_m = (settings.review_second_m === undefined) ? 2 : modeRange.indexOf(settings.review_second_m)
        picker.review_third_m = (settings.review_third_m === undefined) ? 1 : modeRange.indexOf(settings.review_third_m)

        picker.daily_learn = (settings.daily_learn === undefined) ? 0 : ((taskLoadRange.indexOf(settings.daily_learn) == -1) ? 10 : (taskLoadRange.indexOf(settings.daily_learn)))
        picker.daily_review = (settings.daily_review === undefined) ? 0 : ((taskLoadRange.indexOf(settings.daily_review) == -1) ? 10 : (taskLoadRange.indexOf(settings.daily_review)))

        customTypeValue.timing_duration = (picker.timing_duration != 10) ? timingRange[picker.timing_duration] : settings.timing_duration
        customTypeValue.group_size = (picker.group_size != 7) ? groupSizeRange[picker.group_size] : settings.group_size
        customTypeValue.daily_learn = (picker.daily_learn != 10) ? taskLoadRange[picker.daily_learn] : settings.daily_learn
        customTypeValue.daily_review = (picker.daily_review != 10) ? taskLoadRange[picker.daily_review] : settings.daily_review

        this.setData({
            wx_user,
            switchSettings,
            picker,
            customTypeValue,
        })
    },

    async switchChange(e) {
        // console.log(e)
        let value = e.detail.value
        let type = e.currentTarget.dataset.type
        if (type == 'timing') {
            this.setData({
                'switchSettings.timing': value,
            })
            if (this.settings.timing != value) {
                this.settings.timing = value
                this.isChange = true
            }
        } else if (type == 'autoplay') {
            this.setData({
                'switchSettings.autoplay': value,
            })
            if (this.settings.autoplay != value) {
                this.settings.autoplay = value
                this.isChange = true
            }
        } else if (type == 'daily_task') {
            this.setData({
                'switchSettings.daily_task': value,
            })
            if (this.settings.daily_task != value) {
                this.settings.daily_task = value
                if (value == true) {
                    if (!this.settings.daily_learn) this.settings.daily_learn = 1
                    if (!this.settings.daily_review) this.settings.daily_review = 1
                }
                this.isChange = true
            }
        } else if (type == 'auto_update_avatar') {
            this.setData({
                'switchSettings.auto_update_avatar': value,
            })
            if (this.settings.auto_update_avatar != value) {
                this.settings.auto_update_avatar = value
                this.isChange = true
            }
            if (value == false) {
                let prefix = app.globalData.userInfo.avatar_pic.substring(0, 6)
                // console.log('avatar_pic', app.globalData.userInfo.avatar_pic)
                console.log(prefix)
                if (prefix != 'cloud:') {
                    this.uploadAndModify(app.globalData.userInfo.avatar_pic)
                }
            }
        } else if (type == 'auto_update_username') {
            this.setData({
                'switchSettings.auto_update_username': value,
            })
            if (this.settings.auto_update_username != value) {
                this.settings.auto_update_username = value
                this.isChange = true
            }
        }
    },

    rangeDict: {
        timing_duration: 'timingRange',
        group_size: 'groupSizeRange',
        voice_type: 'voiceTypeRange',
        // 学习相关
        learn_repeat_t: 'lRepeatRange',
        learn_first_m: 'modeNameRange',
        learn_second_m: 'modeNameRange',
        learn_third_m: 'modeNameRange',
        learn_fourth_m: 'modeNameRange',
        // 复习相关
        review_repeat_t: 'rRepeatRange',
        review_first_m: 'modeNameRange',
        review_second_m: 'modeNameRange',
        review_third_m: 'modeNameRange',
        // 每日任务相关
        daily_learn: 'taskLoadRange',
        daily_review: 'taskLoadRange',
    },

    pickerChange(e) {
        console.log('event', e)
        let value = parseInt(e.detail.value)
        let type = e.currentTarget.dataset.type
        // console.log('this.rangeDict[type]', this.rangeDict[type])
        let rangeListName = this.rangeDict[type]
        let newValue = this.data[rangeListName][value]
        if (rangeListName == 'modeNameRange') newValue = modeRange[value]
        if (type == 'voice_type') {
            newValue = value + 1
        }
        if (this.data.picker[type] != value && this.settings != newValue) {
            this.settings[type] = newValue
            this.isChange = true
            let picker = this.data.picker
            picker[type] = value
            this.setData({
                picker
            })
        }
    },

    customPickerChange(e) {
        console.log('event', e)
        let value = parseInt(e.detail.value)
        let type = e.currentTarget.dataset.type
        let rangeListName = this.rangeDict[type]
        let newValue = this.data[rangeListName][value]
        if (newValue == '自定义') {  // 调起输入框供用户输入
            this.customObj = {
                value,
                type
            }
            this.setData({
                isCustomize: true,
                placeholder: placeholderText[type],
                inputValue: '',
            })

            let _this = this
            setTimeout(function () {
                _this.setData({
                    focus: true
                })
            }, 500)
            return
        }
        if (this.data.picker[type] != value && this.settings != newValue) {
            this.settings[type] = newValue
            this.isChange = true
            let picker = this.data.picker
            picker[type] = value
            let customTypeValue = this.data.customTypeValue
            customTypeValue[type] = newValue
            this.setData({
                picker,
                customTypeValue,
            })
        }
    },

    pageleave(e) {
        console.log('pageleave', e)
        this.setData({
            isCustomize: false,
        })
    },

    handleInput(e) {
        let value = e.detail.value
        this.customObj.inputValue = value
    },

    onConfirmInput(e) {
        console.log('onConfirmInput', e)
        this.confirmCustomize()
    },

    confirmCustomize() {
        let inputValue = this.customObj.inputValue
        let exp = new RegExp('[^0-9]', 'g')
        if (exp.test(inputValue)) {
            console.log('invalid')
            wx.showToast({
                title: '输入内容有误，请重试',
                icon: 'none',
                duration: 1000,
            })
            return
        }
        console.log('valid')
        let num = parseInt(inputValue)

        this.settings[this.customObj.type] = num
        this.isChange = true
        let picker = this.data.picker
        picker[this.customObj.type] = this.customObj.value
        let customTypeValue = this.data.customTypeValue
        customTypeValue[this.customObj.type] = num
        this.setData({
            picker,
            customTypeValue,
            isCustomize: false,
        })
    },

    // 为拥有进入过渡动画用，实际可不做处理
    onEnter() { },

    getControl() {
        console.log('settings', this.settings)
        console.log('customObj', this.customObj)
    },

    async uploadAndModify(imgSrc) {
        let res = await userApi.downloadFile(imgSrc)
        let tempFilePath = res.tempFilePath
        console.log('downloadFile', res)

        let res1 = await userApi.uploadFile(tempFilePath)
        let file = res1.fileID
        console.log('file', file)
        console.log('uploadFile', res1)

        let res2 = await userApi.changeUserInfo({
            user_id: app.globalData.userInfo.user_id,
            type: 'avatar_pic',
            value: file
        })
        console.log('changeUserInfo', res2)
        if (res2.data == true) {
            app.globalData.userInfo.avatar_pic = file
            app.globalData.forChangeAvatar.change = true
            app.globalData.forChangeAvatar.imgSrc = file
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
    onUnload: async function () {
        if (this.isChange) {
            // 由于可能出现反复更改又改回原来的情况，为减少请求次数，在此通过对象比对检查是否真的进行更改
            let realIsChange = false
            let oldSettings = JSON.parse(JSON.stringify(app.globalData.userInfo.settings))
            let oldSettingsKeys = Object.keys(oldSettings)
            let newSettingsKeys = Object.keys(this.settings)
            if (oldSettingsKeys.length == newSettingsKeys.length) {
                oldSettingsKeys.sort()
                newSettingsKeys.sort()
                // 经排序后的设置的key的数组，若key本身不同或key对应的value不同，则说明settings发生了改变
                for (let i = 0; i < oldSettingsKeys.length; i++) {
                    if (oldSettingsKeys[i] != newSettingsKeys[i] || oldSettings[oldSettingsKeys[i]] != this.settings[newSettingsKeys[i]]) {
                        realIsChange = true
                        break
                    }
                }
            } else {
                realIsChange = true
            }
            if (!realIsChange) return
            let res1 = await userApi.changeSettings({
                user_id: app.globalData.userInfo.user_id,
                settings: this.settings,
            })
            console.log('try1', res1)
            if (!res1.data) {
                // 再次尝试
                let res2 = await userApi.changeSettings({
                    user_id: app.globalData.userInfo.user_id,
                    settings: this.settings,
                })
                if (!res2.data) {
                    wx.showToast({
                        title: '更改设置失败，请重试',
                        icon: 'none',
                        duration: 1500,
                    })
                    return
                }
            }
            console.log('更改设置成功')
            app.globalData.userInfo.settings = this.settings
            app.globalData.updatedForOverview = true
        }
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