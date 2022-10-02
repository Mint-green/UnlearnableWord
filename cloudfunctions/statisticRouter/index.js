// 云函数入口文件
const cloud = require('wx-server-sdk')
const TcbRouter = require('tcb-router') // 导入小程序路由

const rescontent = require('utils/response_content.js')

cloud.init({ env: 'music-cloud-1v7x1' })  // 此处请切换为你自己的小程序云环境 id
const db = cloud.database({ throwOnNotFound: false })
const _ = db.command
const $ = db.command.aggregate


// 云函数入口函数
exports.main = async (event, context) => {
    // const wxContext = cloud.getWXContext()
    const app = new TcbRouter({ event })
    console.log(event.$url)

    app.use(async (ctx, next) => {
        console.log('router name:', event.$url)
        await next() // 执行下一中间件
    });

    app.router('getWBLearnData', async (ctx, next) => {
        let user_id = event.user_id
        let wd_bk_id = event.wd_bk_id

        try {
            // 某书的学习情况（区分未学习、学习中、已掌握）(原方案耗时较长，使用两个同步查询替换)
            // let res = await db.collection('word_in_book')
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
            //     .replaceRoot({
            //         newRoot: $.mergeObjects([$.arrayElemAt(['$word_list', 0]), '$$ROOT'])
            //     })
            //     .group({
            //         _id: {
            //             list_size: $.size('$word_list'),
            //             is_master: '$master'
            //         },
            //         num: $.sum(1)
            //     })
            //     .end()

            let learnedRes = db.collection('learning_record')
                .aggregate()
                .match({    // 从学习记录中筛选当前用户学过的所有单词
                    user_id: user_id,
                })
                .lookup({   // lookup-1，从词书词表中匹配在所学词书中的单词
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
                .match(_.expr(  // 匹配已经学过的单词
                    $.eq([$.size('$word_list'), 1]),
                ))
                .group({    // 根据是否掌握分类并计数
                    _id: '$master',
                    num: $.sum(1)
                })
                .end()
            // {list:[{_id:true, num:xxx}, {_id:false, num:xxx}]}

            let totalRes = db.collection('word_in_book')
                .aggregate()
                .match({
                    wd_bk_id: wd_bk_id
                })
                .count('total')
                .end()
            // {list:[{total:xxx}]}

            let resList = await Promise.all([learnedRes, totalRes])

            let bkLearnData = { notLearn: 0, learn: 0, master: 0 }
            for (let i = 0; i < resList[0].list.length; i++) {
                if (resList[0].list[i]['_id']) {
                    bkLearnData.master = resList[0].list[i].num
                }
                bkLearnData.learn += resList[0].list[i].num
            }
            let total = 0
            if (resList[1].list.length > 0 && resList[1].list[0].total >= 0) total = resList[1].list[0].total
            bkLearnData.notLearn = total - bkLearnData.learn

            ctx.body = { ...rescontent.SUCCESS, data: bkLearnData }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }

    })

    app.router('getAllWBData', async (ctx, next) => {
        try {
            let total = (await db.collection('word_book').count()).total
            let batchTimes = Math.ceil(total / 10)
            let tasks = []

            for (let i = 0; i < batchTimes; i++) {
                let promise = db.collection('word_book').skip(i * 10).limit(10).get()
                tasks.push(promise)
            }

            let resList = await (await Promise.all(tasks)).reduce((acc, currentValue, i) => {
                console.log('batch', i, 'done')
                return {
                    data: acc.data.concat(currentValue.data),
                    errMsg: acc.errMsg,
                }
            }, { data: [] })

            ctx.body = { ...rescontent.SUCCESS, data: resList.data }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('getSingleWBData', async (ctx, next) => {
        let wd_bk_id = event.wd_bk_id

        try {
            let res = await db.collection('word_book').where({ wd_bk_id }).get()

            let bkDetail = {
                name: res.data[0].name,
                description: res.data[0].description,
                total: res.data[0].total,
                coverType: res.data[0].cover_type
            }
            if (bkDetail.coverType == 'color') {
                bkDetail.color = res.data[0].color
            } else if (bkDetail.coverType == 'pic') {
                bkDetail.coverUrl = res.data[0].cover_url
            }
            ctx.body = { ...rescontent.SUCCESS, data: bkDetail }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('getAllLearnData', async (ctx, next) => {
        let user_id = event.user_id

        try {
            let res = await db.collection('learning_record')
                .aggregate()
                .match({    // 从词书与单词的关系表里获取当前学习的所有单词
                    user_id: user_id,
                })
                .group({
                    _id: '$master',
                    num: $.sum(1)
                })
                .end()

            let allLearnData = { learn: 0, master: 0 }
            for (let i = 0; i < res.list.length; i++) {
                allLearnData.learn += res.list[i].num
                if (res.list[i]['_id']) allLearnData.master = res.list[i].num
            }

            ctx.body = { ...rescontent.SUCCESS, data: allLearnData }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('getTodayLearnData', async (ctx, next) => {
        let user_id = event.user_id
        let now = new Date()
        now.setMilliseconds(0)
        now.setSeconds(0)
        now.setMinutes(0)
        now.setHours(0)
        let date = now.getTime()

        try {
            let res = await db.collection('daily_sum')
                .aggregate()
                .match({    // 获取时间为当天的学习数据
                    user_id: user_id,
                    date,
                })
                .project({
                    _id: 0,
                    l_time: 1,
                    learn: 1,
                    review: 1,
                })
                .end()

            let data = {
                l_time: 0,
                learn: 0,
                review: 0,
            }
            if (res.list.length != 0) data = res.list[0]
            ctx.body = { ...rescontent.SUCCESS, data }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('getDailySum', async (ctx, next) => {
        let user_id = event.user_id
        let skip = event.skip
        if (skip == undefined) skip = 0
        let now = new Date().getTime()

        try {
            let res = await db.collection('daily_sum')
                .where({
                    user_id: user_id,
                    date: _.lte(now)
                })
                // .count()
                .field({
                    _id: false,
                    date: true,
                    learn: true,
                    review: true,
                })
                .orderBy('date', 'desc')
                .skip(skip)
                .limit(10)
                .get()
            // 当判断到获取数量少于10(包括0)则表示已经取完了

            ctx.body = { ...rescontent.SUCCESS, data: res.data }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('getNoteBookWord', async (ctx, next) => {
        let user_id = event.user_id
        let skip = event.skip
        if (skip == undefined) skip = 0
        let getNum = event.num
        if (getNum == undefined) getNum = 20
        let batchTimes = Math.ceil(getNum / 10)

        try {
            let tasks = []
            for (let i = 0; i < batchTimes; i++) {
                let num = i * 10 + 10 > getNum ? getNum - (i * 10) : 10
                let skipNum = skip + i * 10
                let promise = db.collection('notebook')
                    .aggregate()
                    .match({
                        user_id: user_id,
                    })
                    .project({
                        _id: 0,
                        word_id: 1,
                    })
                    .lookup({   // 从单词库中获取单词信息，默认从word找，没有再单独取word_all找
                        from: 'word',
                        let: {
                            wordId: '$word_id',
                        },
                        pipeline: $.pipeline()
                            .match(_.expr(
                                $.eq(['$word_id', '$$wordId']),
                            ))
                            .project({
                                _id: 0,
                                word: 1,
                                translation: 1,
                            })
                            .done(),
                        as: 'word_detail'
                    })
                    .skip(skipNum)
                    .limit(num)
                    .end()
                tasks.push(promise)
            }
            let resList = (await Promise.all(tasks)).reduce((acc, currentValue, index) => {
                // console.log(acc)
                acc = acc.concat(currentValue.list)
                // console.log(currentValue)
                return acc
            }, [])
            // console.log('resList', resList)
            let notInSmallDB = []
            let notInSmallDBIndex = []
            let data = []
            for (let i = 0; i < resList.length; i++) {
                let translation = ''
                let word = ''
                if (resList[i].word_detail.length == 0) {
                    notInSmallDB.push(resList[i].word_id)
                    notInSmallDBIndex.push(i)
                } else {
                    translation = resList[i].word_detail[0].translation
                    word = resList[i].word_detail[0].word
                }
                data.push({
                    word_id: resList[i].word_id,
                    word,
                    translation
                })
            }
            // console.log('data', data)

            // 接下来进行小数据库中找不到的词的数据获取
            if (notInSmallDB.length > 0) {
                let res = await db.collection('word_all')
                    .aggregate()
                    .match({
                        word_id: _.in(notInSmallDB),
                    })
                    .project({
                        _id: 0,
                        word_id: 1,
                        word: 1,
                        translation: 1,
                    })
                    .end()
                for (let j = 0; j < res.list.length; j++) {
                    let i = notInSmallDB.indexOf(res.list[j].word_id)
                    let index = notInSmallDBIndex[i]
                    data[index] = {
                        word_id: res.list[j].word_id,
                        word: res.list[j].word,
                        translation: res.list[j].translation
                    }
                }
            }

            ctx.body = { ...rescontent.SUCCESS, data: data }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('getBkLearnedWord', async (ctx, next) => {
        let user_id = event.user_id
        let wd_bk_id = event.wd_bk_id
        let skip = event.skip
        if (!skip) skip = 0

        try {
            let res = await db.collection('learning_record')
                .aggregate()
                .match({
                    user_id: user_id,
                })
                .lookup({   // lookup-1，筛选在所学词书中的单词
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
                .match(_.expr(
                    $.eq([$.size('$word_list'), 1]),
                ))
                .skip(skip)
                .limit(20)
                .lookup({   // lookup-2，获取已取得单词的详细信息
                    from: 'word',
                    let: {
                        wordId: '$word_id',
                    },
                    pipeline: $.pipeline()
                        .match(_.expr(
                            $.eq(['$word_id', '$$wordId']),
                        ))
                        .project({
                            _id: 0,
                            word: 1,
                            translation: 1,
                        })
                        .done(),
                    as: 'word_detail'
                })
                .replaceRoot({
                    newRoot: $.mergeObjects([$.arrayElemAt(['$word_detail', 0]), '$$ROOT'])
                })
                .project({
                    _id: 0,
                    word: 1,
                    word_id: 1,
                    translation: 1,
                })
                .end()

            ctx.body = { ...rescontent.SUCCESS, data: res.list }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('getBkMasteredWord', async (ctx, next) => {
        let user_id = event.user_id
        let wd_bk_id = event.wd_bk_id
        let skip = event.skip
        if (!skip) skip = 0

        try {
            let res = await db.collection('learning_record')
                .aggregate()
                .match({
                    user_id: user_id,
                    master: true,
                })
                .lookup({   // lookup-1，筛选在某本书里的单词
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
                .match(_.expr(
                    $.eq([$.size('$word_list'), 1]),
                ))
                .skip(skip)
                .limit(20)
                .lookup({   // lookup-2，获取已取得单词的详细信息
                    from: 'word',
                    let: {
                        wordId: '$word_id',
                    },
                    pipeline: $.pipeline()
                        .match(_.expr(
                            $.eq(['$word_id', '$$wordId']),
                        ))
                        .project({
                            _id: 0,
                            word: 1,
                            translation: 1,
                        })
                        .done(),
                    as: 'word_detail'
                })
                .replaceRoot({
                    newRoot: $.mergeObjects([$.arrayElemAt(['$word_detail', 0]), '$$ROOT'])
                })
                .project({
                    _id: 0,
                    word: 1,
                    word_id: 1,
                    translation: 1,
                })
                .end()

            ctx.body = { ...rescontent.SUCCESS, data: res.list }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('getBkUnlearnedWord', async (ctx, next) => {
        let user_id = event.user_id
        let wd_bk_id = event.wd_bk_id
        // console.log('user_id', user_id)
        // console.log('wd_bk_id', wd_bk_id)
        let skip = event.skip
        if (!skip) skip = 0

        try {
            let res = await db.collection('word_in_book')
                .aggregate()
                .match({
                    wd_bk_id: wd_bk_id,
                })
                .sort({
                    wd_index: 1,
                })
                .lookup({   // lookup-1，筛选在未学过的单词
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
                .match(_.expr(
                    $.eq([$.size('$word_list'), 0]),
                ))
                .skip(skip)
                .limit(20)
                .lookup({   // lookup-2，获取已取得单词的详细信息
                    from: 'word',
                    let: {
                        wordId: '$word_id',
                    },
                    pipeline: $.pipeline()
                        .match(_.expr(
                            $.eq(['$word_id', '$$wordId']),
                        ))
                        .project({
                            _id: 0,
                            word: 1,
                            translation: 1,
                        })
                        .done(),
                    as: 'word_detail'
                })
                .replaceRoot({
                    newRoot: $.mergeObjects([$.arrayElemAt(['$word_detail', 0]), '$$ROOT'])
                })
                .project({
                    _id: 0,
                    word: 1,
                    word_id: 1,
                    translation: 1,
                })
                .end()

            ctx.body = { ...rescontent.SUCCESS, data: res.list }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('getBkWord', async (ctx, next) => {
        let wd_bk_id = event.wd_bk_id
        let skip = event.skip
        if (!skip) skip = 0

        try {
            let res = await db.collection('word_in_book')
                .aggregate()
                .match({
                    wd_bk_id: wd_bk_id,
                })
                .sort({
                    wd_index: 1,
                })
                .skip(skip)
                .limit(20)
                .lookup({   // lookup-2，获取已取得单词的详细信息
                    from: 'word',
                    let: {
                        wordId: '$word_id',
                    },
                    pipeline: $.pipeline()
                        .match(_.expr(
                            $.eq(['$word_id', '$$wordId']),
                        ))
                        .project({
                            _id: 0,
                            word: 1,
                            translation: 1,
                        })
                        .done(),
                    as: 'word_detail'
                })
                .replaceRoot({
                    newRoot: $.mergeObjects([$.arrayElemAt(['$word_detail', 0]), '$$ROOT'])
                })
                .project({
                    _id: 0,
                    word: 1,
                    word_id: 1,
                    translation: 1,
                })
                .end()

            ctx.body = { ...rescontent.SUCCESS, data: res.list }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('getLearnedWord', async (ctx, next) => {
        let user_id = event.user_id
        let skip = event.skip
        if (!skip) skip = 0

        try {
            let res = await db.collection('learning_record')
                .aggregate()
                .match({
                    user_id: user_id,
                })
                .skip(skip)
                .limit(20)
                .lookup({   // 获取已取得单词的详细信息
                    from: 'word',
                    let: {
                        wordId: '$word_id',
                    },
                    pipeline: $.pipeline()
                        .match(_.expr(
                            $.eq(['$word_id', '$$wordId']),
                        ))
                        .project({
                            _id: 0,
                            word: 1,
                            translation: 1,
                        })
                        .done(),
                    as: 'word_detail'
                })
                .replaceRoot({
                    newRoot: $.mergeObjects([$.arrayElemAt(['$word_detail', 0]), '$$ROOT'])
                })
                .project({
                    _id: 0,
                    word: 1,
                    word_id: 1,
                    translation: 1,
                })
                .end()

            ctx.body = { ...rescontent.SUCCESS, data: res.list }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('getMasteredWord', async (ctx, next) => {
        let user_id = event.user_id
        let skip = event.skip
        if (!skip) skip = 0

        try {
            let res = await db.collection('learning_record')
                .aggregate()
                .match({
                    user_id: user_id,
                    master: true,
                })
                .skip(skip)
                .limit(20)
                .lookup({   // 获取已取得单词的详细信息
                    from: 'word',
                    let: {
                        wordId: '$word_id',
                    },
                    pipeline: $.pipeline()
                        .match(_.expr(
                            $.eq(['$word_id', '$$wordId']),
                        ))
                        .project({
                            _id: 0,
                            word: 1,
                            translation: 1,
                        })
                        .done(),
                    as: 'word_detail'
                })
                .replaceRoot({
                    newRoot: $.mergeObjects([$.arrayElemAt(['$word_detail', 0]), '$$ROOT'])
                })
                .project({
                    _id: 0,
                    word: 1,
                    word_id: 1,
                    translation: 1,
                })
                .end()

            ctx.body = { ...rescontent.SUCCESS, data: res.list }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('getReviewWord', async (ctx, next) => {
        const user_id = event.user_id
        let skip = event.skip
        if (!skip) skip = 0

        try {
            let res = await db.collection('learning_record')
                .aggregate()
                .match({    // 选取还未掌握的单词
                    user_id: user_id,
                    master: false,
                })
                .skip(skip)
                .limit(20)
                .lookup({   // 获取取得的单词的详细数据
                    from: 'word',
                    localField: 'word_id',
                    foreignField: 'word_id',
                    as: 'word_detail'
                })
                .replaceRoot({  // 把单词详情合并到对象属性中
                    newRoot: $.mergeObjects([$.arrayElemAt(['$word_detail', 0]), '$$ROOT'])
                })
                .project({
                    _id: 0,
                    word_id: 1,
                    word: 1,
                    translation: 1,
                })
                .end()

            ctx.body = { ...rescontent.SUCCESS, data: res.list }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('getTodayLearnWord', async (ctx, next) => {
        const user_id = event.user_id
        let skip = event.skip
        if (!skip) skip = 0
        let now = new Date()
        now.setMilliseconds(0)
        now.setSeconds(0)
        now.setMinutes(0)
        now.setHours(0)
        let date = now.getTime()

        try {
            let res = await db.collection('learning_record')
                .aggregate()
                .match({    // 选取还未掌握的单词
                    user_id: user_id,
                    c_time: date,
                })
                .skip(skip)
                .limit(20)
                .lookup({   // 获取取得的单词的详细数据
                    from: 'word',
                    localField: 'word_id',
                    foreignField: 'word_id',
                    as: 'word_detail'
                })
                .replaceRoot({  // 把单词详情合并到对象属性中
                    newRoot: $.mergeObjects([$.arrayElemAt(['$word_detail', 0]), '$$ROOT'])
                })
                .project({
                    _id: 0,
                    word_id: 1,
                    word: 1,
                    translation: 1,
                })
                .end()

            ctx.body = { ...rescontent.SUCCESS, data: res.list }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('getTodayReviewWord', async (ctx, next) => {
        const user_id = event.user_id
        let skip = event.skip
        if (!skip) skip = 0
        let now = new Date()
        now.setMilliseconds(0)
        now.setSeconds(0)
        now.setMinutes(0)
        now.setHours(0)
        let date = now.getTime()

        try {
            let res = await db.collection('learning_record')
                .aggregate()
                .match({    // 选取还未掌握的单词
                    user_id: user_id,
                    last_l: date,
                    c_time: _.neq(date),
                })
                .skip(skip)
                .limit(20)
                .lookup({   // 获取取得的单词的详细数据
                    from: 'word',
                    localField: 'word_id',
                    foreignField: 'word_id',
                    as: 'word_detail'
                })
                .replaceRoot({  // 把单词详情合并到对象属性中
                    newRoot: $.mergeObjects([$.arrayElemAt(['$word_detail', 0]), '$$ROOT'])
                })
                .project({
                    _id: 0,
                    word_id: 1,
                    word: 1,
                    translation: 1,
                })
                .end()

            ctx.body = { ...rescontent.SUCCESS, data: res.list }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    return app.serve()
}