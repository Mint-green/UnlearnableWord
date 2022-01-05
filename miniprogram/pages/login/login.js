//login.js
const app = getApp()
import regeneratorRuntime, { async } from '../../lib/runtime/runtime.js';
const { formatTime } = require('../../utils/format_time.js')
const error_message = [
    '',
    '请完成填写再重试',
    '账号或密码错误',
    '该账号已被注册',
    '两次输入密码不同',
    '用户名仅能包含数字、中英文和下划线',
    '用户名不能以下划线开头或结尾',
    '密码仅能包含数字、英文字母和下划线',
    '密码不能以下划线开头或结尾',
]
const userApi = require("../../utils/userApi.js")
const rescontent = require('../../utils/response_content.js')

Page({
    data: {
        isregister: false,
        errmsg: error_message,
        errtype: 0,
    },
    user: {
        username: '',
        pwd: '',
        confirm_pwd: '',
    },
    // isUsernameChecked: false,

    onLoad(options) {
        wx.setNavigationBarColor({
            backgroundColor: '#d0e6a5',
            frontColor: '#ffffff',
        })

        wx.setNavigationBarTitle({
            title: '登录',
        })
    },

    //处理input内容变化时的时间
    handleInput(e) {
        let inputtype = e.target.dataset.inputtype
        let value = e.detail.value
        this.user[inputtype] = value
        // if (inputtype == "username") {
        //     if (this.data.isregister) {
        //         this.isUsernameChecked = false
        //     }
        // }
        // console.log(inputtype, this.user[inputtype])
    },

    async checkUsername() {
        let username = this.user.username
        if (username == '') { return false }
        if(!(this.checkUsernameVaild()))  return false
        // console.log('check whether', username, 'have been registered')
        let res = await userApi.checkUsernameInDB({ username })
        // console.log('checkUsername', res)
        if (!res.errorcode) { return false }
        if (res.data.isFind) {
            this.setErrType(3)
            return false
        }
        // this.isUsernameChecked = true
        return true
    },

    checkUsernameVaild(register = true) {
        // 用户名合法性判断，只能包含字母、数字、中文、下划线且不能以下划线开头或结尾
        // let exp1 = /^(?!_)(?!.*?_$)[a-zA-Z0-9_\u4e00-\u9fa5]+$/
        let username = this.user.username
        let exp1 = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/
        let exp2 = /^(?!_)(?!.*?_$).+$/
        if (!exp1.test(username)) {
            this.setErrType(register ? 5 : 2)
            return false
        }
        if (!exp2.test(username)) {
            this.setErrType(register ? 6 : 2)
            return false
        }
        return true
    },

    checkPwd(register = true) {
        // 密码合法性判断，只能包含字母、数字、下划线且不能以下划线开头或结尾
        let pwd = this.user.pwd
        let exp1 = /^[a-zA-Z0-9_]+$/
        let exp2 = /^(?!_)(?!.*?_$).+$/
        if (!exp1.test(pwd)) {
            this.setErrType(register ? 7 : 2)
            return false
        }
        if (!exp2.test(pwd)) {
            this.setErrType(register ? 8 : 2)
            return false
        }
        return true
    },

    checkTwoPwd() {
        let pwd = this.user.pwd
        let confirm_pwd = this.user.confirm_pwd
        if (pwd != confirm_pwd) {
            this.setErrType(4)
            return false
        }
        return true
    },

    checkEmptyField() {
        if (this.user.username != '' && this.user.pwd != '') {
            if (this.data.isregister) {
                if (this.user.confirm_pwd != '') {
                    return true
                }
            } else {
                return true
            }
        }
        this.setErrType(1)
        return false
    },

    changeType(e) {
        this.setData({
            isregister: !(this.data.isregister),
            errtype: 0,
        })
        this.user = {
            username: '',
            pwd: '',
            confirm_pwd: '',
        }
        // this.isUsernameChecked = false
    },

    setErrType(errtype) {
        let _this = this
        this.setData({ errtype })
        clearTimeout(this.timer)
        this.timer = setTimeout(() => {
            _this.setData({ errtype: 0 })
        }, 1500)
    },

    async login() {
        if (!(this.checkEmptyField()) || !(this.checkUsernameVaild(false)) || !(this.checkPwd(false))) {
            return
        }
        console.log('try to login')
        let username = this.user.username
        let pwd = this.user.pwd
        let res = await userApi.login({ username, pwd })
        console.log(res)
        this.afterLogin(res)
    },

    async register() {
        if (!(this.checkEmptyField()) || !(this.checkPwd()) || !(this.checkTwoPwd())) {
            return
        }
        // if (!(this.isUsernameChecked)) {
        let usernameOk = await this.checkUsername()
        if (!usernameOk) { return }
        // this.isUsernameChecked = true
        // }
        console.log('try to register')
        // return
        let username = this.user.username
        let pwd = this.user.pwd
        let res = await userApi.register({ username, pwd })
        // console.log(res)
        this.afterLogin(res)
    },

    async wxLogin() {
        console.log('login/register using wechat userinfo')
        let res = await userApi.getWxUserInfo()
        if (!res.userInfo) { return }
        let username = res.userInfo.nickName
        let avatar_pic = res.userInfo.avatarUrl
        let res1 = await userApi.wxLogin({ username, avatar_pic })
        console.log(res1)
        this.afterLogin(res1)
    },

    afterLogin(res) {
        let duration = 1000
        if (res.errorcode == rescontent.LOGINERR.errorcode) {
            this.setErrType(2)
            return
        } else if (res.errorcode == rescontent.REGISTEROK.errorcode) {
            wx.showToast({
                title: `注册成功`,
                icon: 'none',
                duration: duration,
            })
        } else if (res.errorcode == rescontent.LOGINOK.errorcode) {
            let lastlogin = formatTime(res.data.last_login)
            wx.showToast({
                title: `登录成功，上次登录时间 ${lastlogin}`,
                icon: 'none',
                duration: duration,
            })
        } else {
            wx.showToast({
                title: '服务出错，请重试',
                icon: 'none',
                duration: duration
            })
            return
        }

        setTimeout(function () {
            app.globalData.isLogin = true
            app.globalData.userInfo = res.data
            app.globalData.updatedForIndex = true
            app.globalData.updatedForOverview = true
            let storageContent = {
                time: new Date().getTime(),
                info: res.data,
            }
            wx.setStorageSync('userInfo', storageContent)
            wx.navigateBack({
                delta: 1,
                complete: (res) => { console.log('navigate back complete', res) },
            })
        }, duration)
    },


})