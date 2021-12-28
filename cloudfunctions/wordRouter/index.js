// 云函数入口文件
const cloud = require('wx-server-sdk')
const TcbRouter = require('tcb-router') // 导入小程序路由
// const request = require('request')
const format_time = require('utils/format_time.js')
const rescontent = require('utils/response_content.js')
const sm_5_js = require('utils/sm-5.js')
const get_all_sort_list = require('utils/get_all_sort_list.js')
const bent = require('bent')

cloud.init({ env: 'music-cloud-1v7x1' })
const db = cloud.database({ throwOnNotFound: false })
const _ = db.command
const $ = db.command.aggregate

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
    // const wxContext = cloud.getWXContext()
    const app = new TcbRouter({ event })
    console.log(event.$url)

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
            let promise1 = getJSON(requestUrl_youdao)
            let promise2 = getJSON(requestUrl_iciba)
            let promise3 = getJSON(requestUrl_shanbay)
            let tasks = [promise1, promise2, promise3]
            let resList = await Promise.all(tasks)

            // for Youdao--------------------------------------------------------
            let res1 = resList[0]
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
            let res2 = resList[1]
            dailySentence.push({
                source: 'iCIBA',
                content: res2.content,
                translation: res2.note,
                voiceUrl: res2.tts
            })
            // ------------------------------------------------------------------

            // for Shanbay-------------------------------------------------------
            let res3 = resList[2]
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
        let getLemma = event.getLemma
        let skip = event.skip
        if (getLemma === undefined) getLemma = true
        if (skip === undefined) skip = 0
        let recordLimit = (DBtype == 0) ? 20 : 30
        let zhExp = /[\u4e00-\u9fa5]/
        let isTranslation = zhExp.test(keyword)
        keyword = keyword.replace(/-/g, '')
        keyword = keyword.replace(/\'/g, '\\\'')
        keyword = keyword.replace(/\./g, '\\\.')

        try {
            console.log('keyword:', keyword)
            if (!isTranslation && keyword.indexOf(' ') == -1) {
                console.log('don\'t have space')
                // 无空格情况
                // 查找原型
                let lemmaSearch = []
                if (getLemma) {
                    let lemmaRes = await db.collection('lemma')
                        .where({
                            words: _.elemMatch(_.eq(keyword))
                        })
                        .field({
                            _id: false,
                            words: false,
                        })
                        .get()
                    console.log('lemmaRes:', lemmaRes)

                    if (lemmaRes.data.length > 0) {
                        // 若存在原型则获取其释义，首先从将结果转化成原型数组再对数组中的词获取详情
                        let lemmaWords = []
                        for (let i = 0; i < lemmaRes.data.length; i++) {
                            lemmaWords.push(lemmaRes.data[i].stem)
                        }
                        let stemDetailRes = await db.collection('word')
                            .where({
                                word: _.in(lemmaWords)
                            })
                            .field({
                                _id: false,
                                word: true,
                                word_id: true,
                                exchange: true,
                                translation: true,
                            })
                            .get()
                        if (stemDetailRes.data.length != lemmaWords.length) {
                            stemDetailRes = await db.collection('word_all')
                                .where({
                                    word: _.in(lemmaWords)
                                })
                                .field({
                                    _id: false,
                                    word: true,
                                    word_id: true,
                                    exchange: true,
                                    translation: true,
                                })
                                .get()
                        }
                        lemmaSearch = stemDetailRes.data
                    }
                    console.log('lemmaSearch:', lemmaSearch)
                }
                // 使用sw字段进行前缀模糊查找
                let exp = new RegExp('^' + keyword + '.*', 'i')
                // console.log('exp:', exp)
                let prefixRes = await db.collection(DBname)
                    .where({
                        strip_word: exp,
                    })
                    .skip(skip)
                    .limit(recordLimit)
                    .field({
                        _id: false,
                        word: true,
                        word_id: true,
                        translation: true,
                    })
                    .get()
                console.log('prefixRes.data', prefixRes.data)

                ctx.body = {
                    ...rescontent.SUCCESS,
                    data: {
                        lemmaSearch,
                        directSearch: prefixRes.data
                    }
                }
            } else if (!isTranslation) {
                // 有空格情况，不进行原型查找，将空格换为任意位数通配符进行匹配
                // 获取由空格分割的每个部分的索引并求和
                let kwSpiltBySpace = keyword.split(' ')
                keyword = keyword.replace(/ /g, '.*')
                let exp = new RegExp('^.*' + keyword, 'mi')
                let indexSumList = []
                let accLen = 0
                for (let i = 0; i < kwSpiltBySpace.length; i++) {   // 进行求索引表达式的数组的构造，为求和做准备
                    if (kwSpiltBySpace[i] == '') continue
                    if (i > 0) accLen += kwSpiltBySpace[i - 1].length
                    indexSumList.push($.indexOfCP(['$word', kwSpiltBySpace[i], accLen]))
                    // console.log('$.indexOfCP([\'$word\',', kwSpiltBySpace[i], ',', accLen, '])', $.indexOfCP(['$word', kwSpiltBySpace[i], accLen]))
                }
                // console.log('indexSumList:', indexSumList)
                let res = await db.collection(DBname).aggregate()
                    .match({
                        word: exp,
                    })
                    .project({
                        _id: false,
                        word: true,
                        word_id: true,
                        translation: true,
                        // indexsum: $.sum([$.indexOfCP(['$word', 's', 2]), $.indexOfCP(['$word', 't', 3])])
                        indexSum: $.sum(indexSumList)
                    })
                    .sort({
                        indexSum: 1,
                        word_id: 1
                    })
                    .skip(skip)
                    .limit(recordLimit)
                    .project({
                        indexSum: false,
                    })
                    .end()
                console.log('res.list', res.list)

                ctx.body = {
                    ...rescontent.SUCCESS, data: {
                        lemmaSearch: [],
                        directSearch: res.list
                    }
                }
            } else {
                // 中文的情况，直接按照有空格处理
                // 将空格换为任意位数通配符进行匹配,同时允许空格切分的中文前后顺序不同
                // 获取由空格分割的每个部分的第一个次出现位置索引并求和
                let kwSpiltBySpace = keyword.split(' ')
                kwSpiltBySpace = kwSpiltBySpace.filter(subStr => subStr.length > 0)

                // 因为释义关键词前后顺序不定，故生成所有排列组合并构造正则表达式
                let kwSpiltBySpaceAllList = get_all_sort_list.getAllSortList(kwSpiltBySpace.concat(), kwSpiltBySpace.length, true)
                let expList = []
                for (let k = 0; k < kwSpiltBySpaceAllList.length; k++) {
                    let expStr = '.*' + kwSpiltBySpaceAllList[k].join('.*') + '.*'
                    let exp = new RegExp(expStr, 'mi')
                    expList.push(exp)
                }

                // 动态生成 各部分出现次数求和 以及 第一次出现位置的索引的和 的待求和数组
                let numSumList = []
                let indexSumList = []
                for (let i = 0; i < kwSpiltBySpace.length; i++) {
                    if (kwSpiltBySpace[i] == '') continue
                    numSumList.push($.subtract([$.size($.split(['$translation', kwSpiltBySpace[i]])), 1]))
                    indexSumList.push($.indexOfCP(['$translation', kwSpiltBySpace[i]]))
                }

                let res = await db.collection(DBname)
                    .aggregate()
                    .match({
                        // translation: _.or([/.*棒.*球.*/, /.*球.*棒.*/]),
                        translation: _.or(expList),
                    })
                    .project({
                        _id: false,
                        word: true,
                        word_id: true,
                        translation: true,
                        // numSum: $.sum([$.size($.split(['$translation', '棒'])), $.size($.split(['$translation', '球']))]),
                        // indexSum: $.sum([$.indexOfCP(['$translation', '棒']), $.split(['$translation', '球'])])
                        numSum: $.sum(numSumList),
                        indexSum: $.sum(indexSumList),
                    })
                    .sort({
                        numSum: -1,
                        indexSum: 1,
                        word_id: 1
                    })
                    .skip(skip)
                    .limit(recordLimit)
                    .project({
                        indexSum: 0,
                        numSum: 0,
                    })
                    .end()
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
        let user_id = event.user_id
        let DBname = (word_id > 29999) ? 'word_all' : 'word'

        try {
            let res = await db.collection(DBname)
                .aggregate()
                .match({
                    word_id
                })
                .lookup({   // lookup-1，查找该单词是否在对应用户的生词本中
                    from: 'notebook',
                    let: {
                        wordId: '$word_id',
                    },
                    pipeline: $.pipeline()
                        .match(_.expr($.and([
                            $.eq(['$user_id', user_id]),
                            $.eq(['$word_id', '$$wordId']),
                        ])))
                        .done(),
                    as: 'in_notebook'
                })
                .lookup({   // lookup-1，查找该词的所有tag及tag名字
                    from: 'word_in_book',
                    let: {
                        wd_id: '$word_id'
                    },
                    pipeline: $.pipeline()  // 一级lookup，查找该词的所有tag
                        .match(_.expr($.eq(['$word_id', '$$wd_id'])))
                        .project({
                            _id: 0,
                            wd_bk_id: 1
                        })
                        .lookup({   // 二级lookup，查找每个tag的对应名字
                            from: 'word_book',
                            localField: 'wd_bk_id',
                            foreignField: 'wd_bk_id',
                            as: 'book'
                        })
                        .replaceRoot({
                            newRoot: $.mergeObjects([$.arrayElemAt(['$book', 0]), '$$ROOT'])
                        })
                        .project({
                            _id: 0,
                            wd_bk_id: 1,
                            tag: 1,
                            name: 1
                        })
                        .done(),
                    as: 'tagList',
                })
                .project({
                    _id: 0,
                    strip_word: 0,
                })
                .end()
            console.log(res)
            if (res.list[0].in_notebook.length > 0) {
                res.list[0].in_notebook = true
            } else {
                res.list[0].in_notebook = false
            }
            if (res.list.length != 1) {
                ctx.body = { ...rescontent.DATAERR }
            } else {
                ctx.body = { ...rescontent.SUCCESS, data: res.list[0] }
            }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('getBasicLearningData', async (ctx, next) => {
        let user_id = event.user_id
        let wd_bk_id = event.wd_bk_id
        // console.log(event)

        try {
            // 获取未学数量（此方案较慢，通过两个同步执行的查询替换，已废弃）
            // let needToLearnRes = db.collection('word_in_book')
            //     .aggregate()
            //     .match({    // 从词书与单词的关系表里获取当前学习的书的所有单词
            //         wd_bk_id: wd_bk_id
            //     })
            //     .lookup({   // lookup-1，从学习记录中匹配学过的单词
            //         from: 'learning_record',
            //         let: {
            //             wordId: '$word_id',
            //         },
            //         pipeline: $.pipeline()
            //             .match(_.expr($.and([
            //                 $.eq(['$user_id', user_id]),
            //                 $.eq(['$word_id', '$$wordId']),
            //             ])))
            //             .done(),
            //         as: 'word_list'
            //     })
            //     .match(_.expr(  // 删去已经学过的单词（之前的lookup未匹配到说明没有学过）
            //         $.eq([$.size('$word_list'), 0]),
            //     ))
            //     // .project({
            //     //     _id: 1
            //     // })
            //     .count('numToLearn')
            //     .end()
            // console.log('needToLearnRes', needToLearnRes)
            // {list:[{needTolearn:xxx}]}

            let learnedNumRes = db.collection('learning_record')
                .aggregate()
                .match({    // 从词书与单词的关系表里获取当前学习的书的所有单词
                    user_id: user_id,
                })
                .lookup({   // lookup-1，从学习记录中匹配学过的单词
                    from: 'word_in_book',
                    let: {
                        wordId: '$word_id',
                    },
                    pipeline: $.pipeline()
                        .match(_.expr($.and([
                            $.eq(['$wd_bk_id', wd_bk_id]),
                            $.eq(['$word_id', '$$wordId']),
                        ])))
                        .done(),
                    as: 'word_list'
                })
                .match(_.expr(  // 删去已经学过的单词（之前的lookup未匹配到说明没有学过）
                    $.eq([$.size('$word_list'), 1]),
                ))
                .count('learned')
                .end()
            // {list:[{learned:xxx}]}

            let totalnumRes = db.collection('word_in_book')
                .aggregate()
                .match({
                    wd_bk_id: wd_bk_id
                })
                .count('total')
                .end()
            // {list:[{total:xxx}]}

            let timeStamp = new Date().getTime()
            let needToReviewRes = db.collection('learning_record')
                // .where({    // 选取复习时间不晚于今天的所有记录
                //     user_id: user_id,
                //     master: false,
                //     next_l: _.lte(timeStamp),
                // })
                // .count()
                .aggregate()
                .match({    // 选取复习时间不晚于今天的所有记录
                    user_id: user_id,
                    master: false,
                    next_l: _.lte(timeStamp),
                })
                .count('numToReview')
                .end()
            // console.log('needToReviewRes', needToReviewRes)
            // {list:[{numToReview:xxx}]}

            // let resList = [needToLearnRes, needToReviewRes]
            let resList = await Promise.all([learnedNumRes, totalnumRes, needToReviewRes])
            // console.log(resList)
            let total = 0
            let learned = 0
            let numToReview = 0
            if (resList[1].list.length > 0 && resList[1].list[0].total >= 0) total = resList[1].list[0].total
            if (resList[0].list.length > 0 && resList[0].list[0].learned >= 0) learned = resList[0].list[0].learned
            if (resList[2].list.length > 0 && resList[2].list[0].numToReview >= 0) numToReview = resList[2].list[0].numToReview
            let nums = {
                needToLearn: total - learned,
                needToReview: numToReview,
                // needToReview: resList[1].total,
            }
            ctx.body = { ...rescontent.SUCCESS, data: nums }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('getLearningData', async (ctx, next) => {
        const wd_bk_id = event.wd_bk_id
        const user_id = event.user_id
        let groupSize = event.groupSize
        const getSize = Math.round(groupSize * 1.5)
        const batchTimes = Math.ceil(getSize / 10)
        const sampleSize = event.sample ? 9 : 0

        try {
            let tasks = []
            for (let i = 0; i < batchTimes; i++) {
                let num = i * 10 + 10 > getSize ? getSize - (i * 10) : 10
                let promise = db.collection('word_in_book')
                    .aggregate()
                    .match({    // 从词书与单词的关系表里获取当前学习的书的所有单词
                        wd_bk_id: wd_bk_id
                    })
                    .sort({
                        wd_index: 1,
                    })
                    .lookup({   // lookup-1，从学习记录中匹配学过的单词
                        from: 'learning_record',
                        let: {
                            wordId: '$word_id',
                        },
                        pipeline: $.pipeline()
                            .match(_.expr($.and([
                                $.eq(['$user_id', user_id]),
                                $.eq(['$word_id', '$$wordId']),
                            ])))
                            .done(),
                        as: 'word_list'
                    })
                    .match(_.expr(  // 删去已经学过的单词（之前的lookup未匹配到说明没有学过）
                        $.eq([$.size('$word_list'), 0]),
                    ))
                    .project({
                        _id: 0,
                        word_list: 0,
                    })
                    .skip(i * 10)
                    .limit(num)
                    .lookup({   // lookup-2，查找获取取得的单词是否在对应用户的生词本中
                        from: 'notebook',
                        let: {
                            wordId: '$word_id',
                        },
                        pipeline: $.pipeline()
                            .match(_.expr($.and([
                                $.eq(['$user_id', user_id]),
                                $.eq(['$word_id', '$$wordId']),
                            ])))
                            .done(),
                        as: 'nb_record'
                    })
                    .lookup({   // lookup-3，查找获取取得的单词是否有学习过的“缓存”
                        from: 'learning_record_temp',
                        let: {
                            wordId: '$word_id',
                        },
                        pipeline: $.pipeline()
                            .match(_.expr($.and([
                                $.eq(['$user_id', user_id]),
                                $.eq(['$word_id', '$$wordId']),
                            ])))
                            .done(),
                        as: 'l_r_temp_list'
                    })
                    .lookup({   // lookup-4，获取取得的单词的详细数据
                        from: 'word',
                        localField: 'word_id',
                        foreignField: 'word_id',
                        as: 'word_list'
                    })
                    .replaceRoot({  // 把单词详情合并到对象属性中
                        newRoot: $.mergeObjects([$.arrayElemAt(['$word_list', 0]), '$$ROOT'])
                    })
                    .project({
                        _id: 0,
                        word_id: 1,
                        word: 1,
                        translation: 1,
                        phonetic: 1,
                        in_notebook: $.gte([$.size('$nb_record'), 1]),
                        learning_record: $.arrayElemAt(['$l_r_temp_list', 0])
                    })
                    .lookup({   // lookup-5 在同一本词书中为每个单词随机取9个词做释义干扰项
                        from: 'word_in_book',
                        let: {
                            wordId: '$word_id',
                        },
                        pipeline: $.pipeline()  // 一级lookup，筛选同本词书且word_id不同的词
                            .match({
                                wd_bk_id: wd_bk_id,
                                word_id: _.neq('$$wordId'),
                            })
                            .sample({ // 随机取出9个单词（做干扰项）
                                size: sampleSize
                            })
                            .lookup({   // 二级lookup，为取出的单词查找单词详细信息
                                from: 'word',
                                localField: 'word_id',
                                foreignField: 'word_id',
                                as: 'word_list',
                            })
                            .replaceRoot({  // 把单词详情合并到samplelist每个成员的对象属性中
                                newRoot: $.mergeObjects([$.arrayElemAt(['$word_list', 0]), '$$ROOT'])
                            })
                            .project({
                                _id: 0,
                                word_id: 1,
                                word: 1,
                                translation: 1,
                            })
                            .done(),
                        as: 'sample_list'
                    })
                    .end()
                tasks.push(promise)
            }

            // 等所有批次返回结果后处理
            let res = (await Promise.all(tasks)).reduce((acc, currentValue, index) => {
                // console.log(acc)
                acc.data = acc.data.concat(currentValue.list)
                let wordIdList = []
                for (let m = 0; m < currentValue.list.length; m++) {
                    if (currentValue.list[m].learning_record) {
                        wordIdList.push(currentValue.list[m].word_id)
                    }
                }
                acc.wordIdList = acc.wordIdList.concat(wordIdList)
                // console.log(currentValue)
                return acc
            }, { data: [], wordIdList: [] })


            // 删除取出来的临时记录
            if (res.wordIdList.length > 0) {
                let res1 = await db.collection('learning_record_temp')
                    .where({
                        user_id,
                        word_id: _.in(res.wordIdList)
                    })
                    .remove()
                console.log('remove list', res.wordIdList, ' for user', user_id)
                console.log(res1)
            }
            ctx.body = { ...rescontent.SUCCESS, data: res.data }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('getReviewData', async (ctx, next) => {
        const wd_bk_id = event.wd_bk_id
        const user_id = event.user_id
        let groupSize = event.groupSize
        const batchTimes = Math.ceil(groupSize / 10)
        const sampleSize = event.sample ? 9 : 0

        try {
            let tasks = []
            let timeStamp = new Date().getTime()
            for (let i = 0; i < batchTimes; i++) {
                let num = i * 10 + 10 > groupSize ? groupSize - (i * 10) : 10
                let promise = db.collection('learning_record')
                    .aggregate()
                    .match({    // 选取复习时间不晚于今天的所有记录
                        user_id: user_id,
                        master: false,
                        next_l: _.lte(timeStamp),
                    })
                    .sort({
                        next_l: 1,
                    })
                    .skip(i * 10)
                    .limit(num)
                    .lookup({   // lookup-1，查找获取取得的单词是否在对应用户的生词本中
                        from: 'notebook',
                        let: {
                            wordId: '$word_id',
                        },
                        pipeline: $.pipeline()
                            .match(_.expr($.and([
                                $.eq(['$user_id', user_id]),
                                $.eq(['$word_id', '$$wordId']),
                            ])))
                            .done(),
                        as: 'nb_record'
                    })
                    .lookup({   // lookup-2，获取取得的单词的详细数据
                        from: 'word',
                        localField: 'word_id',
                        foreignField: 'word_id',
                        as: 'word_list'
                    })
                    .replaceRoot({  // 把单词详情合并到对象属性中
                        newRoot: $.mergeObjects([$.arrayElemAt(['$word_list', 0]), '$$ROOT'])
                    })
                    .addFields({
                        in_notebook: $.eq([$.size('$nb_record'), 1]),
                        record: {
                            EF: '$EF',
                            NOI: '$NOI',
                            last_l: '$last_l',
                            next_l: '$next_l',
                            master: '$master',
                            word_id: '$word_id',
                            next_n: '$next_n',
                        },
                    })
                    .project({
                        _id: 0,
                        word_id: 1,
                        word: 1,
                        translation: 1,
                        phonetic: 1,
                        in_notebook: 1,
                        record: 1
                    })
                    .lookup({   // lookup-3 在同一本词书中为每个单词随机取9个词做释义干扰项
                        from: 'word_in_book',
                        let: {
                            wordId: '$word_id',
                        },
                        pipeline: $.pipeline()  // 一级lookup，筛选同本词书且word_id不同的词
                            .match({
                                wd_bk_id: wd_bk_id,
                                word_id: _.neq('$$wordId'),
                            })
                            .sample({ // 随机取出9个单词（做干扰项）
                                size: sampleSize
                            })
                            .lookup({   // 二级lookup，为取出的单词查找单词详细信息
                                from: 'word',
                                localField: 'word_id',
                                foreignField: 'word_id',
                                as: 'word_list',
                            })
                            .replaceRoot({  // 把单词详情合并到samplelist每个成员的对象属性中
                                newRoot: $.mergeObjects([$.arrayElemAt(['$word_list', 0]), '$$ROOT'])
                            })
                            .project({
                                _id: 0,
                                word_id: 1,
                                word: 1,
                                translation: 1,
                            })
                            .done(),
                        as: 'sample_list'
                    })
                    .end()
                tasks.push(promise)
            }

            // 等所有批次返回结果后处理
            let res = (await Promise.all(tasks)).reduce((acc, currentValue, index) => {
                // console.log(acc)
                acc = acc.concat(currentValue.list)
                // console.log(currentValue)
                return acc
            }, [])

            ctx.body = { ...rescontent.SUCCESS, data: res }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('toggleAddToNB', async (ctx, next) => {
        const user_id = event.user_id
        const word_id = event.word_id

        try {
            let res = undefined
            if (event.add) {
                res = await db.collection('notebook')
                    .add({
                        data: {
                            user_id,
                            word_id,
                            c_time: new Date().getTime()
                        }
                    })
                console.log(res)
            } else {
                res = await db.collection('notebook')
                    .where({
                        user_id,
                        word_id,
                    })
                    .remove()
                console.log(res)
            }
            let correctMsg = event.add ? "collection.add:ok" : "collection.remove:ok"
            if (res.errMsg == correctMsg) {
                ctx.body = { ...rescontent.SUCCESS, data: true }
            } else {
                ctx.body = { ...rescontent.DBERR, data: false, err: res }
            }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('addLearningRecord', async (ctx, next) => {
        const user_id = event.user_id
        let wordLearningRecord = event.learnedRecord
        let learningRecord = event.learningRecord
        const batchTimesForLearned = Math.ceil(wordLearningRecord.length / 10)
        let batchTimesForLearning = 0
        if (learningRecord) batchTimesForLearning = Math.ceil(learningRecord.length / 10)
        let now = new Date()
        now.setMilliseconds(0)
        now.setSeconds(0)
        now.setMinutes(0)
        now.setHours(0)
        let last_l = now.getTime()
        let next_l = last_l + 86400000

        // 检查属性，means允许自定义
        for (let i = 0; i < wordLearningRecord.length; i++) {
            if (wordLearningRecord[i].last_l === undefined) wordLearningRecord[i].last_l = last_l
            if (wordLearningRecord[i].next_l === undefined) wordLearningRecord[i].next_l = next_l
            if (wordLearningRecord[i].NOI === undefined) wordLearningRecord[i].NOI = 1
            if (wordLearningRecord[i].EF === undefined) wordLearningRecord[i].EF = '2.5'
            if (wordLearningRecord[i].next_n === undefined) wordLearningRecord[i].next_n = 0
            if (wordLearningRecord[i].master === undefined) wordLearningRecord[i].master = false
            if (wordLearningRecord[i].c_time === undefined) wordLearningRecord[i].c_time = last_l
        }
        console.log(wordLearningRecord)

        try {
            // 将完成学习的单词加入学习记录数据库(learning_record)
            let learnedRes = []
            for (let i = 0; i < batchTimesForLearned; i++) {
                // 承载所有读操作的 promise 的数组
                let tasks = []
                let start = i * 10
                let end = ((start + 10) > wordLearningRecord.length) ? wordLearningRecord.length : (start + 10)
                // 等待所有
                for (let j = start; j < end; j++) {
                    wordLearningRecord[j].user_id = user_id
                    let promise = db.collection('learning_record')
                        .add({
                            data: wordLearningRecord[j]
                        })
                    tasks.push(promise)
                }
                let resInner = (await Promise.all(tasks)).reduce((acc, currentValue, index) => {
                    acc[index] = currentValue._id
                    // console.log(cur._id)
                    return acc
                }, [])
                console.log('learned record batch', i, 'done')
                console.log('learned record batch', i, ':', resInner)
                learnedRes = learnedRes.concat(resInner)
            }

            // 下面更新daily_sum对应数据
            let addNum = 0
            for (let k = 0; k < learnedRes.length; k++) {
                if (learnedRes[k] && learnedRes[k] != '') addNum++
            }
            let updateDailySumRes = await db.collection('daily_sum')
                .where({
                    user_id,
                    date: last_l,
                })
                .update({
                    data: {
                        learn: _.inc(addNum)
                    }
                })
            if (updateDailySumRes.stats.updated != 1) {
                let createDailySumRes = await db.collection('daily_sum')
                    .add({
                        data: {
                            user_id,
                            date: last_l,
                            learn: addNum,
                            review: 0,
                            l_time: 0,
                        }
                    })
                if (createDailySumRes._id && createDailySumRes._id != '') {
                    console.log('createDailySumRes for user', user_id, 'successfully')
                }
            }

            // 将完成学习的单词加入临时记录的数据库(learning_record)
            let tempRes = []
            if (batchTimesForLearning > 0) {
                for (let m = 0; m < batchTimesForLearning; m++) {
                    // 承载所有读操作的 promise 的数组
                    let tasks = []
                    let start = m * 10
                    let end = ((start + 10) > learningRecord.length) ? learningRecord.length : (start + 10)
                    // 等待所有
                    for (let n = start; n < end; n++) {
                        learningRecord[n].user_id = user_id
                        let promise = db.collection('learning_record_temp')
                            .add({
                                data: learningRecord[n]
                            })
                        tasks.push(promise)
                    }
                    let resInner = (await Promise.all(tasks)).reduce((acc, currentValue, index) => {
                        acc[index] = currentValue._id
                        // console.log(cur._id)
                        return acc
                    }, [])
                    console.log('learning recordbatch', m, 'done')
                    console.log('learning recordbatch', m, ':', resInner)
                    tempRes = tempRes.concat(resInner)
                }
            }

            ctx.body = { ...rescontent.SUCCESS, data: { learnedRes, tempRes } }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('updateLearningRecord', async (ctx, next) => {
        const user_id = event.user_id
        const wordLearningRecord = event.wordLearningRecord
        const batchTimes = Math.ceil(wordLearningRecord.length / 10)

        try {
            // 先获取用户的OF矩阵
            let userRes = await db.collection('learner')
                .where({
                    user_id
                })
                .field({
                    of_matrix: true,
                })
                .get()
            console.log('userRes', userRes)
            let of_matrix = userRes.data[0].of_matrix
            // console.log(of_matrix)

            let res = []
            let updateNum = 0
            for (let i = 0; i < batchTimes; i++) {
                // 承载所有读操作的 promise 的数组
                let tasks = []
                let start = i * 10
                let end = ((start + 10) > wordLearningRecord.length) ? wordLearningRecord.length : (start + 10)
                // 等待所有
                for (let j = start; j < end; j++) {
                    let result = sm_5_js.sm_5(of_matrix, wordLearningRecord[j])
                    let record = result.wd_learning_record
                    wordLearningRecord[j].newNOI = record.NOI
                    wordLearningRecord[j].newMaster = record.master
                    of_matrix = result.OF
                    record.user_id = user_id
                    let promise = db.collection('learning_record')
                        .where({
                            user_id,
                            word_id: wordLearningRecord[j].word_id
                        })
                        .update({
                            data: record
                        })
                    tasks.push(promise)
                }

                // 更新of_矩阵
                let updateUserPromiseIndex = -1
                if (i == batchTimes - 1) {
                    let updateUserPromise = db.collection('learner')
                        .where({
                            user_id
                        })
                        .update({
                            data: {
                                of_matrix: _.set(of_matrix)
                            }
                        })
                    tasks.push(updateUserPromise)
                    updateUserPromiseIndex = tasks.length - 1
                }

                let resInner = (await Promise.all(tasks)).reduce((acc, currentValue, index) => {
                    if (updateUserPromiseIndex != -1 && index == updateUserPromiseIndex) {
                        console.log('update of_matrix result', currentValue)
                    } else if (currentValue.stats.updated > 0) {
                        acc[index] = {
                            word_id: wordLearningRecord[index].word_id,
                            NOI: wordLearningRecord[index].newNOI,
                            master: wordLearningRecord[index].newMaster,
                            updated: currentValue.stats.updated,
                            success: true,
                        }
                        updateNum++
                    } else {
                        acc[index] = {
                            word_id: wordLearningRecord[index].word_id,
                            updated: currentValue.stats.updated,
                            success: false,
                        }
                    }
                    return acc
                }, [])
                console.log('batch', i, 'done')
                console.log('batch', i, ':', resInner)
                res = res.concat(resInner)
            }

            // 下面更新daily_sum对应数据
            let now = new Date()
            now.setMilliseconds(0)
            now.setSeconds(0)
            now.setMinutes(0)
            now.setHours(0)
            let date = now.getTime()
            let updateDailySumRes = await db.collection('daily_sum')
                .where({
                    user_id,
                    date,
                })
                .update({
                    data: {
                        review: _.inc(updateNum)
                    }
                })
            if (updateDailySumRes.stats.updated != 1) {
                let createDailySumRes = await db.collection('daily_sum')
                    .add({
                        data: {
                            user_id,
                            date,
                            learn: 0,
                            review: updateNum,
                            l_time: 0,
                        }
                    })
                if (createDailySumRes._id && createDailySumRes._id != '') {
                    console.log('createDailySumRes for user', user_id, 'successfully')
                }
            }
            ctx.body = { ...rescontent.SUCCESS, data: res }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    return app.serve()
}