import path from "path";
import fs from "fs";
import { handle_error_cb } from "./util";
import internal from "stream";
import { Guild, GuildMember, Interaction, User, APIInteractionDataResolvedGuildMember, DiscordAPIError } from "discord.js";
const guilds_path = path.join(__dirname, "..", "..", "guilds");

const to_iso_format = (date: Date)=>{
    return date.toISOString().replace("T", " ").replace("Z", "");
}

const get_nickname = (name: string, unrealness: number)=>{
    return name+` (${unrealness})`
}

const init_user = (name:string)=>{
    var now = new Date()
    var final_obj = {
        unrealness: 0,
        name: name,
        previous_unrealness: {
        }
    }
    final_obj.previous_unrealness[to_iso_format(now)] = { value: 0, reason: "init" }
    return final_obj;
}

/**
 * @param {Interaction} interaction
 * */
const update_guild_users = (guild: Guild) =>  {
    return new Promise((resolve, reject)=>{
        var now = new Date();
        update_guild(guild.id).then(()=>{
            var guild_obj = JSON.parse(fs.readFileSync(path.join(guilds_path, guild.id+".json")).toString())
            var this_month = guild_obj["record"][now.getFullYear()][(now.getMonth()+1)];
            var tracking: String[] = guild_obj["tracking"];
            var needs_writing = false;
            guild.members.fetch().then(members=>{
                members.forEach(memb=>{
                    if(!tracking.includes(memb.id)) return;
                    
                    if(!Object.keys(this_month).includes(memb.id)){
                        this_month[memb.id] = init_user(memb.user.username);
                        needs_writing = true;
                    }else if(this_month[memb.id].name !== memb.user.username){
                        this_month[memb.id].name = memb.user.username;
                        needs_writing = true;
                    }
                    
                    
                    if(memb.nickname !== get_nickname(memb.user.username, this_month[memb.id].unrealness))
                        memb.setNickname(get_nickname(memb.user.username, this_month[memb.id].unrealness)).catch((err)=>{
                            if(err.rawError.code === 50013)
                                return;
                        });

                    if(needs_writing)
                        fs.writeFileSync(path.join(guilds_path, guild.id+".json"), JSON.stringify(guild_obj, undefined, 2))

                    resolve({message: "Successfully updated all guild users"})
                });
            }).catch(err=>{
                console.log(err);
                reject({error: "update_guild error", message: "something went wrong", status_code: 500});
            });
            //guild_obj["record"][now.getFullYear().toString()][now.getMonth().toString()][]
        }).catch(handle_error_cb(reject));
    })
}

const create_guild = async (guildid: string)=>{
    // if guild file already exists
    if(fs.readdirSync(guilds_path, {withFileTypes: true}).filter(fl=> fl.isFile() && fl.name == guildid+".json").length === 1)
        return
    
    var today = new Date();

    var new_guild ={
        tracking: [],
        record: {
        }
    }
    new_guild.record[today.getFullYear().toString()] = {}
    new_guild.record[today.getFullYear().toString()][(today.getMonth()+1).toString()] = {};

    fs.writeFileSync(path.join(guilds_path, guildid+".json"), JSON.stringify(new_guild, undefined, 2))
}

/**
 * @description create_guild creates the guild file if there is none and updates latest year and month of guild file 
 * @param {string} guildid id of guild
 */
const update_guild = async (guildid: string)=>{
    return new Promise((resolve, reject)=>{
        var today = new Date();

        if(fs.readdirSync(path.join(guilds_path), {withFileTypes: true}).filter(fl=> fl.isFile() && fl.name === guildid+".json").length === 1){
            // guildjson exists
            var guild_obj = JSON.parse(fs.readFileSync(path.join(guilds_path, guildid+".json")).toString());
            var to_write = false;
            if(!Object.keys(guild_obj).includes("tracking")){
                guild_obj["tracking"] = [];
                to_write = true;
            }
            if (!Object.keys(guild_obj["record"]).includes(today.getFullYear().toString())){
                guild_obj["record"][today.getFullYear().toString()] = {};
                to_write = true;
            }
            if(!Object.keys(guild_obj["record"][today.getFullYear().toString()]).includes((today.getMonth()+1).toString())){
                guild_obj["record"][today.getFullYear().toString()][(today.getMonth()+1).toString()] = {};
                to_write = true;
            }

            if(to_write)
                fs.writeFileSync(path.join(guilds_path, guildid+".json"), JSON.stringify(guild_obj, undefined, 2));

            return resolve({message: "done"});
        }
        return reject({error: null, message: "guild doesn't exist", status_code: 404})
    })
}

/**
 * @param {Guild} guild 
 * @param {GuildMember} user 
 */
