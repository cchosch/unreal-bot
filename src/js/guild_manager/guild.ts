import path from "path";
import fs from "fs";
import { handle_error_cb } from "../util/util";
import internal from "stream";
import { Interaction } from "discord.js";
const guilds_path = path.join(__dirname, "..", "..", "guilds");

/**
 * @param {Interaction} interaction
 * */
const update_guild_users = (interaction: Interaction) =>  {
    create_guild(interaction.guildId);
    var guild_obj = JSON.parse(fs.readFileSync(path.join(guilds_path, interaction.guildId+".json")).toString())
    if(guild_obj.tracking.length === 0)
        return;

    interaction.guild.members.fetch({user: guild_obj.tracking})
    return
    
}

/**
 * @description create_guild creates the guild file if there is none and updates latest year and month of guild file 
 * @param {string} guildid id of guild
 */
const create_guild = (guildid: string)=>{
    var today = new Date();

    if(fs.readdirSync(path.join(guilds_path, guildid+".json"), {withFileTypes: true}).filter(fl=> fl.isFile() && fl.name === guildid+".json").length === 1){
        // guildjson exists
        var guild_obj = JSON.parse(fs.readFileSync(path.join(guilds_path, guildid+".json")).toString());
        if (!Object.keys(guild_obj["record"]).includes(today.getFullYear().toString())){
            guild_obj["record"][today.getFullYear().toString()] = {}
        }
        if(!Object.keys(guild_obj["record"][today.getFullYear().toString()]).includes(today.getMonth().toString()))
            guild_obj["record"][today.getFullYear().toString()][today.getMonth().toString()] = {}
        return fs.writeFileSync(path.join(guilds_path, guildid+".json"), JSON.stringify(guild_obj));
    }
    var new_guild ={
        tracking: [],
        record: {
        }
    }
    new_guild.record[today.getFullYear().toString()] = {}
    new_guild.record[today.getFullYear().toString()][today.getMonth().toString()] = {};

    fs.writeFileSync(path.join(guilds_path, guildid+".json"), JSON.stringify(new_guild))
}

const track_guild_user = (guildid: string, userid: string) =>{
    create_guild(guildid);
    
    var guild_obj: Object = JSON.parse(fs.readFileSync(path.join(guilds_path, guildid+".json")).toString())
    if(Object.keys(guild_obj).includes("tracking")){
        guild_obj["tracking"].push(userid)
    }
}

const person_exists = async (guildid: string, memberid: string, month: string, year: string)=>{
    return new Promise<Object>((resolve, reject)=>{
        var guild_filt = fs.readdirSync(guilds_path, {withFileTypes: true}).filter((val) =>{ return val.name === guildid+".json" && val.isFile() })
        if(guild_filt.length === 0) // guildid not in guilds folder
            return reject({error: `guildid ${guildid} not found`, message: "something went wrong", status_code: 500})
        
        var guild_obj = JSON.parse(fs.readFileSync(path.join(guilds_path, guild_filt[0].name)).toString())
        if(!Object.keys(guild_obj.record).includes(year) || !Object.keys(guild_obj.record[year]).includes(month)) // month or year not in record
            return reject({error: `year ${year} or month ${month} not in guild record`, message: `something went wrong`, status_code: 500});
        if(!Object.keys(guild_obj.record[year][month]).includes(memberid)) // user not in year:month
            return reject({error: `member (${memberid}) not in guild (${guildid})`, message: `user not found`, status_code: 404})

        resolve(guild_obj)
    })
}

/**
 * 
 * @param {string} guildid id of guild (required)
 * @param {string} memberid id of member (required)
 * @param {string} month? month of person
 * @param {string} year? year of person 
 * @returns {Promise} member object for year and month
 */
const get_person = async (guildid: string, memberid: string, month?: string, year?: string) =>{
    return new Promise<Object>(async (resolve, reject)=>{
        var today = new Date();
        if (year === undefined){
            year = today.getFullYear().toString();
        }if (month === undefined){
            month = today.getMonth().toString();
        }

        person_exists(guildid, memberid, month, year).then((guild_json)=>{
            resolve(guild_json["record"][year][month][memberid]);
        }).catch(err=>{
            console.log("person_exists ERR:\n"+err.error)
            reject(err)
        })

    });
}

/**
 * @param {string} guildid id of guild (required)
 * @param {string} memberid id of member (required)
 * @param {number} increment ammount to increment unrealness score (required)
 * @param {string} reason_change? the reason for the change
 * @param {string} year? year to update
 * @param {string} month? month to update
 */
const increment_user = async (guildid: string, memberid: string, increment: number, reason_change?: string, month?: string,  year?: string) =>{
    return new Promise<Object>(async (resolve, reject)=>{
        var today = new Date();
        if (year === undefined){
            year = today.getFullYear().toString();
        }if (month === undefined){
            month = today.getMonth().toString();
        }if(reason_change === undefined){
            reason_change = ""
        }

        person_exists(guildid, memberid, month, year).then(guild_json=>{
            var user_obj = guild_json["record"][year][month][memberid]
            user_obj.unrealness+=increment
            user_obj.previous_unrealness[new Date().toISOString().replace("T", " ").replace("Z", "")] = {
                value: user_obj.unrealness,
                reason: reason_change
            }
            fs.writeFileSync(path.join(guilds_path, guildid+".json"), JSON.stringify(guild_json, undefined, 2))
            resolve({message: `Updated user unrealness to ${user_obj.unrealness}`})
        }).catch(err=>{
            console.log("update_person \n"+err)
            reject(err);
        })
    });
}

export { increment_user, get_person, track_guild_user, create_guild, update_guild_users, }