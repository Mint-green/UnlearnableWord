const checkUsernameInDB = (data) => {
    data.$url = 'checkUsername'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "userRouter",
            data,
            success: (res) => {
                resolve(res.result)
            },
            fail: (err) => {
                reject(err)
            }
        })
    })
}

const register = (data) => {
    data.$url = 'register'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "userRouter",
            data,
            success: (res) => {
                resolve(res.result)
            },
            fail: (err) => {
                reject(err)
            }
        })
    })
}

const login = (data) => {
    data.$url = 'login'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "userRouter",
            data,
            success: (res) => {
                resolve(res.result)
            },
            fail: (err) => {
                reject(err)
            }
        })
    })
}

const getWxUserInfo = () => {
    return new Promise((resolve, reject) => {
        wx.getUserProfile({
            desc: '信息用于快捷登录小程序',
            success: (res) => {
                resolve(res)
            },
            fail: (err) => {
                console.log('获取微信用户信息失败')
                reject(err)
            }
        })
    })
}

const wxLogin = (data) => {
    data.$url = 'wxLogin'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "userRouter",
            data,
            success: (res) => {
                resolve(res.result)
            },
            fail: (err) => {
                reject(err)
            }
        })
    })
}

const changeWordBook = (data) => {
    // let data = {}
    data.$url = 'changeWordBook'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "userRouter",
            data,
            success: (res) => {
                resolve(res.result)
            },
            fail: (err) => {
                reject(err)
            }
        })
    })
}

const changeSettings = (data) => {
    // let data = {}
    data.$url = 'changeSettings'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "userRouter",
            data,
            success: (res) => {
                resolve(res.result)
            },
            fail: (err) => {
                reject(err)
            }
        })
    })
}

const getUserInfoViaId = (data) => {
    // let data = {}
    data.$url = 'getUserInfoViaId'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "userRouter",
            data,
            success: (res) => {
                resolve(res.result)
            },
            fail: (err) => {
                reject(err)
            }
        })
    })
}

const changeUserInfo = (data) => {
    // let data = {}
    data.$url = 'changeUserInfo'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "userRouter",
            data,
            success: (res) => {
                resolve(res.result)
            },
            fail: (err) => {
                reject(err)
            }
        })
    })
}

const changePwd = (data) => {
    // let data = {}
    data.$url = 'changePwd'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "userRouter",
            data,
            success: (res) => {
                resolve(res.result)
            },
            fail: (err) => {
                reject(err)
            }
        })
    })
}

const uploadFile = (imgSrc) => {
    return new Promise((resolve, reject) => {
        let fileExtName = /\.\w+$/.exec(imgSrc)[0]  //获取文件格式(后缀名)
        wx.cloud.uploadFile({
            cloudPath: 'avatar_pic/' + Date.now() + '-' + Math.floor(Math.random() * 10000) + fileExtName,  //生成添加时间戳后的随机序列作为文件名
            filePath: imgSrc,
            success: (res) => {
                resolve(res)
            },
            fail: (err) => {
                console.log(err)
                reject(err)
            }
        })
    })
}

const downloadFile = (imgSrc) => {
    return new Promise((resolve, reject) => {
        wx.downloadFile({
            url: imgSrc,
            success(res) {
                // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
                if (res.statusCode === 200) {
                    // console.log(res)
                    resolve(res)
                }
            },
            fail: (err) => {
                console.log(err)
                reject(err)
            }
        })
    })
}

module.exports = {
    checkUsernameInDB: checkUsernameInDB,
    register: register,
    login: login,
    getWxUserInfo: getWxUserInfo,
    wxLogin: wxLogin,
    changeWordBook: changeWordBook,
    changeSettings: changeSettings,
    getUserInfoViaId: getUserInfoViaId,
    changeUserInfo: changeUserInfo,
    changePwd: changePwd,
    downloadFile: downloadFile,
    uploadFile: uploadFile,
}