const track_guild_user = (guild: Guild, user: any) =>{
    return new Promise((resolve, reject)=>{
        update_guild(guild.id).then(v=>{
            var now = new Date();
            var guild_obj: Object = JSON.parse(fs.readFileSync(path.join(guilds_path, guild.id+".json")).toString())
            if(guild_obj["tracking"].includes(user.id))
                return resolve({message: `already tracking ${user.id}`})

            guild_obj["tracking"].push(user.id);
            guild_obj["record"][now.getFullYear().toString()][(now.getMonth()+1).toString()][user.id] = init_user(user.user.username);

            fs.writeFileSync(path.join(guilds_path,guild.id+".json"), JSON.stringify(guild_obj, undefined, 2));

            update_guild_users(guild).then(()=>{
                resolve({message: `Successfully added ${user.id} to ${guild.id}`});
            }).catch(handle_error_cb(reject));
        }).catch(handle_error_cb(reject));
    })
    
}

const stop_tracking_guild_user = (guildid: string, userid: string)=>{
    return new Promise((resolve, reject)=>{
        update_guild(guildid).then(()=>{
            var guild_obj: Object = JSON.parse(fs.readFileSync(path.join(guilds_path, guildid+".json")).toString())
            if(!guild_obj["tracking"].includes(userid))
                return;
            
            guild_obj["tracking"].splice(guild_obj["tracking"].indexOf(userid), 1)
            fs.writeFileSync(path.join(guilds_path,guildid+".json"), JSON.stringify(guild_obj, undefined, 2));
            resolve({message: `Successfully removed ${userid} from ${guildid}`});
        }).catch(handle_error_cb(reject));

    })
}

const person_exists = async (guildid: string, memberid: string, month: string, year: string)=>{
    return new Promise<Object>((resolve, reject)=>{
        var guild_filt = fs.readdirSync(guilds_path, {withFileTypes: true}).filter((val) =>{ return val.name === guildid+".json" && val.isFile() })
        if(guild_filt.length === 0) // guildid not in guilds folder
            return reject({error: `guildid ${guildid} not found`, message: "something went wrong", status_code: 500})
        
        var guild_obj = JSON.parse(fs.readFileSync(path.join(guilds_path, guild_filt[0].name)).toString())
        if(!Object.keys(guild_obj.record).includes(year) || !Object.keys(guild_obj.record[year]).includes(month)) // month or year not in record
            return reject({error: null, message: `Year ${year} or month ${month} not in guild record`, status_code: 500});
        if(!Object.keys(guild_obj.record[year][month]).includes(memberid)) // user not in year:month
            return reject({error: null, message: `User ${memberid} not found in guild ${guildid}`, status_code: 404})

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
            month = (today.getMonth()+1).toString();
        }

        person_exists(guildid, memberid, month, year).then((guild_json)=>{
            resolve(guild_json["record"][year][month][memberid]);
        }).catch(handle_error_cb(reject))

    });
}

/**
 * @param {Guild} guildid (required)
 * @param {GuildMember} member member of guild (required)
 * @param {number} increment ammount to increment unrealness score (required)
 * @param {string} reason_change? the reason for the change
 * @param {string} year? year to update
 * @param {string} month? month to update
 */
const increment_user = async (guild: Guild, member: any, increment: any, reason_change?: string, month?: string,  year?: string) =>{
    return new Promise<Object>(async (resolve, reject)=>{
        var today = new Date();
        if (year === undefined){
            year = today.getFullYear().toString();
        }if (month === undefined){
            month = (today.getMonth()+1).toString();
        }if(reason_change === undefined){
            reason_change = ""
        }

        if(typeof member === "string")
            member = {id: member}

        guild.members.fetch().then(v=>{
            var membs = Array.from(v.filter(memb=> memb.id === member.id))

            if(membs.length === 0)
                return reject({error: null, message: `User ${member.id} does not exist in guild`, status_code: 404});
            member = membs[0][1]
            update_guild(guild.id).then(()=>{
                var guild_json = JSON.parse(fs.readFileSync(path.join(guilds_path, guild.id+".json")).toString());
                if(!guild_json["tracking"].includes(member.id))
                    guild_json["tracking"].push(member.id)

                if(!Object.keys(guild_json["record"][year][month]).includes(member.id))
                    guild_json["record"][year][month][member.id] = init_user(member.user.username);
                
                var user_obj = guild_json["record"][year][month][member.id]
                user_obj.unrealness+=increment
                user_obj.previous_unrealness[new Date().toISOString().replace("T", " ").replace("Z", "")] = {
                    value: user_obj.unrealness,
                    reason: reason_change
                }

                if(guild.ownerId !== member.id)
                    member.setNickname(get_nickname(member.user.username, user_obj.unrealness))
                
                fs.writeFileSync(path.join(guilds_path, guild.id+".json"), JSON.stringify(guild_json, undefined, 2))
                resolve({message: `Updated user unrealness to ${user_obj.unrealness}`})
            })
        })

    });
}

export { increment_user, get_person, stop_tracking_guild_user, track_guild_user, create_guild, update_guild, update_guild_users, }