// 云函数入口文件
const cloud = require('wx-server-sdk')
const TcbRouter = require('tcb-router') // 导入小程序路由
// const request = require('request')
const format_time = require('utils/format_time.js')
const rescontent = require('utils/response_content.js')
const bent = require('bent')
const { async } = require('../../miniprogram/lib/runtime/runtime')
cloud.init()
const db = cloud.database({ throwOnNotFound: false })
const _ = db.command
const $ = db.command.aggregate

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
    // const wxContext = cloud.getWXContext()
    const app = new TcbRouter({ event })

    app.router('getDailySentence', async (ctx, next) => {
        let time = new Date().getTime()
        console.log(time)
        let dateStr = format_time.formatDate(time)
        console.log(dateStr)
        // let requestUrl = [requestUrl_youdao, requestUrl_iciba, requestUrl_shanbay]
        // console.log(requestUrl)

        try {
            let dailySentenceDB = db.collection('dailySentence')
            let res = await dailySentenceDB.where({
                date: dateStr
            }).get()
            if (res.data.toString() != "") {
                ctx.body = { ...rescontent.SUCCESS, data: res.data[0].dailySentence }
                return
            }
            console.log("Can't find", new Date().getTime())

            const getJSON = bent('json')
            let requestUrl_youdao = 'https://dict.youdao.com/infoline?mode=publish&date=' + dateStr + '&update=auto&apiversion=5.0'
            let requestUrl_iciba = 'https://sentence.iciba.com/index.php?c=dailysentence&m=getdetail&title=' + dateStr
            let requestUrl_shanbay = 'https://apiv3.shanbay.com/weapps/dailyquote/quote/?date=' + dateStr
            let dailySentence = []
            // for Youdao--------------------------------------------------------
            let res1 = await getJSON(requestUrl_youdao)
            let result_list = res1[dateStr]
            let dateNum = format_time.dateNum(time) * 10000
            let i = 0
            for (i; i < result_list.length; i++) {
                if (result_list[i].startTime - dateNum < 10000 && result_list[i].voice && result_list[i].voice != '') { break }
            }
            // console.log('Youdao sentence', result_list[i])
            dailySentence.push({
                source: 'Youdao',
                content: result_list[i].title,
                translation: result_list[i].summary,
                voiceUrl: result_list[i].voice
            })
            // ------------------------------------------------------------------

            // for iCIBA---------------------------------------------------------
            let res2 = await getJSON(requestUrl_iciba)
            dailySentence.push({
                source: 'iCIBA',
                content: res2.content,
                translation: res2.note,
                voiceUrl: res2.tts
            })
            // ------------------------------------------------------------------

            // for Shanbay-------------------------------------------------------
            let res3 = await getJSON(requestUrl_shanbay)
            dailySentence.push({
                source: 'Shanbay',
                content: res3.content,
                translation: res3.translation,
                author: res3.author
            })
            // ------------------------------------------------------------------

            console.log("request done", new Date().getTime())
            console.log(dailySentence)
            let t1 = new Date().toISOString()
            let res4 = await dailySentenceDB.add({
                data: {
                    date: dateStr,
                    c_time: t1,
                    dailySentence
                }
            })
            // if (!res4._id) { // 获取即可，添加失败可让下一位有缘人请求的时候顺便添加
            //     ctx.body = { ...rescontent.DBERR }
            //     return
            // }
            console.log('Recording successfully, done.', new Date().getTime())

            ctx.body = { ...rescontent.SUCCESS, data: dailySentence }
        } catch (e) {
            console.log(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }

    })

    app.router('getSearchResult', async (ctx, next) => {
        let keyword = event.keyword
        let DBtype = event.DBtype
        let DBname = (DBtype == 0) ? 'word' : 'word_all'
        let recordLimit = (DBtype == 0) ? 15 : 20

        try {
            console.log('keyword:', keyword)
            if (keyword.indexOf(' ') == -1) {
                console.log('don\'t have space')
                // 无空格情况
                // 查找原型
                let lemmaRes = await db.collection('lemma').where({
                    words: _.elemMatch(_.eq(keyword))
                }).field({
                    _id: false,
                    words: false,
                }).get()
                console.log('lemmaRes:', lemmaRes)
                let lemmaSearch = []
                if (lemmaRes.data.length == 0) {
                    lemmaSearch = []
                } else {
                    let lemmaWords = []
                    for (let i = 0; i < lemmaRes.data.length; i++) {
                        lemmaWords.push(lemmaRes.data[i].stem)
                    }
                    let stemDetailRes = await db.collection('word').where({
                        word: _.in(lemmaWords)
                    }).field({
                        _id: false,
                        word: true,
                        word_id: true,
                        exchange: true,
                        translation: true,
                    }).get()
                    if (stemDetailRes.data.length != lemmaWords.length) {
                        stemDetailRes = await db.collection('word_all').where({
                            word: _.in(lemmaWords)
                        }).field({
                            _id: false,
                            word: true,
                            word_id: true,
                            exchange: true,
                            translation: true,
                        }).get()
                    }
                    lemmaSearch = stemDetailRes.data
                }
                console.log('lemmaSearch:', lemmaSearch)

                // 使用sw字段进行前缀模糊查找
                let exp = new RegExp('^' + keyword + '.*', 'i')
                // console.log('exp:', exp)
                let prefixRes = await db.collection(DBname).where({
                    strip_word: exp,
                }).limit(recordLimit).field({
                    _id: false,
                    word: true,
                    word_id: true,
                    translation: true,
                }).get()
                console.log('prefixRes.data', prefixRes.data)

                ctx.body = {
                    ...rescontent.SUCCESS, data: {
                        lemmaSearch,
                        directSearch: prefixRes.data
                    }
                }
            } else {
                // 有空格情况，不进行原型查找，将空格换位任意位数通配符进行匹配
                // 获取由空格分割的每个部分的索引并求和
                let kwSpiltBySpace = keyword.split(' ')
                keyword = keyword.replace(/ /g, '.*')
                let exp = new RegExp('^' + keyword, 'i')
                let indexSumList = []
                let accLen = 0
                for (let i = 1; i < kwSpiltBySpace.length; i++) {   // 进行求索引表达式的数组的构造，为求和做准备
                    accLen += kwSpiltBySpace[i - 1].length
                    indexSumList.push($.indexOfCP(['$word', kwSpiltBySpace[i], accLen]))
                    // console.log('$.indexOfCP([\'$word\',', kwSpiltBySpace[i], ',', accLen, '])', $.indexOfCP(['$word', kwSpiltBySpace[i], accLen]))
                }
                // console.log('indexSumList:', indexSumList)
                let res = await db.collection(DBname).aggregate().match({
                    word: exp,
                }).project({
                    _id: false,
                    word: true,
                    word_id: true,
                    translation: true,
                    // indexsum: $.sum([$.indexOfCP(['$word', 's', 2]), $.indexOfCP(['$word', 't', 3])])
                    indexSum: $.sum(indexSumList)
                }).sort({
                    indexSum: 1,
                    word_id: 1
                }).limit(recordLimit).project({ indexSum: false, }).end()
                console.log('res.list', res.list)

                ctx.body = {
                    ...rescontent.SUCCESS, data: {
                        lemmaSearch: [],
                        directSearch: res.list
                    }
                }
            }

        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('getwordDetail', async (ctx, next) => {
        let word_id = event.word_id
        let DBname = (word_id > 19357) ? 'word_all' : 'word'

        try {
            let res = await db.collection(DBname).where({
                word_id
            }).field({
                _id: false,
                strip_word: false,
            }).get()
            console.log(res)
            if (res.data.length != 1) {
                ctx.body = { ...rescontent.DATAERR }
            } else {
                ctx.body = { ...rescontent.SUCCESS, data: res.data[0] }
            }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    // app.router('getBasicData', async(ctx, next)=>{
    //     let user_id = event.user_id
    //     let l_book_id = event.l_book_id

    //     // 获取未学数量
    //     let needTolearn = await db.collection('word')
    // })

    return app.serve()
}