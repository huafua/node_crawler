//这个脚本的目的是取出数据库中的小说并导出为txt格式供手机阅读，为让手机能够正确识别章节，格式为:第几章  章节标题\n章节正文\n
const sqlite=require("sqlite3");
const db=new sqlite.Database("data.sqlite");
const fs=require("fs");

//#region  
db.serialize(function(){
db.all("select distinct novel_name from xs",function(err,novels){
    if(err){
        console.log(err);
    }else{
        if(novels.length>0){
            novels.forEach(function(novel){
                console.log(novel.novel_name);
                db.all("select chapter_index,chapter,content from xs where novel_name='"+novel.novel_name+"'",function(err,data){
                    if(err){
                        console.log(err);
                    }else{
                        let str="";
                        data.forEach(function(item){
                            str+=item.chapter_index+" "+item.chapter+"\n"+item.content+"\n";
                        });
                        fs.writeFile(novel.novel_name+".txt",str,function(err){
                            if(err){
                                console.log(err);
                            }else{
                                console.log("job done");
                            }
                        })            
                    }
                });
            })
            
        }else{
            console.log("no novel found");
        }
    }
})
    
})
//#endregion