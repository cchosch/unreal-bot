import Express from "express";
import { get_person, increment_user, track_guild_user } from "./util/guild";
import {Client} from "discord.js";
import unreal_bot from "./bot/bot";
import fs from "fs";
import path from "path";
import express from "express";
const app = express();
const port = 3502;
const guilds_path = path.join(__dirname, "..", "guild");

app.use(express.json())

app.get("/", (req, res)=>{
    res.send("");
})

app.put("/track-user", (req: Express.Request, res: Express.Response)=>{
    if(typeof req.body.gid !== "string" || req.body.gid === undefined)
        return res.status(400).json({message: "gid not initialized properly"});
    if(typeof req.body.uid !== "string" || req.body.uid === undefined)
        return res.status(400).json({message: "uid not initialized properly"});

    unreal_bot.guilds.fetch(req.body.gid).then(guild=>{
        guild.members.fetch(req.body.uid).then(memb=>{
            track_guild_user(guild, memb).then(msg=>{
                res.json(msg);
            }).catch(err=>{
                return res.status(err.status_code).json({error: err.message});
            })
        }).catch(err=>{
            if(Object.keys(err.rawError.errors).includes("user_id"))
                return res.status(404).json({error: `user ${req.body.uid} not in guild ${req.body.gid} or ${req.body.uid} not a valid id`})
        })
    }).catch(err=>{
        if(Object.keys(err.rawError.errors).includes("guild_id"))
            return res.status(404).json({error: `Bot is not in server with id ${req.body.gid} or id is invalid`});
        console.log(err);

        return res.json({error: "something went wrong"});
    })
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