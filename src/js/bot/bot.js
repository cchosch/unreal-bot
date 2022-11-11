const {REST, Routes, Client, GatewayIntentBits} = require("discord.js");
const commands = require("./commands");
const ENV_VARS = require("../load_env_vars");

const rest = new REST({version: '10'}).setToken(ENV_VARS.TOKEN);

(async () => {
    try {
      console.log('Started refreshing application (/) commands.');
  
      await rest.put(Routes.applicationCommands(ENV_VARS.CLIENT_ID), { body: commands });
  
      console.log('Successfully reloaded application (/) commands.');
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
            await interact.reply(`Pong! ${Math.abs(new Date() - interact.createdAt)} ms`);
            break;
        case "track":
            await interact.reply("");
            break;
        default:
            await interact.reply(`I think I'm running on an older version, I didn't recognize the "${interact.commandName}" command.`);
    }
})

unreal_bot.login(ENV_VARS.TOKEN)