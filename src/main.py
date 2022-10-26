import json
import discord
import os
import platform
import datetime
from dotenv import load_dotenv

SLSH = "/"
if platform.system() == "Windows":
    SLSH="\\"


def read_json(file_path :str) -> dict:
    file = open(file_path, "r")
    cont = json.loads(file.read())
    file.close()
    return cont

def write_json(file_path:str, json_dat : dict):
    file = open(file_path, "w")
    file.write(json.dumps(json_dat, indent=2))
    file.close()


class Client(discord.Client):
    def __init__(self, intents=None):
        super().__init__(intents=intents)

        self.json_path = os.getcwd()+SLSH+"guilds"
        if not os.path.exists(self.json_path):
            os.mkdir(self.json_path)

        self.tree = discord.app_commands.CommandTree(self)

        @self.tree.command(name="unreal", description="add or subtract to a users unreal counter")
        async def unreal(interaction: discord.Interaction, increment:int, user: discord.Member):
            msg = await self.update_user_unrealness(increment, interaction.guild, user.id, interaction)
            await interaction.response.send_message(msg)
            await self.update_members_of_guild(interaction.guild)

    @staticmethod
    def empty_guild():
        return {"record": {}}
    
    def get_file_path(self, guildid, extension=".json"):
        return self.json_path+SLSH+str(guildid)+extension

    async def update_user_unrealness(self, delta: int, guild: discord.Guild, user: int, interaction: discord.Interaction) -> str:
        if not str(guild.id)+".json" in os.listdir(self.json_path):
            await self.create_guild_json_file(guild)
        json_file = read_json(self.get_file_path(guild.id))

        today = datetime.datetime.now()
        year = str(today.year)
        month = str(today.month)

        if (not year in json_file["record"].keys()) or (not month in json_file["record"][year].keys()):
            return "something went wrong 57"

        if not str(user) in json_file["record"][year][month].keys():
            return "something went wrong 59"

        json_file["record"][year][month][str(user)]["unrealness"]+=delta
        write_json(self.get_file_path(guild.id), json_file)
        usr = guild.get_member(user)
        return f"Unrealness for {usr.name} updated to "+str(json_file["record"][year][month][str(user)]["unrealness"])

    async def create_guild_json_file(self, guild: discord.Guild):
        if not str(guild.id)+".json" in os.listdir(self.json_path):
            write_json(self.get_file_path(guild.id), Client.empty_guild())
        json_file = read_json(self.get_file_path(guild.id))

        today = datetime.datetime.now()
        year = str(today.year)
        month = str(today.month)
        if not year in list(json_file["record"].keys()):
            json_file["record"][year] = { month : {}}
        
        if not month in json_file["record"][year]:
            print("NOT IN MONTH")
            json_file["record"][year][month] = {}
        
        if json_file["record"][year][month] == {}:
            for user in guild.members:
                json_file["record"][year][month][str(user.id)] = {"unrealness": 0, "name": user.name}
        else:
            for user in guild.members:
                json_file["record"][year][month][str(user.id)]["name"] = user.name
        
        write_json(self.get_file_path(guild.id), json_file)

    async def update_members_of_guild(self, guild: discord.Guild):
        today = datetime.datetime.now()
        year = str(today.year)
        month = str(today.month)

        if not os.path.exists(self.get_file_path(guild.id)):
            return

        json_file = read_json(self.get_file_path(guild.id))
        if (not year in json_file["record"].keys()) or (not month in json_file["record"][year].keys()):
            return
        for member in json_file["record"][year][month].keys():
            if int(member) == guild.owner_id:
                continue
            mem_obj = json_file["record"][year][month][member]
            await guild.get_member(int(member)).edit(nick=mem_obj["name"]+" ("+str(mem_obj["unrealness"])+")")

    async def on_ready(self):
        print(f"Logged in as {self.user}")
        await self.tree.sync()
        for guild in self.guilds:
            if not os.path.exists(self.get_file_path(guild.id)):
                write_json(self.get_file_path(guild.id), Client.empty_guild())

    async def on_member_join(self, member :discord.Member):
        print(member.id)
        pass

    async def on_message(self, message : discord.Message):
        if message.author.id == self.application_id:
            return

        await self.create_guild_json_file(message.guild)

        await self.update_members_of_guild(message.guild)

if __name__ == "__main__":

    load_dotenv()

    if os.getenv("TOKEN") == "" or os.getenv("TOKEN") == None:
        print(f"INVALID TOKEN \""+os.getenv("TOKEN")+"\"")
        quit()

    intents = discord.Intents.default()
    intents.message_content = True
    intents.members = True



    client = Client(intents=intents)

    client.run(os.getenv("TOKEN"))

