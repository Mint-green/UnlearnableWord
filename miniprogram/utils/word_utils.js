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

const getTagList = (wordDetail) => {
    let originTag = wordDetail.tag
    let tagList = []
    if (originTag != '') {
        let originTagList = originTag.split(' ')
        for (let i = 0; i < originTagList.length; i++) {
            tagList.push(tagDict[originTagList[i]])
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
const getWordVoiceUrl = (word,source=0,type=2) =>{
    let url = ''
    if(source ==0){
        url = `http://dict.youdao.com/dictvoice?type=${type}&audio=${word}`
    }else if( source == 1){
        url = `https://ssl.gstatic.com/dictionary/static/sounds/oxford/${word}--_gb_1.mp3`
    }
    return url
}


module.exports = {
    tagDict: tagDict,
    exchangeNameDict: exchangeNameDict,
    toExchangeList: toExchangeList,
    toTransList: toTransList,
    getTagList: getTagList,
    getWordVoiceUrl: getWordVoiceUrl,
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