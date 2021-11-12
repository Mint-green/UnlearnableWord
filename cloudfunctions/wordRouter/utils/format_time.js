// 传入时间的毫秒数(date.getTime())获取时间详情

const formatTime = (time) => {
    var date = new Date(time)
    var y = date.getFullYear()
    var m = date.getMonth() + 1
    var d = date.getDate()
    var h = date.getHours()
    var min = date.getMinutes()
    var s = date.getSeconds()
    var timeStr = y + "-" + enterZero(m) + "-" + enterZero(d) + " " + enterZero(h) + ":" + enterZero(min) + ":" + enterZero(s)
    return timeStr
}

const formatDate = (time) => {
    var date = new Date(time)
    var y = date.getFullYear()
    var m = date.getMonth() + 1
    var d = date.getDate()
    var dateStr = y + "-" + enterZero(m) + "-" + enterZero(d)
    return dateStr
}

const dateNum = (time) => {
    var date = new Date(time)
    var y = date.getFullYear()
    var m = date.getMonth() + 1
    var d = date.getDate()
    var num = y *10000 + m*100 + d
    return num
}

const enterZero = (num) => {
    num = Math.abs(num)
    if (num <= 9) {
        num = "0" + num
    }
    return num
}

module.exports = {
    formatTime: formatTime,
    formatDate: formatDate,
    dateNum: dateNum,
}