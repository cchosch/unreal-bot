import Express from "express";
const express = require("express");
const app = express();
const port = 3502;
import { get_person, increment_user } from "./guild_manager/guild";
require("./bot/bot");

app.use(express.json())

app.get("/", (req, res)=>{
    res.send("");
})

app.put("/track-user", (req: Express.Request, res: Express.Response)=>{
    res.send("");
})

app.put("/increment-user", (req: Express.Request, res: Express.Response)=>{
    console.log(req.body)
    if(typeof req.body.uid !== "string" || req.body.uid === undefined)
        return res.json({error: "invalid uid"});

    if(typeof req.body.gid !== "string" || req.body.gid === undefined)
        return res.json({error: "invalid gid"});

    
    if(typeof req.body.increment !== "number" || req.body.increment === undefined)
        return res.json({error: "increment is invalid"});
    if(req.body.reason !== undefined && typeof req.body.reason !== "string")
        return res.json({error: "invalid type of reason"});
    
    
    increment_user(req.body.gid, req.body.uid, req.body.increment, req.body.reason).then(v=>{
        res.json(v)
    }).catch(reason=>{
        console.log(reason.error)
        res.status(reason.status_code).json({error: reason.message})
    })
});

app.listen(port, ()=>{
    console.log(`Running on port ${port}`)
});