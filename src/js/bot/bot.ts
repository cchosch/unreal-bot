import { Interaction, REST, Routes, Client, GatewayIntentBits, Guild, Message, GuildMember } from "discord.js";
import { update_guild, create_guild, update_guild_users, increment_user, track_guild_user, get_person } from "../util/guild";
const EVS = require("../load_env_vars");
var commands = require("./commands");

const rest = new REST({version: '10'}).setToken(EVS.TOKEN);

(async () => {
    try {
      await rest.put(Routes.applicationCommands(EVS.CLIENT_ID), { body: commands });
    } catch (error) {
      console.error(error);
    }
})();

const unreal_bot = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers]});

unreal_bot.on("ready", (bot)=>{
    console.log(`logged in on ${unreal_bot.user.tag}`);
    bot.guilds.fetch().then(v=>{
        var allkeys = v.keys()
        for(var ckey = allkeys.next(); ckey.done !== true; ckey = allkeys.next())
            create_guild(ckey.value)
    })
});

unreal_bot.on("messageCreate", (msg: Message)=>{
    update_guild_users(msg.guild).catch(err=>{console.log(err)});
});

unreal_bot.on("guildCreate", async (guild: Guild)=>{
    create_guild(guild.id);
})


unreal_bot.on("interactionCreate", async (interact: Interaction)=>{
    update_guild(interact.guildId)
    if (!interact.isChatInputCommand()) return;

    switch(interact.commandName){
        case "ping":
            await interact.reply(`Pong! ${Math.abs(new Date().getMilliseconds() - interact.createdAt.getMilliseconds())} ms`);
            break;
        case "track":
            track_guild_user(interact.guild, interact.member).then(async (msg: any)=>{
                await interact.reply(msg.message);
            }).catch(async err=>{
                await interact.reply(err.message);
            })
            break;
        case "unreal":
            var reason = interact.options.get("reason");
            if(typeof interact.options.get("increment").value !== "number" || (reason !== null && typeof reason.value !== "string")){
                await interact.reply("Wait how are you doing this?");
                return;
            }
            increment_user(interact.guild, interact.options.get("user").member, interact.options.get("increment").value).then(async v=>{
                console.log(v);
                await interact.reply("successful");
            }).catch(async err=>{
                await interact.reply(err.message);
            })
            break;
        case "get-unreal":
            await new Promise(r=> setTimeout(r, 10000));
            if(!(interact.options.get("user").member instanceof GuildMember)){
                await interact.reply("I'm sorry something went wrong");
                return;
            }
            var x: any = interact.options.get("user").member
            get_person(interact.guildId, x.id).then(async (local_user: any)=>{
                await interact.reply(`${x.user.username} ${local_user.unrealness}`);
            }).catch(async err=>{
                await interact.reply(err.message);
            })
            break;
        default:
            await interact.reply(`This bot is probably running on an older version, it didn't recognize the "${interact.commandName}" command.`);
    }
})

unreal_bot.login(EVS.TOKEN);

export default unreal_bot;