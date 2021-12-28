// SM-5算法
// 计算下一个最优间隔的同时更新OF矩阵，从而单词在学习的时候不是一个个体，而是

// 用于生成最佳区间的随机散布 NOI--near-optimal intervals
// -------------------------------------------------------------
// 优点1: 通过一些差异值来加速OF矩阵优化过程
// 优点2: 消除复习的块状问题，将同一时期学习的内容适当分散进行复习
// 公式: NOI=PI+(OI-PI)*(1+m) m∈(-0.5, 0.5)
// m需满足（设概率密度函数为f(x)）：
//      (0, 0.5)内的概率为0.5，即 ∫[0, 0.5]f(x)dx=0.5
//      m=0的概率为m=0.5的概率的100倍 即 f(0)/f(0.5)=100
//      假设概率密度函数为 f(x)=a*exp(-b*x)
// -------------------------------------------------------------
// Piotr Wozniak求得 a=0.047; b=0.092;
// 从0到m的积分记为概率p，对于每一个p都有一个对应的m存在，p∈(0, 0.5)
// 生成一个(0, 1)之间的随机数，减去0.5得p，则|p|∈(0, 0.5)，而p的符号可以控制m的符号
// 则 ∫[0, m]f(x)dx=|p| => ∫[0, m]d( a*exp(-b*x) / (-b) )=|p| => m=-1/b*ln(1-b/a*|p|))
// 
// const createNOI = (PI, OI) => {
//     let a = 0.047
//     let b = 0.092
//     let randNum = Math.random()
//     let p = randNum - 0.5
//     console.log('random p', p)
//     let m = -1 / b * (Math.log((1 - b / a * Math.abs(p))))
//     m = m * Math.sign(p)
//     console.log('random m', m)
//     let NOI = PI + (OI - PI) * (1 + m)
//     NOI = Math.round(NOI)
//     return NOI
// }

// -------------------------------------------------------------
// 由于作者给出的参数带入是有误的，采用类正态分布实现分布函数
// 原型(标准正态分布)：f(x) = 1/(√(2π)*Ω) * e(-x^2/(2Ω^2))
// 简化：f(x) = a*e^(-b*x^2)
// f(0) = 100*f(0.5) 可求得 b = -18.420680743952367
// ∫[0, 0.5]f(x)dx = 0.5 可求得 a = 2.4273047133848933
// 积分计算器网址: https://zh.numberempire.com/definiteintegralcalculator.php
// 画函数图像网址：https://www.desmos.com/calculator?lang=zh-CN
// 这里使用能解正态分布分位数的库进行运算
// f(0) = 100*f(0.5) 按正态分布算，可求得 std=0.1647525572455652
// X ~ N(0,0.1647525572455652) 从0~0.5的累计分布值为0.4987967402705885
// 故若要满足∫[0, 0.5]f(x)dx = 0.5，要在前面再乘上 
// JStat库的jStat.normal.inv( p, mean, std )可以求出N(mean,std)分布从负无穷开始累计分布为p的分位点
// 因此思路转变为，首先随机获取[0, 1)的数r， r-0.5得到[-0.5, 0.5)的数m，(m*0.4987967402705885/0.5+0.5)得到累计值
// 即jStat.normal.inv(abs(m*0.4987967402705885/0.5)+0.5, 0, 0.1647525572455652) 可得到分位点

const jStat = require("./jstat.min.js")
const createNOI = (PI, OI) => {
    let mean = 0
    let std = 0.1647525572455652
    let randNum = Math.random()
    // console.log('randNum', randNum)
    let p = Math.abs((randNum - 0.5) * 0.4987967402705885 / 0.5) + 0.5
    // console.log('random p', p)
    let inv_cdf = jStat.normal.inv(p, mean, std)
    let m = inv_cdf * Math.sign(randNum - 0.5)
    // console.log('random m', m)
    let NOI = PI + (OI - PI) * (1 + m)
    NOI = Math.round(NOI)
    return NOI
}


// 符号函数
const sgn = (num) => {
    if (num < 0) {
        return -1
    } else if (num == 0) {
        return 0
    } else {
        return 1
    }
}

