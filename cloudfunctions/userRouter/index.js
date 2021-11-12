// 云函数入口文件
const cloud = require('wx-server-sdk')
const TcbRouter = require('tcb-router') // 导入小程序路由
const rescontent = require('utils/response_content.js')

cloud.init({ env: 'music-cloud-1v7x1' })
const db = cloud.database({ throwOnNotFound: false })
const learnerDB = db.collection('learner')

// 云函数入口函数
exports.main = async (event, context) => {
    const app = new TcbRouter({ event })
    // console.log('event:', event)
    // console.log('context:', context)

    // app.use 表示该中间件会适用于所有的路由
    // app.use(async (ctx, next) => {
    //     ctx.data = {};
    //     await next(); // 执行下一中间件
    // });

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
        userinfo.l_book_id = ''
        userinfo.settings = {}
        userinfo.open_id = ''
        userinfo.wx_user = false
        random_num = Math.floor(Math.random() * 3) + 1
        userinfo.avatar_pic = 'cloud://music-cloud-1v7x1.6d75-music-cloud-1v7x1-1302160851/avatar_pic/default_' + random_num + '.jpg'

        try {
            let res1 = await learnerDB.orderBy('user_id', 'desc').limit(1).get()    // 获得当前最大的user_id
            console.log('Get last user_id, which is', res1.data[0].user_id, 'then creating account', new Date().getTime())
            userinfo.user_id = res1.data[0].user_id + 1
            let res2 = await learnerDB.add({ data: userinfo })  // 向数据库添加新用户记录
            if (!res2._id) {
                ctx.body = { ...rescontent.DBERR }
                return
            }
            console.log('Create successfully, done.', new Date().getTime())
            // let record = await learnerDB.doc(record_id).field({ // 获取新用户的基本数据(user_id、词书、设置等)
            //     _id: false,
            //     c_time: false,
            //     open_id: false,
            //     pwd: false,
            // }).get()
            // console.log('Create Done return user info', new Date().getTime())
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
                username,
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
                userinfo.l_book_id = ''
                userinfo.settings = { auto_update_avatar: ture }
                userinfo.open_id = open_id
                userinfo.wx_user = true
                userinfo.avatar_pic = event.avatar_pic
                let res2 = await learnerDB.orderBy('user_id', 'desc').limit(1).get()
                userinfo.user_id = res2.data[0].user_id + 1
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
                let res2 = await learnerDB.where({
                    username: username,
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

    return app.serve()
}