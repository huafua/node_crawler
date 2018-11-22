const http = require("http");
const url = require("url");
const fs = require("fs");
const JSDOM = require("jsdom").JSDOM;
index = 0;

function check(urlstr, callback) {
    var urlObj = url.parse(urlstr);
    var arr = [];
    req = http.request({
        hostname: urlObj.hostname,
        path: urlObj.path,
        port: urlObj.port
    }, function (res) {
        if (res.statusCode == 302||res.statusCode==301) {
            var newUrl = "http://" + urlObj.host + res.headers.location;
            // console.log(newUrl);
            console.log(`我是第${++index}次重定向`);
            check(newUrl, callback);
        } else {
            res.on("data", function (data) {
                arr.push(data);
                var b = Buffer.concat(arr);
                callback && callback(b)
            })
        }
    });
    req.end();
}
check("http://localhost:8080", function (data) {
    // var document = new JSDOM(data.toString()).window.document;
    // var items = document.getElementsByTagName("a");
    // Array.prototype.forEach.call(items, function (item) {
    //     console.log(item.textContent);
    // });
    console.log(data.toString());
});


// let a=[];
// for(let i=0;i<100;i++){
//     a.push(Math.round(Math.random()*1000,0));
// }
// console.log(a.filter(x=>x<500).join("  "));