// 计算新的OF矩阵对应项
// 输入：
//      last_i - 用于相关项目的最后(上一个)间隔(原文描述为the last interval used for the item in question)
//      q - 重复响应的质量
//      used_OF - 用于计算相关项目的最后一个间隔时使用的最佳因子
//      old_OF - 与项目的相关重复次数和电子因子相对应的 OF 条目的前一个值
//      fraction - 属于确定修改速率的范围 (0，1) 的数字 (OF矩阵的变化越快)
// 输出：
//      new_OF - 考虑的 OF 矩阵条目的新计算值
// 局部变量：
//      modifier - 确定 OF 值将增加或减少多少次的数字
//      mod5 - 在 q=5 的情况下为修饰符建议的值
//      mod2 - 在 q=2 的情况下为修饰符建议的值
const calculateNewOF = (last_i, q, used_OF, old_OF, fraction = 0.8) => {
    let modifier
    let mod5 = (last_i + 1) / last_i
    if (mod5 < 1.05) mod5 = 1.05
    let mod2 = (last_i - 1) / last_i
    if (mod2 > 0.75) mod2 = 0.75
    if (q > 4) {
        modifier = 1 + (mod5 - 1) * (q - 4)
    } else {
        modifier = 1 - (1 - mod2) / 2 * (4 - q)
    }
    if (modifier < 0.05) modifier = 0.05
    let new_OF = used_OF * modifier
    if (q > 4) if (new_OF < old_OF) new_OF = old_OF
    if (q < 4) if (new_OF > old_OF) new_OF = old_OF
    new_OF = new_OF * fraction + old_OF * (1 - fraction)
    if (new_OF < 1.2) new_OF = 1.2
    new_OF = new_OF.toFixed(4)
    new_OF = parseFloat(new_OF)
    return new_OF
}

// 单词记录提供数据：循环次数，上次的EF，上次的间隔时间(/天), q(quality，回忆质量)
// 其他：OF矩阵
const sm_5 = (OF, wd_learning_record) => {
    let EF = wd_learning_record.EF
    let q = wd_learning_record.q
    let last_NOI = wd_learning_record.NOI
    let n = wd_learning_record.next_n
    let last_l = wd_learning_record.last_l
    let next_l = wd_learning_record.next_l
    let master = wd_learning_record.master

    if (master) {
        return {
            wd_learning_record: {
                word_id: wd_learning_record.word_id,
                last_l,
                next_l,
                NOI: last_NOI,
                EF,
                next_n: n,
                master,
            },
            OF,
        }
    }

    // 计算此时与上次复习/学习的时间差(/天)
    let now = new Date()
    now.setMilliseconds(0)
    now.setSeconds(0)
    now.setMinutes(0)
    now.setHours(0)
    let last_i = Math.ceil((now.getTime() - last_l) / 86400000)
    // console.log('word', wd_learning_record.word_id, 'last interval', last_i)

    // 更改EF(由于作为键，EF规定为一位小数转换成的字符串)
    EF = parseFloat(EF) + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    if (EF < 1.3) EF = 1.3
    if (EF > 2.8) EF = 2.8
    EF = EF.toFixed(1)

    // 更改矩阵对应项，这里认为若实际间隔时间超过所需间隔时间的1.5倍
    // 则视为极大异常值，规整为1.5倍，且不更改矩阵
    let used_OF = OF[EF][n - 1]
    if (!used_OF) used_OF = 1.2
    n++
    if (!OF[EF][n - 1]) OF[EF][n - 1] = 1.2
    if (last_i <= 1.5 * last_NOI) {
        let old_OF = OF[EF][n - 1]
        let new_OF = calculateNewOF(last_i, q, used_OF, old_OF)
        // console.log('new_OF of', 'OF[', EF, '][', n - 1, ']:', new_OF)
        OF[EF][n - 1] = new_OF
    } else {
        // console.log('last_i', last_i, 'is longer than 1.5 expected interval :', last_NOI)
        last_i = Math.round(last_NOI * 1.5)
    }

    // 计算最优间隔时长并进行指定分布的随机分散
    // 同时计算下次需要复习的时间(1970.1.1至今毫秒数表示)
    let NOI
    if (q < 2) {
        n = 0
        NOI = 1
    } else if (q < 3) {
        n = 1
        let interval = OF[EF][0]
        NOI = Math.round(interval)
    } else {
        let interval = n == 1 ? 5 : OF[EF][n - 1] * last_i
        // 若下个最优间隔时间大于100天，则将单词标记为已掌握
        if (interval > 100) master = true
        console.log('next optimal interval', interval)
        NOI = Math.round(createNOI(last_i, interval))
        if (NOI > 100 && !master) NOI = 100
        if (NOI < 0 && !master) NOI = 1
    }
    last_l = now.getTime()
    next_l = last_l + NOI * 86400000

    return {
        wd_learning_record: {
            word_id: wd_learning_record.word_id,
            last_l,
            next_l,
            NOI,
            EF,
            next_n: n,
            master,
        },
        OF,
    }
}

module.exports = {
    sm_5: sm_5,
}