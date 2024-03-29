# 学不会单词

一个背单词小程序




### 词汇数据来源
[ECDICT](https://github.com/skywind3000/ECDICT)



### 简介
这是一个背单词小程序，是仿**不背单词**App做的（因为不背的UI真的太好看了），词库是刚好找到了大佬的**ECDICT**项目，把这些数据稍微做了些处理导入了数据库。
主要实现搜索，学习单词，复习单词，统计，登录等功能。




### 整体结构
![框架](./images/整体框架图.png)



### 功能模块及页面
- [x] 登录模块（支持账号密码、微信登录&注册）

- [x] 主页
    - [x] 每日一句（获取&发音）
    - [x] 主页显示需要背以及复习的量
    
- [x] 概述页
    - [x] 显示相关基础及统计数据（词书、已背数量等）
    - [x] 切换词书
    - [x] 查看所有学过/未学习的单词等各项统计的单词队列
    - [x] 收藏夹
    - [x] 每日任务
    - [x] ECharts显示历史学习记录
    
- [x] 个人主页
    - [x] 个人信息更改(头像、昵称、密码)
    
- [x] 单词详情页

- [x] 搜索模块
    - [x] 用英文搜索（前缀、搜原型、空格模糊搜索）
    - [x] 中文释义进行搜索（直接当空格模糊使，近义词替代和自动分词太难了没做）
    - [x] 历史搜索
    - [x] 切换大小词库（小的快/大的全）
    
- [x] 学习/复习单词
    - [x] 三种题型（看词选义、看词识义、看义识词）
    - [x] 遮挡单词or词义样式（倒计时自动取消or遮挡条点击取消）
    - [x] 循环逻辑及实现
    - [x] 跳过or设置为已掌握
    - [x] 复习时间间隔算法（参考SuperMemo系列SM-5算法）
    - [ ] 拼写页面
    
- [x] 设置页



### 效果图



<img src="images/before_login_index.jpg" width="19%" alt="首页登录前">&nbsp;&nbsp;<img src="images/before_login_user.jpg" width="19%" alt="个人页登录前">&nbsp;&nbsp;<img src="images/login.jpg" width="19%" alt="登录页">&nbsp;&nbsp;<img src="images/after_login_index.jpg" width="19%" alt="首页登录后">&nbsp;&nbsp;<img src="images/after_login_user.jpg" width="19%" alt="个人页登录后">
<img src="images/title_1.png"  width="100%" alt="图名1">

<img src="images/after_login_overview_1.jpg" width="19%" alt="概览页登录后1">&nbsp;&nbsp;<img src="images/after_login_overview_2.jpg" width="19%" alt="概览页登录后2">&nbsp;&nbsp;<img src="images/word_list.jpg" width="19%" alt="单词列表">&nbsp;&nbsp;<img src="images/learning_1.jpg" width="19%" alt="学习/复习页1">&nbsp;&nbsp;<img src="images/learning_3.jpg" width="19%" alt="学习/复习页2">
<img src="images/title_2.png"  width="100%" alt="图名2">

<img src="images/learning_4.jpg" width="19%" alt="学习/复习页3">&nbsp;&nbsp;<img src="images/learning_5.jpg" width="19%" alt="学习/复习页4">&nbsp;&nbsp;<img src="images/learning_6.jpg" width="19%" alt="学习/复习页5">&nbsp;&nbsp;<img src="images/learning_8.jpg" width="19%" alt="学习/复习页6">&nbsp;&nbsp;<img src="images/search_1.jpg" width="19%" alt="搜索页">
<img src="images/title_3.png"  width="100%" alt="图名3">

<img src="images/search_word_small.jpg" width="19%" alt="小词库搜索">&nbsp;&nbsp;<img src="images/search_word_big.jpg" width="19%" alt="大词库搜索">&nbsp;&nbsp;<img src="images/search_translation.jpg" width="19%" alt="释义搜索">&nbsp;&nbsp;<img src="images/word_detail.jpg" width="19%" alt="单词详情">&nbsp;&nbsp;<img src="images/settings.jpg" width="19%" alt="设置页">
<img src="images/title_4.png"  width="100%" alt="图名4">



### 体验

~~想要玩一下的可以扫描以下二维码~~:

<img src="images/miniprogram_QRcode.jpg" width="20%" alt="小程序二维码">

由于微信要取消云开发基础套餐的免费使用了，而本人暂无精力完善此项目，这个月（22.10）20号会清除本项目的云开发数据，目前已将已有数据备份，有机会会再放出来给大家体验的！
不过还是老样子，大家有什么需求或问题都可以提一下issue，我会竭力帮大家解决的~



### 自行部署

1. 由于本项目依托微信小程序提供的云开发能力，因此需要一些注册等的基本操作，可以参考我的另一个项目...的指引，如果会申请小程序使用云开发能力的可以朋友可以略过这一步：[GuGuMusic的使用方法](https://github.com/Mint-green/GuGumusic#%E4%BD%BF%E7%94%A8%E6%96%B9%E6%B3%95)
2. 下载基础数据库的文件，最近还是没能力完善说明各个表格的具体字段等，大家可以查看数据后大致判断，[度盘链接](https://pan.baidu.com/s/1LR6Q6BojBTQ0ywWiJVFX6w)，提取码：dddd
3. cloudfunctions文件夹在的云函数右键部署，在云开发服务的地方也按照2中的文档建好并导入需要的数据后，应该就可以用了



### 更多

最近比较忙，先简单列列已完成的and放放效果图（请原谅我放那么多图），详细的介绍之后再上，持续更新ing~
有问题都可以提问，有什么想法也可以提一提呀~



### 更新日志

**22.10.02** 修复第一个用户（普通/微信）无法创建成功问题

**22.10.02** 由于微信调整云开发计费规则，本项目小程序测试版将于22年10月中旬停止开放