// app.js
const rescontent = require('./utils/response_content.js')
const { formatTime } = require('./utils/format_time.js')
const userApi = require("./utils/userApi.js")

App({
    onLaunch: function () {
        if (!wx.cloud) {
            console.error('请使用 2.2.3 或以上的基础库以使用云能力');
        } else {
            wx.cloud.init({
                // env 参数说明：
                //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
                //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
                //   如不填则使用默认环境（第一个创建的环境）
                // env: 'my-env-id',
                traceUser: true,
            });
        }

        this.checkLogin()
        wx.disableAlertBeforeUnload()
    },

    globalData: {
        isLogin: false,
        tryingLogin: true,
        userInfo: {
            // user_id: 2,
            // l_book_id: 2,
            settings: {
                // learn_repeat_t: 3,
                // group_size: 10,
                // learn_first_m: 'chooseTrans',
                // learn_second_m: 'recallTrans',
                // learn_third_m: 'recallWord',
                // learn_fourth_m: 'recallTrans',
                // timing: true,
                // timing_duration: 1000,
                // autoplay: false,
                // type: 1,
                // review_repeat_t: 2,
                // review_first_m: 'recallTrans',
                // review_second_m: 'chooseTrans',
                // review_second_m: 'recallWord',
                // review_third_m: 'recallTrans',
            }
        },
        updatedForIndex: false,
        updatedForOverview: false,
        forChangeAvatar: {
            change: false,
            tempImgSrc: '',
            imgSrc: '',
        }
    },

    checkLogin: async function () {
        this.globalData.tryingLogin = true
        // let history = wx.getStorageSync('history')
        // wx.clearStorageSync()
        // wx.setStorageSync('history', history)
        // console.log('checkLogin')
        // console.log('this.globalData.tryingLogin ', this.globalData.tryingLogin)
        let storageContent = wx.getStorageSync('userInfo')
        if (storageContent && (new Date().getTime() - storageContent.time) < 86400000 * 2) {
            let res = await userApi.getUserInfoViaId({ user_id: storageContent.info.user_id })
            if (res.errorcode == rescontent.SUCCESS.errorcode) {
                this.globalData.isLogin = true
                this.globalData.userInfo = res.data
                let lastlogin = formatTime(res.data.last_login)
                wx.showToast({
                    title: `自动登录成功，上次登录时间 ${lastlogin}`,
                    icon: 'none',
                    duration: 1500,
                })
                storageContent.info = res.data
                wx.setStorageSync('userInfo', storageContent)
            } else {
                wx.showToast({
                    title: '自动登录失败，请重新登录',
                    icon: 'none',
                    duration: 1500,
                })
                wx.removeStorageSync('userInfo')
            }
        } else if (storageContent) {
            wx.showToast({
                title: '登录已过期，请重新登录',
                icon: 'none',
                duration: 1500,
            })
            wx.removeStorageSync('userInfo')
        }
        this.globalData.tryingLogin = false
        // console.log('this.globalData.tryingLogin ', this.globalData.tryingLogin)
    },
});
