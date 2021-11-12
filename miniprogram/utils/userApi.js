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


module.exports = {
    checkUsernameInDB: checkUsernameInDB,
    register: register,
    login: login,
    getWxUserInfo: getWxUserInfo,
    wxLogin: wxLogin,
}
