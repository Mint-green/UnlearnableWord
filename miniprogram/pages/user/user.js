// pages/user/user.js
import regeneratorRuntime, { async } from '../../lib/runtime/runtime';

const app = getApp()

Page({

    /**
     * 页面的初始数据
     */
    data: {
        isLogin: false,
        userInfo: {},
        defaultPic: 'cloud://music-cloud-1v7x1.6d75-music-cloud-1v7x1-1302160851/avatar_pic/default_1.jpg',
    },
    control: {
        loginTimer: -1,
        pageHide: false,
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

    uploadImg() {
        wx.showLoading({
            title: '',
        })
        // 让用户选择一张图片
        wx.chooseImage({
            count: 1,
            success: chooseResult => {
                // 将图片上传至云存储空间
                wx.cloud.uploadFile({
                    // 指定上传到的云路径
                    cloudPath: 'my-photo.png',
                    // 指定要上传的文件的小程序临时文件路径
                    filePath: chooseResult.tempFilePaths[0],
                    config: {
                        env: this.data.envId
                    }
                }).then(res => {
                    console.log('上传成功', res)
                    this.setData({
                        haveGetImgSrc: true,
                        imgSrc: res.fileID
                    })
                    wx.hideLoading()
                }).catch((e) => {
                    console.log(e)
                    wx.hideLoading()
                })
            },
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