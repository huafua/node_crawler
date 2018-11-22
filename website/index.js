const express = require("express");
const fs=require("fs");
const path=require("path");

var app = express();
app.use("/second", function (req, res) {
    res.redirect("/third");
    res.end();
});
app.use("/third", function (req, res) {
    res.redirect("/fourth");
});
app.use("/fourth", function (req, res) {
    res.redirect("/fifth");
});
app.use("/fifth", function (req, res) {
    res.redirect("/sixth");
});
app.use("/sixth", function (req, res) {
    res.redirect("/seventh");
});
app.use("/seventh", function (req, res) {
    res.redirect("/eigth");
});

app.use("/eigth", function (req, res) {
    res.redirect("/ninth");
    res.end();
});

app.use("/ninth", function (req, res) {
    res.redirect("/tenth");
    res.end();
});
app.use("/tenth", function (req, res) {
    res.redirect("/eleventh");
    res.end();
});
app.use("/eleventh", function (req, res) {
    res.redirect("/twelveth");
    res.end();
});
app.use("/twelveth", function (req, res) {
    res.redirect("/thirteenth");
    res.end();
});
app.use("/thirteenth", function (req, res) {
    res.redirect("/fourteenth");
    res.end();
});
app.use("/fourteenth", function (req, res) {
    res.redirect("/fifteenth");
    res.end();
});
app.use("/fifteenth", function (req, res) {
    res.redirect("/sixteenth");
    res.end();
});
app.use("/sixteenth", function (req, res) {
    res.redirect("/seventeenth");
    res.end();
});
app.use("/seventeenth", function (req, res) {
  fs.readFile(path.join(__dirname,"data.html"),"utf-8",function(err,data){
      if(err){
          res.send(err);
      }else{
          res.send(data.toString());
      }
      res.end();
  })
});
app.use("/index",function(req,res){
    res.redirect("/second");
})
app.use("/", function (req, res) {
    res.redirect("/index");
});

app.listen(8080, function () {
    console.log("server started at 8080");
})