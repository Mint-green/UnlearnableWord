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


module.exports = {
    getDailySentence: getDailySentence,
    getSearchResult: getSearchResult,
    getWordDetail: getWordDetail,
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