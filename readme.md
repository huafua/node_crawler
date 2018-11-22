# NodeJS爬虫程序
## 1. 简介
使用`Nodejs`写的爬虫程序，用于从[小说吧](http://www.xs8.com)爬取小说，并将资料保存到[`sqlite`](http://www.baidu.com)数据库中，包含以字段：

    1. 小说标题(`novel_name`)
    2. 第几章(`chapter_index`)
    3. 章节标题(`chapter`)
    4. 章节正文(`content`)
## 2. 创建项目
本例中项目命名为`node_crawler`
``` shell
mkdir node_crawler
cd node_crawler
npm init -y
npm install -S sqlite3 jsdom
```
以上[jsdom](https://www.npmjs.com/package/jsdom)模块也可用[cherio](https://www.npmjs.com/package/cheerio)替换，具体用法可查看其文档

## 3. 先爬取一个章节

### 3.1 获取链接

 随便打开一个小说的页面，获取链接，如：https://www.xs8.cn/chapter/10684980704041603/28682355652566083

### 3.2 创建`app.js`,编写代码
``` javascript
const request=require("request");
const JSDOM=require("jsdom").JSDOM;
let targetUrl="https://www.xs8.cn/chapter/10684980704041603/28682355652566083";
request({
    url: targetUrl,
    methd: "get",
    headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36"
    }
}, function (err, res, body) {
    //文本转换为DOM，便于操作
    let document=new JSDOM(body).window.document;
    //获取正文所在的div元素
    let wraper = document.querySelector("div.main-text-wrap");
    //获取小说标题
    let novel_name = document.querySelector("div.crumbs-nav a.act").innerHTML;
    //获取小说章节信息（第几章 章节标题）
    let chapter_full_name = wraper.querySelector("h3.j_chapterName").innerHTML;
    //获取正文,去除多余的<p>,</p>等内容
    let content = wraper.querySelector("div.read-content.j_readContent").innerHTML.replace(/[\<p\>\<\/p\>\s]/g, "");
    let chapter_info = chapter_full_name.split(" ");
})
```
### 3.3 本章节是否爬取
由于网站中小说是付费的，这里我们只爬取试读部分，解析DOM结构可知若结构中有`div.vip-limit-wrap`则表示该章节是收费的，不爬取，故有：
``` javascript
const request=require("request");
const JSDOM=require("jsdom").JSDOM;
request({
    url: "https://www.xs8.cn/chapter/10684980704041603/28682355652566083",
    methd: "get",
    headers: {
        "user-agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36"
    }
}, function (err, res, body) {
    //文本转换为DOM，便于操作
    let document=new JSDOM(body).window.document;
    let vipRequired = document.querySelector("div.vip-limit-wrap");
        if(!vipRequired){
        //获取正文所在的div元素
        let wraper = document.querySelector("div.main-text-wrap");
        //获取小说标题
        let novel_name = document.querySelector("div.crumbs-nav a.act").innerHTML;
        //获取小说章节信息（第几章 章节标题）
        let chapter_full_name = wraper.querySelector("h3.j_chapterName").innerHTML;
        //获取正文,去除多余的<p>,</p>等内容
        let content = wraper.querySelector("div.read-content.j_readContent").innerHTML.replace(/[\<p\>\<\/p\>\s]/g, "");           
        let chapter_info = chapter_full_name.split(" ");
    }
})
```
### 3.4 爬取下一章节
分析DOM结构，可知下一章节的链接存在于`a#j_chapterNext`元素中，因此可用如下代码获取下一章节链接：
``` javascript
let nextLink = "https:" + document.querySelector("a#j_chapterNext").getAttribute("href");
```
下一章节的爬取方式与本章一致，故封装函数：
``` javascript
//封装函数，用于递归调用
function callback(data) {
    let document = new JSDOM(data.toString()).window.document;
    let vipRequired = document.querySelector("div.vip-limit-wrap");
    if (!vipRequired) {
        let wraper = document.querySelector("div.main-text-wrap");
        let novel_name = document.querySelector("div.crumbs-nav a.act").innerHTML;
        let chapter_full_name = wraper.querySelector("h3.j_chapterName").innerHTML;
        let content = wraper.querySelector("div.read-content.j_readContent").innerHTML.replace(/[\<p\>\<\/p\>\s]/g, "");
        let nextLink = "https:" + document.querySelector("a#j_chapterNext").getAttribute("href");
        let chapter_info = chapter_full_name.split(" ");
        //第几章
        let chapter_index = chapter_info[0];
        //章节标题
        let chapter = chapter_info[1];       
    }
}
```
从而：
``` javascript
function getData(targetUrl, callback) {
    request({
        url: targetUrl,
        methd: "get",
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36"
        }
    }, function (err, res, body) {
        callback && callback(body);
    })
}

//以下为调用方式
getData(targetUrl, function (data){
    callback(data);
});
```
## 4. 保存到数据库
### 4.1 选用数据库
获得数据后，需将数据持久化到数据库中，此处选用`sqlite3`数据库，
``` javascript
const sqlite = require("sqlite3");
const db = new sqlite.Database("data.sqlite");   
```
### 4.2 创建数据表
``` javascript
db.serialize(function () {
        let sql="CREATE TABLE if not exists `xs`(`id` INTEGER PRIMARY KEY AUTOINCREMENT,`novel_name` TEXT, `chapter_index` TEXT, `chapter` TEXT, `content`	TEXT)";
        db.run(sql, function () {
            console.log("table existed or created");
            getData(targetUrl, function (data) {
                callback(data);
            });
        });
    })
```
### 4.3 将数据插入到数据表中
修改callback函数，片段如下：
``` javascript
...//省略
let chapter = chapter_info[1];
db.serialize(function () {
    let insert = db.prepare("insert into xs(novel_name,chapter_index,chapter,content) values(?,?,?,?)");
    insert.run(novel_name, chapter_index, chapter, content);
    insert.finalize();
});
getData(nextLink, function (data) {
    callback(data);
})

```
## 5. 运行
在命令行中键入以下命令，即可完成小说试读章节的保存
`node app.js`或`npm test`
## 完整代码
``` javascript
//爬取www.xs8.com的小说
let targetUrl = "https://www.xs8.cn/chapter/10684980704041603/28682355652566083";
// targetUrl = "https://www.xs8.cn/chapter/10220792103411103/27436261890607674";
targetUrl="https://www.xs8.cn/chapter/9673619303540603/25967671660972822";
const request = require("request");
const http = require("http");
const url = require("url");
const sqlite = require("sqlite3");

const JSDOM = require("jsdom").JSDOM;

function getData(targetUrl, callback) {
    request({
        url: targetUrl,
        methd: "get",
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36"
        }
    }, function (err, res, body) {
        callback && callback(body);
    })
}

function callback(data) {
    let document = new JSDOM(data.toString()).window.document;
    let vipRequired = document.querySelector("div.vip-limit-wrap");
    if (!vipRequired) {
        let wraper = document.querySelector("div.main-text-wrap");
        let novel_name = document.querySelector("div.crumbs-nav a.act").innerHTML;
        let chapter_full_name = wraper.querySelector("h3.j_chapterName").innerHTML;
        let content = wraper.querySelector("div.read-content.j_readContent").innerHTML.replace(/[\<p\>\<\/p\>\s]/g, "");
        let nextLink = "https:" + document.querySelector("a#j_chapterNext").getAttribute("href");
        let chapter_info = chapter_full_name.split(" ");
        let chapter_index = chapter_info[0];
        let chapter = chapter_info[1];
        console.log(chapter_info);
        db.serialize(function () {
            let insert = db.prepare("insert into xs(novel_name,chapter_index,chapter,content) values(?,?,?,?)");
            insert.run(novel_name, chapter_index, chapter, content);
            insert.finalize();
        });
        getData(nextLink, function (data) {
            callback(data);
        })
    }
}

const db = new sqlite.Database("data.sqlite");
db.serialize(function () {
    let sql="CREATE TABLE if not exists `xs`(`id` INTEGER PRIMARY KEY AUTOINCREMENT,`novel_name` TEXT, `chapter_index` TEXT, `chapter` TEXT, `content`	TEXT)";
    db.run(sql, function () {
        console.log("table existed or created");
        getData(targetUrl, function (data) {
            callback(data);
        });
    });
})
```

