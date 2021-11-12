// pages/search/search.js
import regeneratorRuntime, {
    async
} from '../../lib/runtime/runtime';
const wordApi = require("../../utils/wordApi.js")
const word_utils = require("../../utils/word_utils.js")

const app = getApp()

Page({

    /**
     * 页面的初始数据
     */
    data: {
        true: true,
        searchWords: "",
        keyword: '',
        lemmaResult: [],
        directResult: [],
        history: [],
        haveResult: false,
        focus: false,
        DBtype: 0,
    },
    searchTimeId: -1,

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        wx.setNavigationBarColor({
            backgroundColor: '#f6f6f6',
            frontColor: '#000000',
        })
        this.getHistory()
        this.setData({
            focus: true
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

    },

    // input内容变化时对内容进行记录，同时设置定时器，停止输入达到一定时间则发起查询
    handleInput(e) {
        let keyword = e.detail.value
        // console.log("keyword:", keyword)
        clearTimeout(this.searchTimeId);
        if (keyword == '') {
            this.setData({
                keyword,
                haveResult: false
            })
            return
        }
        this.setData({
            keyword,
            haveResult: true
        })
        let _this = this
        this.searchTimeId = setTimeout(() => {
            _this.getSearchResult(keyword);
        }, 1500);
    },

    // 清空输入框
    clearInput() {
        this.setData({
            searchWords: '',
            keyword: '',
            lemmaResult: [],
            directResult: [],
            haveResult: false,
        })
        clearTimeout(this.searchTimeId);
    },

    // 获取搜索结果（原型+作为前缀搜索）
    // 会预先变成小写并检查keyword内容(正则) 缓存前缀字段的搜索结果
    async getSearchResult(keyword) {
        // return
        if (keyword == '') {
            return
        }
        // console.log('trigger get result for', keyword)
        keyword = keyword.toLowerCase()
        let exp = new RegExp('[^A-Za-z- \'\.]', 'g')
        console.log('regexp test:', exp.test(keyword))
        exp.lastIndex = 0
        if (exp.test(keyword)) {
            this.setData({
                lemmaResult: [],
                directResult: [],
            })
            console.log('invalid')
            return
        }
        keyword = keyword.replace(/-/g, '')
        keyword = keyword.replace(/\'/g, '\\\'')
        keyword = keyword.replace(/\./g, '\\\.')
        console.log(keyword)
        let DBtype = this.data.DBtype
        let res = await wordApi.getSearchResult({
            keyword,
            DBtype,
        })
        wx.setStorageSync('searchresult', res.data)
        console.log(res)
        this.transResult(res.data, keyword)
    },

    // 处理获得的搜索结果，包括获取搜索词是原型的什么变换以及仅保留第一条解释
    transResult(searchresult, keyword) {
        let lemmares = searchresult.lemmaSearch
        let directres = searchresult.directSearch
        console.log('lemmares')
        for (let i = 0; i < lemmares.length; i++) {
            console.log(lemmares[i].exchange)
            let exchangeList = word_utils.toExchangeList(lemmares[i].exchange)
            let find = false
            let exchange = ''
            for (let m = 0; m < exchangeList.length; m++) {
                if (exchangeList[m].word.toLowerCase() == keyword) {
                    exchange = exchange + exchangeList[m].name + '、'
                    find = true
                }
            }
            if (!find) {
                lemmares.splice(i, 1)
                i--
                continue
            }
            lemmares[i].exchange = exchange.substring(0, exchange.length - 1)
            if (lemmares[i].translation.indexOf('\n') != -1) {
                lemmares[i].translation = lemmares[i].translation.substring(0, lemmares[i].translation.indexOf('\n'))
            }
        }
        console.log(lemmares)
        console.log('directres')
        for (let i = 0; i < directres.length; i++) {
            if (directres[i].translation.indexOf('\n') != -1) {
                directres[i].translation = directres[i].translation.substring(0, directres[i].translation.indexOf('\n'))
            }
            // console.log('rect length of:', directres[i], word_utils.getResObjRectLength(directres[i]))
        }
        console.log(directres)
        this.setData({
            lemmaResult: lemmares,
            directResult: directres,
        })
    },

    //获取历史搜索
    getHistory() {
        let history = wx.getStorageSync('history')
        if (!history) {
            return
        }
        this.setData({
            history
        })
    },

    getWordDetail(e) {
        let index = e.currentTarget.dataset.index
        let type = parseInt(e.currentTarget.dataset.sourcetype) // dataset不区分大小写
        // console.log('index:', index, 'type:', type)
        let type_l = ['lemmaResult', 'directResult', 'history']
        let wordObjList = this.data[type_l[type]]
        let wordObj = wordObjList[index]

        // 首先获取单词对象（id、单词、释义）
        if (type == 0) {
            delete wordObj.exchange
        }
        console.log(wordObj)
        let history = this.data.history
        for (let i = 0; i < history.length; i++) {
            if (history[i].word_id == wordObj.word_id) {
                history.splice(i, 1)
                break
            }
        }
        if (history.length >= 20) {
            history.pop()
        }
        history.unshift(wordObj)
        this.setData({
            history
        })
        // wx.setStorageSync('history', this.data.history) // 实际每次都会跳转，不必设置到隐藏或卸载页面时才保存

        // 跳转进行查询
        wx.navigateTo({
            url: '../word_detail/word_detail?word_id=' + wordObj.word_id,
        })
    },

    deleteHistory(e) {
        let index = e.currentTarget.dataset.index
        if (index == "-1") {
            this.setData({
                history: []
            })
            // wx.removeStorageSync('history')
        } else {
            let history = this.data.history
            history.splice(index, 1)
            this.setData({
                history
            })
        }
    },

    changeType() {
        let DBtype = this.data.DBtype
        if (DBtype == 0) {
            DBtype = 1
        } else if (DBtype == 1) {
            DBtype = 0
        }
        this.setData({
            DBtype
        })
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {
        wx.setStorageSync('history', this.data.history)
    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {
        wx.setStorageSync('history', this.data.history)
    },
})