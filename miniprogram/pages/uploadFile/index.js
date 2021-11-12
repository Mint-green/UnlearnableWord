Page({

  /**
   * 页面的初始数据
   */
  data: {
    showUploadTip: false,
    haveGetImgSrc: false,
    envId: '',
    imgSrc: ''
  },

  onLoad(options) {
    this.setData({
      envId: options.envId
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

  clearImgSrc() {
    this.setData({
      haveGetImgSrc: false,
      imgSrc: ''
    })
  }

})
