const {REST, Routes, Client, GatewayIntentBits} = require("discord.js");
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

const unreal_bot = new Client({intents: [GatewayIntentBits.Guilds]});

unreal_bot.on("ready", ()=>{
    console.log(`logged in on ${unreal_bot.user.tag}`);
});

unreal_bot.on("interactionCreate", async (interact)=>{
    if (!interact.isChatInputCommand()) return;

    switch(interact.commandName){
        case "ping":
            await interact.reply(`Pong! ${Math.abs(new Date().getMilliseconds() - interact.createdAt)} ms`);
            break;
        case "unreal":
            await interact.reply("");
            break;
        case "get-unreal":
            await interact.reply("");
            break;
        default:
            await interact.reply(`This bot is probably running on an older version, it didn't recognize the "${interact.commandName}" command.`);
    }
})

unreal_bot.login(EVS.TOKEN)