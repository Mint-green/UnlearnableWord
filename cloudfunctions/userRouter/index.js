// 云函数入口文件
const cloud = require('wx-server-sdk')
const TcbRouter = require('tcb-router') // 导入小程序路由
const rescontent = require('utils/response_content.js')
const InitOFMatrix = require('utils/init_of_matrix.js')

cloud.init({ env: 'music-cloud-1v7x1' })
const db = cloud.database({ throwOnNotFound: false })
const learnerDB = db.collection('learner')

// 云函数入口函数
exports.main = async (event, context) => {
    const app = new TcbRouter({ event })
    // console.log('event:', event)
    // console.log('context:', context)

    // app.use 表示该中间件会适用于所有的路由
    app.use(async (ctx, next) => {
        console.log('router name:', event.$url)
        await next() // 执行下一中间件
    });

    app.router('checkUsername', async (ctx, next) => {
        let username = event.username

        try {
            let res = await learnerDB.where({
                username
            }).get()
            let isFind = false
            if (res.data.length > 0) {
                isFind = true
            }
            ctx.body = { ...rescontent.SUCCESS, data: { isFind } }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('register', async (ctx, next) => {
        let userinfo = {}   // 构建新用户记录对象
        let time = new Date()
        console.log('Start handling request', time.getTime())
        userinfo.username = event.username
        userinfo.pwd = event.pwd
        userinfo.c_time = time.toISOString()
        userinfo.last_login = userinfo.c_time
        userinfo.l_book_id = -1
        userinfo.settings = {}
        userinfo.open_id = ''
        userinfo.wx_user = false
        random_num = Math.floor(Math.random() * 3) + 1
        userinfo.avatar_pic = 'cloud://music-cloud-1v7x1.6d75-music-cloud-1v7x1-1302160851/avatar_pic/default_' + random_num + '.jpg'
        userinfo.of_matrix = InitOFMatrix

        try {
            let res1 = await learnerDB.orderBy('user_id', 'desc').limit(1).get()    // 获得当前最大的user_id
            if (res1.data.length == 0) {
                console.log('there\'s no other user, this is the first user his/her id will be 0')
                userinfo.user_id = 0
            } else {
                console.log('Get last user_id, which is', res1.data[0].user_id, 'then creating account', new Date().getTime())
                userinfo.user_id = res1.data[0].user_id + 1
            }

            let res2 = await learnerDB.add({ data: userinfo })  // 向数据库添加新用户记录
            if (!res2._id) {
                ctx.body = { ...rescontent.DBERR }
                return
            }
            console.log('Create successfully, done.', new Date().getTime())
            let returnInfo = {
                username: userinfo.username,
                last_login: userinfo.last_login,
                l_book_id: userinfo.l_book_id,
                settings: userinfo.settings,
                wx_user: userinfo.wx_user,
                avatar_pic: userinfo.avatar_pic,
                user_id: userinfo.user_id,
            }
            ctx.body = { ...rescontent.REGISTEROK, data: returnInfo }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('login', async (ctx, next) => {
        let time = new Date()
        console.log('Start handling request', time.getTime())
        let last_login = time.toISOString()

        try {
            let res1 = await learnerDB.where({
                username: event.username,
                pwd: event.pwd,
            }).limit(1).field({ // 获取用户的基本数据(user_id、词书、设置等)
                _id: false,
                c_time: false,
                open_id: false,
                pwd: false,
                of_matrix: false,
            }).get()
            if (res1.data.toString() == "") {
                ctx.body = { ...rescontent.LOGINERR }
                return
            }
            console.log('Get userinfo, then update login time', new Date().getTime())
            // console.log(res1)
            let res2 = await learnerDB.where({
                username: event.username,
                pwd: event.pwd,
            }).update({
                data: { last_login: last_login }
            })
            // console.log(res2)
            if (res2.stats.updated == 0) {
                ctx.body = { ...rescontent.DBERR }
                return
            }
            console.log('Done', new Date().getTime())
            ctx.body = { ...rescontent.LOGINOK, data: res1.data[0] }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('wxLogin', async (ctx, next) => {
        let time = new Date()
        console.log('Start handling request', time.getTime())
        const wxContext = cloud.getWXContext()
        let open_id = wxContext.OPENID
        let username = event.username

        try {
            let res1 = await learnerDB.where({
                open_id
            }).limit(1).field({ // 尝试获取用户的基本数据(user_id、词书、设置等)
                _id: false,
                c_time: false,
                open_id: false,
                pwd: false,
            }).get()
            if (res1.data.toString() == "") {   // 结果为空表示该用户没注册，需要创建相应记录
                console.log('User not find, now create an account')
                let userinfo = {}
                userinfo.username = username
                userinfo.pwd = ''
                userinfo.c_time = time.toISOString()
                userinfo.last_login = userinfo.c_time
                userinfo.l_book_id = -1
                userinfo.settings = { auto_update_avatar: true, auto_update_username: true }
                userinfo.open_id = open_id
                userinfo.wx_user = true
                userinfo.avatar_pic = event.avatar_pic
                userinfo.of_matrix = InitOFMatrix

                let res2 = await learnerDB.orderBy('user_id', 'desc').limit(1).get()
                if (res2.data.length == 0) {
                    console.log('there\'s no other user, this is the first user his/her id will be 0')
                    userinfo.user_id = 0
                } else {
                    console.log('Get last user_id, which is', res2.data[0].user_id, 'then creating account', new Date().getTime())
                    userinfo.user_id = res2.data[0].user_id + 1
                }

                let res3 = await learnerDB.add({ data: userinfo })
                if (!res3._id) {
                    ctx.body = { ...rescontent.DBERR }
                    return
                }
                let returnInfo = {
                    username: userinfo.username,
                    last_login: userinfo.last_login,
                    l_book_id: userinfo.l_book_id,
                    settings: userinfo.settings,
                    wx_user: userinfo.wx_user,
                    avatar_pic: userinfo.avatar_pic,
                    user_id: userinfo.user_id,
                }
                console.log('Create successfully, done.', new Date().getTime())
                ctx.body = { ...rescontent.REGISTEROK, data: returnInfo }
                return
            } else {    // 结果不为空表示改用户已注册，则更新上次登录时间
                console.log('Find user, now update last login time')
                let data = { last_login: time.toISOString() }
                if (res1.data[0].settings.auto_update_avatar) {
                    data.avatar_pic = event.avatar_pic
                    res1.data[0].avatar_pic = event.avatar_pic
                }
                if (res1.data[0].settings.auto_update_username) {
                    data.username = event.username
                    res1.data[0].username = event.username
                }
                let res2 = await learnerDB.where({
                    open_id: open_id
                }).update({
                    data
                })
                if (res2.stats.updated == 0) {
                    ctx.body = { ...rescontent.DBERR }
                    return
                }
                console.log('Done', new Date().getTime())
                ctx.body = { ...rescontent.LOGINOK, data: res1.data[0] }
            }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('changeWordBook', async (ctx, next) => {
        let user_id = event.user_id
        let wd_bk_id = event.wd_bk_id

        try {
            let res = await db.collection('learner')
                .where({
                    user_id
                })
                .update({
                    data: {
                        l_book_id: wd_bk_id,
                    }
                })

            console.log(res)
            let data = false
            if (res.stats.updated == 1) {
                data = true
            }

            ctx.body = { ...rescontent.SUCCESS, data: data }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('changeSettings', async (ctx, next) => {
        let user_id = event.user_id
        let settings = event.settings

        try {
            let res = await db.collection('learner')
                .where({
                    user_id
                })
                .update({
                    data: {
                        settings: settings,
                    }
                })

            console.log(res)
            let data = false
            if (res.stats.updated == 1) {
                data = true
            }

            ctx.body = { ...rescontent.SUCCESS, data: data }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('changeUserInfo', async (ctx, next) => {
        let user_id = event.user_id
        let fieldName = event.type
        let value = event.value
        let validRange = ['username', 'avatar_pic', 'l_book_id', 'settings']


        try {
            let updateData = {}
            if (typeof (fieldName) == 'string') {
                if (validRange.indexOf(fieldName) == -1) {
                    ctx.body = { ...rescontent.DATAERR }
                    return
                }
                updateData[fieldName] = value
            } else if (typeof (fieldName) == 'object' && typeof (fieldName[0]) == 'string') {
                for (let i = 0; i < fieldName.length; i++) {
                    if (validRange.indexOf(fieldName[i]) == -1) {
                        ctx.body = { ...rescontent.DATAERR }
                        return
                    }
                    updateData[fieldName[i]] = value[i]
                }
            } else {
                ctx.body = { ...rescontent.DATAERR }
                return
            }
            let res = await db.collection('learner')
                .where({
                    user_id
                })
                .update({
                    data: updateData
                })

            console.log(res)
            let data = false
            if (res.stats.updated == 1) {
                data = true
            }

            ctx.body = { ...rescontent.SUCCESS, data: data }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('changePwd', async (ctx, next) => {
        let user_id = event.user_id
        let oldPwd = event.oldPwd
        let newPwd = event.newPwd

        try {
            let res = await db.collection('learner')
                .where({
                    user_id,
                    pwd: oldPwd,
                })
                .update({
                    data: {
                        pwd: newPwd
                    }
                })

            console.log(res)
            let data = false
            if (res.stats.updated == 1) {
                data = true
            }

            ctx.body = { ...rescontent.SUCCESS, data: data }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    app.router('getUserInfoViaId', async (ctx, next) => {
        let user_id = event.user_id
        let time = new Date()
        let last_login = time.toISOString()

        try {
            let updateRes = db.collection('learner')
                .where({
                    user_id,
                }).update({
                    data: { last_login: last_login }
                })
            let getRes = db.collection('learner')
                .where({
                    user_id
                })
                .field({
                    _id: -1,
                    user_id: 1,
                    wx_user: 1,
                    username: 1,
                    avatar_pic: 1,
                    l_book_id: 1,
                    settings: 1,
                    last_login: 1,
                })
                .get()

            let resList = await Promise.all([updateRes, getRes])

            let state = false
            if (resList[0].stats.updated == 1 && resList[1].data.length == 1) {
                state = true
                resList[1].data[0].last_login = last_login
            }
            if (state) {
                ctx.body = { ...rescontent.SUCCESS, data: resList[1].data[0] }
            } else {
                ctx.body = { ...rescontent.LOGINERR, data: '自动登录失败' }
            }
        } catch (e) { // 抛出错误
            console.error(e)
            ctx.body = { ...rescontent.DBERR, err: e }
        }
    })

    return app.serve()
}