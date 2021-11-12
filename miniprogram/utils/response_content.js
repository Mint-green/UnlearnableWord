const SUCCESS   = { errorcode: 100,     errormsg: "success" }               //成功
const LOGINOK   = { errorcode: 1,       errormsg: "Login successfully" }    //登录成功
const REGISTEROK= { errorcode: 2,       errormsg: "Register successfully" } //注册成功
const DBERR     = { errorcode: -1,      errormsg: "Database error!" }       //数据库操作失败
const ROUTERERR = { errorcode: -2,      errormsg: "Wrong router name" }     //路由名字有误
const LOGINERR  = { errorcode: -3,      errormsg: "Wrong username or pwd" } //登录信息有误
const DATAERR   = { errorcode: -4,      errormsg: "Wrong data!" }           //数据有误
const UNKOWNERR = { errorcode: -100,    errormsg: "Unkown error!" }         //出现未知错误


module.exports={
    SUCCESS: SUCCESS,
    LOGINOK: LOGINOK,
    REGISTEROK: REGISTEROK,
    DBERR: DBERR,
    ROUTERERR: ROUTERERR,
    LOGINERR: LOGINERR,
    DATAERR: DATAERR,
    UNKOWNERR: UNKOWNERR,
}
