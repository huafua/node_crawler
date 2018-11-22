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