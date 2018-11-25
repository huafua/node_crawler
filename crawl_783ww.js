const request=require("request");
const JSDOM=require("jsdom").JSDOM;
const path=require("path");
const fs=require("fs");
const url=require("url");


let save_path="783ww";
let delay=2000;

let start_url="https://www.783ww.com/Html/84/13269.html";

let headers={
    "User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) snap Chromium/70.0.3538.77 Chrome/70.0.3538.77 Safari/537.36"
};
function save_single_novel(novel_url){
    
    request({
        url:novel_url,
        headers:headers
    },function(err,res,body){
        if(err){
            console.log(err);
        }else{
            if(res.statusCode==200){
                try{
                    let dom=new JSDOM(body.toString());
                    let document=dom.window.document;
                    console.log(novel_url);
                    let novel_title=document.querySelector("div.page_title h1").innerHTML;
                    let novel_content=document.querySelector("div.content font").innerHTML;
                    let save_file=path.join(__dirname,save_path,novel_title+".txt");
                    fs.writeFile(save_file,novel_title+"\n"+novel_content,function(err){
                        if(err){
                            console.log("Failed to save date");
                        }else{
                            console.log("Novel saved to "+save_file);
                        }
                    })
                }catch(er){
                    console.log(er);
                }
            }else{
                console.log("Got nothing, status code:"+res.statusCode);
            }
        }
    })
}

function get_single_page_urls(start_url,callback){
    let urlObject=url.parse(start_url);
    let webSiteBase=urlObject.protocol+"//"+urlObject.host;
    request({
        url:start_url,
        headers:headers
    },function(err,res,body){
        if(err){
            console.log(err);
        }else{
            if(res.statusCode==200){
                let dom=new JSDOM(body.toString());
                let document=dom.window.document;
                let novel_link_elements=document.querySelectorAll("div.box.list.channel ul li a");
                Array.prototype.forEach.call(novel_link_elements,function(novel_link_element){
                    callback&&callback(webSiteBase+novel_link_element.getAttribute("href"))
                });
                for(let i=0;i<novel_link_elements.length;i++){
                    (function(index){
                       setTimeout(function(){
                            callback&&callback(webSiteBase+novel_link_elements[index].getAttribute("href"))
                       },index*delay);
                    })(i)
                }
            }else{
                console.log("Got nothing, status code:"+res.statusCode);
            }
        }
    })
}

// get_single_page_urls("https://www.783ww.com/Html/84/",save_single_novel);

function craw_all(start_url,callback){
    let urlObject=url.parse(start_url);
    let webSiteBase=urlObject.protocol+"//"+urlObject.host;
    request({
        url:start_url,
        headers:headers
    },function(err,res,body){
        if(err){
            console.log(err);
        }else{
            if(res.statusCode==200){
                let dom=new JSDOM(body.toString());
                let document=dom.window.document;
                let pages=document.querySelectorAll("div.pagination a");
                let last_page_link=pages[pages.length-1].getAttribute("href");
                last_page_link_parts=last_page_link.split("-");
                let suffix_name_parts=last_page_link_parts[1].split(".");
                let page_count=suffix_name_parts[0];
                for(let i=1;i<=10;i++){
                    (function(index){
                        setTimeout(function(){
                            let sing_page_url=webSiteBase+last_page_link_parts[0]+"-"+index+"."+suffix_name_parts[1]
                            callback&&callback(sing_page_url);
                        },index*delay);                        
                    })(i)
                    
                }
            }else{
                console.log("Got nothing, status code:"+res.statusCode);
            }
        }
    })
}
craw_all("https://www.783ww.com/Html/84/",function(sing_page_url){
    get_single_page_urls(sing_page_url,save_single_novel)
    // console.log(sing_page_url)
});