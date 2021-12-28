const getDailySentence = () => {
    let data = {}
    data.$url = 'getDailySentence'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "wordRouter",
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

const getSearchResult = (data) => {
    // let data = {}
    data.$url = 'getSearchResult'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "wordRouter",
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

const getWordDetail = (data) => {
    // let data = {}
    data.$url = 'getwordDetail'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "wordRouter",
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

const getBasicLearningData = (data) => {
    // let data = {}
    data.$url = 'getBasicLearningData'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "wordRouter",
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

const getLearningData = (data) => {
    // let data = {}
    data.$url = 'getLearningData'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "wordRouter",
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

const getReviewData = (data) => {
    // let data = {}
    data.$url = 'getReviewData'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "wordRouter",
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

const toggleAddToNB = (data) => {
    // let data = {}
    data.$url = 'toggleAddToNB'
    // data.user_id = getApp().globalData.userInfo.user_id
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "wordRouter",
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

const addLearningRecord = (data) => {
    // let data = {}
    // 重复添加的官方errCode是-502001，在返回的err里
    data.$url = 'addLearningRecord'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "wordRouter",
            // name: "learningRouter",
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

const updateLearningRecord = (data) => {
    // let data = {}
    data.$url = 'updateLearningRecord'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "wordRouter",
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

const getWBLearnData = (data) => {
    // let data = {}
    data.$url = 'getWBLearnData'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "statisticRouter",
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

const getAllWBData = () => {
    let data = {}
    data.$url = 'getAllWBData'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "statisticRouter",
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

const getSingleWBData = (data) => {
    // let data = {}
    data.$url = 'getSingleWBData'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "statisticRouter",
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

const getAllLearnData = (data) => {
    // let data = {}
    data.$url = 'getAllLearnData'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "statisticRouter",
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

const getDailySum = (data) => {
    // let data = {}
    data.$url = 'getDailySum'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "statisticRouter",
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

const getTodayLearnData = (data) => {
    // let data = {}
    data.$url = 'getTodayLearnData'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "statisticRouter",
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

const getNoteBookWord = (data) => {
    // let data = {}
    data.$url = 'getNoteBookWord'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "statisticRouter",
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

const getBkLearnedWord = (data) => {
    // let data = {}
    data.$url = 'getBkLearnedWord'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "statisticRouter",
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

const getBkMasteredWord = (data) => {
    // let data = {}
    data.$url = 'getBkMasteredWord'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "statisticRouter",
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

const getBkUnlearnedWord = (data) => {
    // let data = {}
    data.$url = 'getBkUnlearnedWord'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "statisticRouter",
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

const getBkWord = (data) => {
    // let data = {}
    data.$url = 'getBkWord'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "statisticRouter",
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

const getLearnedWord = (data) => {
    // let data = {}
    data.$url = 'getLearnedWord'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "statisticRouter",
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

const getMasteredWord = (data) => {
    // let data = {}
    data.$url = 'getMasteredWord'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "statisticRouter",
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

const getReviewWord = (data) => {
    // let data = {}
    data.$url = 'getReviewWord'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "statisticRouter",
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

const getTodayLearnWord = (data) => {
    // let data = {}
    data.$url = 'getTodayLearnWord'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "statisticRouter",
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

const getTodayReviewWord = (data) => {
    // let data = {}
    data.$url = 'getTodayReviewWord'
    return new Promise((resolve, reject) => {
        wx.cloud.callFunction({
            name: "statisticRouter",
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
    getDailySentence: getDailySentence,
    getSearchResult: getSearchResult,
    getWordDetail: getWordDetail,
    getBasicLearningData: getBasicLearningData,
    getLearningData: getLearningData,
    getReviewData: getReviewData,
    toggleAddToNB: toggleAddToNB,
    addLearningRecord: addLearningRecord,
    updateLearningRecord: updateLearningRecord,
    getWBLearnData: getWBLearnData,
    getAllWBData: getAllWBData,
    getSingleWBData: getSingleWBData,
    getAllLearnData: getAllLearnData,
    getDailySum: getDailySum,
    getTodayLearnData: getTodayLearnData,
    getNoteBookWord: getNoteBookWord,
    getBkLearnedWord: getBkLearnedWord,
    getBkMasteredWord: getBkMasteredWord,
    getBkUnlearnedWord: getBkUnlearnedWord,
    getBkWord: getBkWord,
    getLearnedWord: getLearnedWord,
    getMasteredWord: getMasteredWord,
    getReviewWord: getReviewWord,
    getTodayLearnWord: getTodayLearnWord,
    getTodayReviewWord: getTodayReviewWord,
}


import regeneratorRuntime, { async } from '../lib/runtime/runtime';
const format_time = require('./format_time.js')

const getDailySentenceWx = async () => {
    // console.log('on tap button 2')
    // return
    let t1 = new Date().getTime()
    console.log('Start', t1)
    let time = new Date().getTime() - 86400000 * 0
    let dateStr = format_time.formatDate(time)
    let requestUrl_youdao = 'https://dict.youdao.com/infoline?mode=publish&date=' + dateStr + '&update=auto&apiversion=5.0'
    let requestUrl_iciba = 'https://sentence.iciba.com/index.php?c=dailysentence&m=getdetail&title=' + dateStr
    let requestUrl_shanbay = 'https://apiv3.shanbay.com/weapps/dailyquote/quote/?date=' + dateStr
    let dailySentenceList = []

    // for Youdao--------------------------------------------------------
    let res1 = await this.exportRequest(requestUrl_youdao)
    let result_list = res1.data[dateStr]
    console.log('dateStr:', dateStr, 'type:', typeof dateStr)
    console.log(result_list)
    let dateNum = format_time.dateNum(time)
    let timenum = dateNum * 10000
    let i = 0
    for (i; i < result_list.length; i++) {
        if (result_list[i].startTime - timenum < 10000 && result_list[i].voice && result_list[i].voice != '') { break }
    }
    let dailySentence = {}
    console.log(result_list[i])
    dailySentence.content = result_list[i].title
    dailySentence.translation = result_list[i].summary
    dailySentence.voiceUrl = result_list[i].voice
    dailySentenceList.push(dailySentence)
    // ------------------------------------------------------------------
    // for iCIBA--------------------------------------------------------
    dailySentence = {}
    let res2 = await exportRequest(requestUrl_iciba)
    dailySentence.content = res2.data.content
    dailySentence.translation = res2.data.note
    dailySentence.voiceUrl = res2.data.tts
    dailySentenceList.push(dailySentence)
    // ------------------------------------------------------------------
    // for shanbay--------------------------------------------------------
    dailySentence = {}
    let res3 = await exportRequest(requestUrl_shanbay)
    dailySentence.content = res3.data.content
    dailySentence.translation = res3.data.translation
    dailySentence.author = res3.data.author
    dailySentenceList.push(dailySentence)
    // ------------------------------------------------------------------
    console.log(dailySentenceList)
    let t2 = new Date().getTime()
    console.log('Done', t2, 'Time Spent', t2 - t1)
}

const exportRequest = (url) => {
    return new Promise((resolve, reject) => {
        wx.request({
            url: url,
            method: 'GET',
            dataType: 'json',
            success: (res) => {
                resolve(res)
            },
            fail: (err) => {
                console.log('请求失败')
                console.log(err)
                reject(err)
            }
        })
    })
}