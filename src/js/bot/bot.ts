import { Interaction, REST, Routes, Client, GatewayIntentBits, Guild, Message } from "discord.js";
import { update_guild, create_guild, update_guild_users, increment_user } from "../util/guild";
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

const unreal_bot = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers]});

unreal_bot.on("ready", (bot)=>{
    console.log(`logged in on ${unreal_bot.user.tag}`);
    bot.guilds.fetch().then(v=>{
        var allkeys = v.keys()
        for(var ckey = allkeys.next(); ckey.done !== true; ckey = allkeys.next())
            create_guild(ckey.value)
    })
});

unreal_bot.on("messageCreate", (msg: Message)=>{
    create_guild(msg.guild.id);
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
            await interact.reply("");
            break;
        case "unreal":
            if(typeof interact.options.get("increment").value !== "number"){
                await interact.reply("Wait how are you doing this?");
                return;
            }
            increment_user(interact.guildId, interact.options.get("user").member, interact.options.get("increment").value).then(v=>{

            })
            await interact.reply("b");
            break;
        case "get-unreal":
            await interact.reply("b");
            break;
        default:
            await interact.reply(`This bot is probably running on an older version, it didn't recognize the "${interact.commandName}" command.`);
    }
})

unreal_bot.login(EVS.TOKEN);

export default unreal_bot;