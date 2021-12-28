const tagDict = {
    zk: '中考',
    gk: '高考',
    ky: '考研',
    cet4: '四级',
    cet6: '六级',
    toefl: '托福',
    ielts: '雅思',
    gre: 'GRE'
}

const exchangeTagList = ['s', 'p', 'd', 'i', '3', 'r', 't']   // 统一词形变换排列顺序用
const exchangeNameDict = {
    p: '过去式',
    d: '过去分词',
    i: '现在分词',
    3: '第三人称单数',
    r: '比较级',
    t: '最高级',
    s: '复数形式',
    0: '原型',
    1: '原型的什么变体',
}

// 解析原exchange字段(字符串)，返回包含word(变体)和name(变体形式)(&lemma，即原型)的对象的数组
const toExchangeList = (exchange) => {
    if (exchange == '') {
        return []
    }
    console.log(exchange)
    let strList = exchange.split('/')
    let exchangeDict = {}
    let exchangeList = []
    let lemma = ''
    let type_1_exchange = []
    for (let i = 0; i < strList.length; i++) {
        let exchangeType = strList[i].split(':')
        if (exchangeType[0] == '0') {
            lemma = exchangeType[1]
            continue
        }
        if (exchangeType[0] == '1') {
            type_1_exchange = exchangeType
            continue
        }
        exchangeDict[exchangeType[0]] = exchangeType[1]
    }
    if (lemma != '' && type_1_exchange.toString() != '' && type_1_exchange[0] == '1') {
        exchangeList.push({
            word: lemma,
            name: exchangeNameDict[type_1_exchange[1]],
            lemma: true,
        })
    }
    for (let m = 0; m < exchangeTagList.length; m++) {
        if (exchangeDict[exchangeTagList[m]]) {
            exchangeList.push({
                word: exchangeDict[exchangeTagList[m]],
                name: exchangeNameDict[exchangeTagList[m]]
            })
        }
    }
    return exchangeList
}

// 解析原translation字段(字符串)，返回包含pos(词性)和meaning(释义)的对象的数组
const toTransList = (translation) => {
    if (translation == '') {
        return []
    }
    let l = translation.split('\n')
    let transList = []
    for (let i = 0; i < l.length; i++) {
        let spaceIndex = l[i].indexOf(' ') // 找到第一个空格，空格前为词性，空格后为释义
        let pos = ''
        let meaning = l[i]
        if (spaceIndex != -1) {
            pos = l[i].substring(0, spaceIndex)
            meaning = l[i].substring(spaceIndex + 1, l[i].length)
        }
        transList.push({
            pos,
            meaning
        })
    }
    return transList
}

// 生成tagList（词书+牛津+柯林斯）
const getTagList = (wordDetail) => {
    let originTagList = wordDetail.tagList
    let tagList = []
    if (originTagList.length != 0) {
        for (let i = 0; i < originTagList.length; i++) {
            tagList.push(originTagList[i].name)
        }
    }
    if (wordDetail.oxford != 0) {
        tagList.push('牛津3k核心词汇')
    }
    if (wordDetail.collins != 0) {
        tagList.push('柯林斯' + wordDetail.collins + '星')
    }
    return tagList
}

// 用于生成单词音频链接
// 有道词典: http://dict.youdao.com/dictvoice?type={1:英式;2:美式}&audio={word}
// gstatic oxford: https://ssl.gstatic.com/dictionary/static/sounds/oxford/{word}--_gb_1.mp3
const getWordVoiceUrl = (word, source = 0, type = 2) => {
    let globalData = getApp().globalData
    if (globalData.isLogin && globalData.userInfo.settings.type) type = globalData.userInfo.settings.type
    let url = ''
    if (source == 0) {
        url = `http://dict.youdao.com/dictvoice?type=${type}&audio=${word}`
    } else if (source == 1) {
        url = `https://ssl.gstatic.com/dictionary/static/sounds/oxford/${word}--_gb_1.mp3`
    }
    return url
}

