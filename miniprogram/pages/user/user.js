// pages/user/user.js
import regeneratorRuntime, { async } from '../../lib/runtime/runtime';

const app = getApp()
const modifyDict = {
    username: 0,
    pwd: 1,
}
const error_message = {
    empty: '请完成填写再重试',
    usernameUsed: '该账号已被注册',
    usernameInvalid1: '用户名仅能包含数字、中英文和下划线',
    usernameInvalid2: '用户名不能以下划线开头或结尾',
    pwdInvalid1: '密码仅能包含数字、英文字母和下划线',
    pwdInvalid2: '密码不能以下划线开头或结尾',
    pwdErr1: '所输入新密码与旧密码相同',
    pwdErr2: '旧密码错误',

}
const userApi = require("../../utils/userApi.js")

Page({

    /**
     * 页面的初始数据
     */
    data: {
        isLogin: false,
        userInfo: {},
        defaultPic: 'https://pic2.zhimg.com/50/v2-b1e4eb7f72908a04306958f13ce45d94_hd.jpg?source=1940ef5c',
        changeType: -1,
        inputValue: {},
        errMsg: '',
    },
    control: {
        loginTimer: -1,
        pageHide: false,
        timer: -1,
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        wx.setNavigationBarTitle({
            title: '我的',
        })
        this.init()
    },

    init() {
        // console.log(app.globalData)
        let isLogin = app.globalData.isLogin
        let userInfo = {}
        if (isLogin) {
            userInfo = {
                avatar_pic: app.globalData.userInfo.avatar_pic,
                username: app.globalData.userInfo.username,
                user_id: app.globalData.userInfo.user_id,
                wx_user: app.globalData.userInfo.wx_user,
            }
        }
        this.setData({
            isLogin,
            userInfo,
        })

        if (app.globalData.tryingLogin) {
            let _this = this
            this.control.loginTimer = setInterval(function () {
                if (!app.globalData.tryingLogin) {
                    _this.onShow()
                    clearInterval(_this.control.loginTimer)
                }
            }, 200)
        }
    },

    notDoneTips() {
        wx.showToast({
            title: '此功能还在开发中哦~',
            icon: 'none',
            duration: 1500,
        })
    },

    goLogin() {
        wx.navigateTo({
            url: '../login/login',
        })
    },

    goSettings() {
        if (!this.checkLogin()) return
        wx.navigateTo({
            url: "../user_settings/user_settings"
        })
    },

    checkLogin() {
        if (this.data.isLogin) {
            return true
        } else {
            wx.showToast({
                title: '请先登录哦~',
                icon: 'none',
                duration: 1500,
            })
            return false
        }
    },

    logout() {
        let _this = this
        wx.showModal({
            // title: '退出登录',
            content: '退出登录后将无法继续学习哦~',
            success(res) {
                console.log('showModal res', res)
                if (res.confirm) {
                    console.log('用户点击确定')
                    app.globalData.isLogin = false
                    app.globalData.userInfo = {}
                    app.globalData.updatedForIndex = true
                    app.globalData.updatedForOverview = true
                    _this.setData({
                        isLogin: false,
                        userInfo: {}
                    })
                    wx.removeStorageSync('userInfo')
                } else if (res.cancel) {
                    console.log('用户点击取消')
                }
            }
        })
    },

    previewAvatar() {
        wx.previewImage({
            current: this.data.userInfo.avatar_pic, // 当前显示图片的http链接
            urls: [this.data.userInfo.avatar_pic] // 需要预览的图片http链接列表
        })
    },

    changeAvatar() {
        if (!this.checkLogin()) return
        wx.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success(res) {
                // tempFilePath可以作为img标签的src属性显示图片
                //   const tempFilePaths = res.tempFilePaths
                console.log(res)
                const tempFilePaths = res.tempFilePaths[0]
                app.globalData.forChangeAvatar.tempImgSrc = tempFilePaths
                wx.navigateTo({
                    url: '../image_cropper/image_cropper',
                })
            }
        })
    },

    modify(e) {
        if (!this.checkLogin()) return
        let type = e.currentTarget.dataset.type
        this.setData({
            changeType: modifyDict[type],
            inputValue: {
                username: '',
                oldPwd: '',
                newPwd: '',
            },
            errMsg: '',
        })

        let _this = this
        setTimeout(function () {
            _this.setData({
                focus: true
            })
        }, 500)
    },

    handleInput(e) {
        console.log('event', e)
        let value = e.detail.value
        let inputType = e.currentTarget.dataset.inputtype
        console.log('inputType', inputType)
        let inputValue = this.data.inputValue
        inputValue[inputType] = value
        this.setData({
            inputValue
        })
    },

    setErrType(errtype) {
        let _this = this
        this.setData({ errMsg: error_message[errtype] })
        clearTimeout(this.control.timer)
        this.control.timer = setTimeout(() => {
            _this.setData({ errMsg: '' })
        }, 2000)
    },

    async changeUsername() {
        // 用户名合法性判断，只能包含字母、数字、中文、下划线且不能以下划线开头或结尾
        // let exp1 = /^(?!_)(?!.*?_$)[a-zA-Z0-9_\u4e00-\u9fa5]+$/
        let username = this.data.inputValue.username
        if (username == '') {
            this.setErrType('empty')
            return false
        }
        let exp1 = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/
        let exp2 = /^(?!_)(?!.*?_$).+$/
        if (!exp1.test(username)) {
            this.setErrType('usernameInvalid1')
            return false
        }
        if (!exp2.test(username)) {
            this.setErrType('usernameInvalid2')
            return false
        }

        let msg = '用户名更改成功~'
        if (username == this.data.userInfo.username) {
            msg = '与原用户名相同，无需更改'
        } else {
            let res1 = await userApi.checkUsernameInDB({ username })
            if (!res1.errorcode) { return false }
            if (res1.data.isFind) {
                this.setErrType('usernameUsed')
                return false
            }

            let data = {
                user_id: this.data.userInfo.user_id,
            }
            if (app.globalData.userInfo.wx_user == true && app.globalData.userInfo.settings.auto_update_username == true) {
                data.type = ['username', 'settings']
                data.value = [username, { auto_update_username: false }]
            } else {
                data.type = 'username'
                data.value = username
            }

            let res2 = await userApi.changeUserInfo(data)
            if (res2.data == true) {
                this.setData({
                    'userInfo.username': username
                })
                app.globalData.userInfo.username = username
                if (app.globalData.userInfo.wx_user == true && app.globalData.userInfo.settings.auto_update_username == true) {
                    app.globalData.userInfo.settings.auto_update_username = false
                }
            } else {
                wx.showToast({
                    title: '更改出错，请重试',
                    icon: 'none',
                    duration: 1500,
                })
                return false
            }
        }
        wx.showToast({
            title: msg,
            icon: 'none',
            duration: 1500,
        })
        return true
    },

    async changePwd() {
        // 密码合法性判断，只能包含字母、数字、下划线且不能以下划线开头或结尾
        let oldPwd = this.data.inputValue.oldPwd
        let newPwd = this.data.inputValue.newPwd
        if (oldPwd == '' || newPwd == '') {
            this.setErrType('empty')
            return false
        }
        let exp1 = /^[a-zA-Z0-9_]+$/
        let exp2 = /^(?!_)(?!.*?_$).+$/
        if (!exp1.test(oldPwd) || !exp1.test(newPwd)) {
            this.setErrType('pwdInvalid1')
            return false
        }
        if (!exp2.test(newPwd) || !exp2.test(newPwd)) {
            this.setErrType('pwdInvalid2')
            return false
        }

        if (newPwd == oldPwd) {
            this.setErrType('pwdErr1')
            return false
        } else {
            let res = await userApi.changePwd({
                user_id: this.data.userInfo.user_id,
                oldPwd,
                newPwd,
            })
            if (res.data != true) {
                this.setErrType('pwdErr2')
                return false
            }
            wx.showToast({
                title: '密码修改成功~',
                icon: 'none',
                duration: 1500,
            })
            return true
        }
    },

    async confirmModify() {
        let changeType = this.data.changeType
        if (changeType == modifyDict['username']) {
            let success = await this.changeUsername()
            if (!success) return
        } else if ((changeType == modifyDict['pwd'])) {
            let success = await this.changePwd()
            if (!success) return
        }
        this.setData({
            changeType: -1,
        })
    },

    cancelModify() {
        this.setData({
            changeType: -1,
        })
    },

    // 为拥有进入过渡动画用，实际可不做处理
    onEnter() { },

    pageleave(e) {
        console.log('pageleave', e)
        this.setData({
            changeType: -1,
        })
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
        if (this.control.pageHide) {
            if (this.data.isLogin != app.globalData.isLogin) {
                let userInfo = {}
                if (app.globalData.isLogin) {
                    userInfo = {
                        avatar_pic: app.globalData.userInfo.avatar_pic,
                        username: app.globalData.userInfo.username,
                        user_id: app.globalData.userInfo.user_id,
                        wx_user: app.globalData.userInfo.wx_user,
                    }
                } else {
                    userInfo = {}
                }
                this.setData({
                    isLogin: app.globalData.isLogin,
                    userInfo
                })
            }

            if (app.globalData.forChangeAvatar.change) {
                this.setData({
                    'userInfo.avatar_pic': app.globalData.forChangeAvatar.imgSrc
                })
                app.globalData.forChangeAvatar = {
                    change: false,
                    tempImgSrc: '',
                    imgSrc: '',
                }
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