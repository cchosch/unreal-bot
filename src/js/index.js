const express = require("express");
const app = express();
require("./bot/bot");


app.get("/", (req, res)=>{
    res.send("");
})

app.listen(3502, ()=>{
    console.log("up")
});