// 处理单词信息
const handleWordDetail = (wordDetail, settings = {}) => {
    if (wordDetail.tagList) wordDetail.tag = getTagList(wordDetail)
    if (wordDetail.translation) wordDetail.translation = toTransList(wordDetail.translation)
    if (wordDetail.definition) wordDetail.definition = toTransList(wordDetail.definition)
    if (wordDetail.exchange) wordDetail.exchange = toExchangeList(wordDetail.exchange)
    if ('getShortTrans' in settings && settings.getShortTrans) {
        let transList = JSON.parse(JSON.stringify(wordDetail.translation))
        let shortTransList = transList.slice(0, transList.length > 5 ? 5 : transList.length)
        for (let i = 0; i < shortTransList.length; i++) {
            let str = shortTransList[i].meaning
            if (str.length > 20) {
                let cutIndex = str.lastIndexOf(',', 18)
                if (cutIndex != -1) shortTransList[i].meaning = str.substring(0, cutIndex) + ' ...'
            }
        }
        if (transList.length > 5) {
            shortTransList[4] = {
                pos: '',
                meaning: "更多释义...",
                more: true,
            }
        }
        wordDetail.shortTrans = shortTransList
    }
    if (wordDetail.sample_list) {
        wordDetail.sample_list.push({
            word: wordDetail.word,
            translation: { ...(wordDetail.translation[0]) },
        })
        for (let i = 0; i < wordDetail.sample_list.length; i++) {
            let transItem = wordDetail.sample_list[i].translation
            if (i != wordDetail.sample_list.length - 1) transItem = (toTransList(wordDetail.sample_list[i].translation))[0]
            let meaningStr = transItem.meaning
            if (meaningStr.length > 23) {
                let cutIndex = meaningStr.lastIndexOf(',', 24)
                if (cutIndex != -1) transItem.meaning = meaningStr.substring(0, cutIndex)
            }
            wordDetail.sample_list[i].translation = transItem
        }
    }
    wordDetail.voiceUrl = getWordVoiceUrl(wordDetail.word)
    return wordDetail
}

// 批量处理单词信息
const batchHandleWordDetal = (wordDetailList, settings = {}) => {
    for (let i = 0; i < wordDetailList.length; i++) {
        wordDetailList[i] = handleWordDetail(wordDetailList[i], settings)
    }
    return wordDetailList
}

// 随机生成size个0-max的数
const randNumList = (max, size = 1) => {
    let numList = []
    for (var i = 0; i < size; i++) {
        numList[i] = Math.floor(Math.random() * (max + 1));
        for (var j = 0; j < i; j++) {
            if (numList[i] == numList[j]) {
                i--
            }
        }
    }
    return numList
}

// 打乱数组用
const randArr = (arr) => {
    for (var i = 0; i < arr.length; i++) {
        var iRand = parseInt(arr.length * Math.random())
        var temp = arr[i]
        arr[i] = arr[iRand]
        arr[iRand] = temp
    }
    return arr
}

module.exports = {
    tagDict: tagDict,
    exchangeNameDict: exchangeNameDict,
    toExchangeList: toExchangeList,
    toTransList: toTransList,
    getTagList: getTagList,
    getWordVoiceUrl: getWordVoiceUrl,
    handleWordDetail: handleWordDetail,
    batchHandleWordDetal: batchHandleWordDetal,
    randNumList: randNumList,
    randArr: randArr,
}







// 用于解决释义超长的问题，计算总长度，超过指定长则截断替换为...
// 英文字符长度计1，中文字符长度计2，由于Microsoft Ya Hei(但又比宋体好看)字符不是严格占此宽度，已废弃
const getRectLength = (str) => {
    let rectLength = 0
    for (let i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) <= 127) {
            rectLength += 1
        } else {
            rectLength += 2
        }
    }
    return rectLength
}

const getResObjRectLength = (obj) => {
    let totalLength = 0
    totalLength += getRectLength(obj.word)
    if (obj.exchange && obj.exchange.name) {
        totalLength += getRectLength(' 的' + obj.exchange.name)
    }
    totalLength += getRectLength(obj.translation)
    return totalLength
}