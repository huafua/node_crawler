const path=require("path");
//爬取www.xs8.com的小说
// let targetUrl = "https://www.xs8.cn/chapter/10684980704041603/28682355652566083";
// targetUrl = "https://www.xs8.cn/chapter/10220792103411103/27436261890607674";
// targetUrl="https://www.xs8.cn/chapter/9673619303540603/25967671660972822";
let start_url="https://www.xs8.cn/all?pageNum=1&pageSize=1000&gender=1&catId=-1&isFinish=-1&isVip=-1&size=-1&updT=-1&orderBy=0";
const request = require("request");
const http = require("http");
const url = require("url");
const sqlite = require("sqlite3");
const db = new sqlite.Database("data.sqlite");

const JSDOM = require("jsdom").JSDOM;
const headers={
    "user-agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36"
};
function getData(targetUrl, callback) {
    request({
        url: targetUrl,
        methd: "get",
        headers: headers
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
        let nextAnchor=document.querySelector("a#j_chapterNext")
        if(nextAnchor){
            let nextLink = "https:" + nextAnchor.getAttribute("href");
            let chapter_info=[];
            if(chapter_full_name.indexOf(":")!=-1){
                chapter_info = chapter_full_name.split("：");
            }else{
                chapter_info = chapter_full_name.split(" ");
            }        
            let chapter_index = chapter_info[0];
            let chapter = chapter_info[1];
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
}

function getFromUrl(all_url,callback){
    request({
        url:all_url,
        method:"get",
        headers:headers
    },function(err,res,body){
        if(!err){
            //只有状态码为200的时候进行爬取
            if(res.statusCode==200){
                let document=new JSDOM(body.toString()).window.document;
                callback&&callback(document);
            }else{
                //输出statusCode便于追踪
               console.log("you got nothing"+res.statusCode);
            }
        }else{
            //输出错误日志，便于追踪
            console.log(err);
        }
    })
}

function start_crawler(){    
    db.serialize(function () {
        let sql="CREATE TABLE if not exists `xs`(`id` INTEGER PRIMARY KEY AUTOINCREMENT,`novel_name` TEXT, `chapter_index` TEXT, `chapter` TEXT, `content`	TEXT)";
        db.run(sql, function () {
            console.log("table existed or created");
            novelEntry(start_url);
        });
    })
}

//获取单个小说的链接
function getSingleNovel(xsurl,callback){
    request({
        url:xsurl,
        method:"get",
        headers:headers
    },function(err,res,body){
        if(!err){
            if(res.statusCode==200){
                let document=new JSDOM(body.toString()).window.document;
                callback&&callback(document);
            }else{               
                console.log("nothing to get"+res.statusCode);
            }
        }else{
            console.log(err);
        }
    });
}

//获取小说的入口
function novelEntry(start_url){
    getFromUrl(start_url,function(data){
        let xsitems=data.querySelectorAll("div.right-book-list li");
        let urls=Array.prototype.map.call(xsitems,function(item){
            return "https://www.xs8.cn"+item.querySelector("div.book-info h3 a").getAttribute("href");
        });
        urls.forEach(function(urlItem){
            getSingleNovel(urlItem,function(data){
                let anchor=data.querySelector("a.green-btn.J-getJumpUrl");
                let targetUrl="https:"+anchor.getAttribute("href");
                getData(targetUrl, function (data) {
                    callback(data);
                });
                // console.log(targetUrl);
            });        
        })
    });
}
//开始爬取
start_crawler();