//获取应用实例
const app = getApp()
import regeneratorRuntime, { async } from '../../lib/runtime/runtime';
const userApi = require("../../utils/userApi.js")

Page({
    data: {
        src: '',
        width: 250, //宽度
        height: 250, //高度
        max_width: 300,
        max_height: 300,
    },
    cropper: undefined,

    onLoad: function (options) {
        this.cropper = this.selectComponent("#image-cropper")
        this.setData({
            src: app.globalData.forChangeAvatar.tempImgSrc
        })
    },

    cropperload(e) {
        console.log('cropper加载完成')
    },

    loadimage(e) {
        wx.hideLoading()
        console.log('图片')
        this.cropper.imgReset()
    },

    clickcut(e) {
        console.log(e.detail)
        //图片预览
        wx.previewImage({
            current: e.detail.url, // 当前显示图片的http链接
            urls: [e.detail.url] // 需要预览的图片http链接列表
        })
    },

    chooseImage() {
        let that = this;
        wx.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success(res) {
                wx.showLoading({
                    title: '加载中',
                })
                const tempFilePaths = res.tempFilePaths[0]
                app.globalData.forChangeAvatar.tempImgSrc = tempFilePaths
                //重置图片角度、缩放、位置
                that.cropper.imgReset()
                that.setData({
                    src: tempFilePaths
                })
            }
        })
    },

    submit() {
        this.cropper.getImg(this.uploadAndModify)
    },

    async uploadAndModify(obj) {
        wx.showLoading({
            title: '头像上传中...',
            mask: true,
        })
        let res1 = await userApi.uploadFile(obj.url)
        let file = res1.fileID
        if (!file) {
            wx.hideLoading()
            wx.showToast({
                title: '更改失败，请重试',
                icon: 'none',
                duration: 1500,
            })
            return
        }
        console.log('file', file)
        this.changeAvatar(file)
    },

    async uploadAndModify1(obj) {
        console.log(obj)
        let fileExtName = /\.\w+$/.exec(obj.url)[0]  //获取文件格式(后缀名)
        let _this = this
        wx.cloud.uploadFile({
            cloudPath: 'avatar_pic/' + Date.now() + '-' + Math.floor(Math.random() * 10000) + fileExtName,  //生成添加时间戳后的随机序列作为文件名
            filePath: obj.url,
            success: res1 => {
                let file = res1.fileID
                console.log('file', file)
                _this.changeAvatar(file)
            },
            fail: err => {
                console.log(err)
                wx.showToast({
                    title: '更改失败，请重试',
                    icon: 'none',
                    duration: 1500,
                })
            }
        })
    },

    async changeAvatar(file) {
        let data = {
            user_id: app.globalData.userInfo.user_id,
        }
        if (app.globalData.userInfo.wx_user == true && app.globalData.userInfo.settings.auto_update_avatar == true) {
            data.type = ['avatar_pic', 'settings']
            data.value = [file, { auto_update_avatar: false }]
        } else {
            data.type = 'avatar_pic'
            data.value = file
        }

        let res2 = await userApi.changeUserInfo(data)
        console.log(res2)
        wx.hideLoading()
        if (res2.data == true) {
            app.globalData.userInfo.avatar_pic = file
            app.globalData.forChangeAvatar.change = true
            app.globalData.forChangeAvatar.imgSrc = file
            if (app.globalData.userInfo.wx_user == true && app.globalData.userInfo.settings.auto_update_avatar == true) {
                app.globalData.userInfo.settings.auto_update_avatar = false
            }
            wx.navigateBack({
                delta: -1
            })
        } else {
            wx.showToast({
                title: '更改失败，请重试',
                icon: 'none',
                duration: 1500,
            })
        }
    },

    rotate() {
        //在用户旋转的基础上旋转90°
        this.cropper.setAngle(this.cropper.data.angle += 90)
    },

    setWidth(e) {
        this.setData({
            width: e.detail.value < 10 ? 10 : e.detail.value
        })
        this.setData({
            cut_left: this.cropper.data.cut_left
        })
    },

    setHeight(e) {
        this.setData({
            height: e.detail.value < 10 ? 10 : e.detail.value
        })
        this.setData({
            cut_top: this.cropper.data.cut_top
        })
    },

    setCutTop(e) {
        this.setData({
            cut_top: e.detail.value
        })
        this.setData({
            cut_top: this.cropper.data.cut_top
        })
    },

    setCutLeft(e) {
        this.setData({
            cut_left: e.detail.value
        })
        this.setData({
            cut_left: this.cropper.data.cut_left
        })
    },
})