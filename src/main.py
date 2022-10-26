import json
import discord
import time
import os
import platform
import asyncio
import datetime
from dotenv import load_dotenv
from utils.utils import read_json
from utils.utils import write_json

SLSH = "/"
if platform.system() == "Windows":
    SLSH="\\"


class Client(discord.Client):
    def __init__(self, intents=None):
        super().__init__(intents=intents)

        self.json_path = os.getcwd()+SLSH+"guilds"
        if not os.path.exists(self.json_path):
            os.mkdir(self.json_path)

        self.tree = discord.app_commands.CommandTree(self)

        @self.tree.command(name="get-unreal", description="get users unrealness factor")
        async def get_unreal(interaction: discord.Interaction, user: discord.Member):

            u_unreal = await self.get_user_unrealness(interaction.guild, user)

            if u_unreal == None:
                await interaction.response.send_message("Something went wrong")
            else:
                await interaction.response.send_message(f"{user.name}'s unrealness factor is {u_unreal}")

        @self.tree.command(name="unreal", description="add or subtract to a users unreal factor")
        async def unreal(interaction: discord.Interaction, increment:int, user: discord.Member):
            msg = await self.update_user_unrealness(increment, interaction.guild, user.id)
            await interaction.response.send_message(msg)
            await self.update_members_of_guild(interaction.guild)

    @staticmethod
    def init_user(name: str, time: datetime.datetime):
        return {"unrealness": 0, "name": name, "previous_unrealness": {str(time): {"value": 0, "reason": "init"}}}

    @staticmethod
    def empty_guild():
        return {"record": {}}
    
    def get_file_path(self, guildid, extension=".json"):
        return self.json_path+SLSH+str(guildid)+extension

    async def get_user_unrealness(self, guild: discord.Guild, user: discord.Member) -> int:
        await self.create_guild_json_file(guild)
        await self.update_members_of_guild(guild)

        json_file = read_json(self.get_file_path(guild.id))
        today = datetime.datetime.now()
        year = str(today.year)
        month = str(today.month)

        if (not year in json_file["record"].keys()) or (not month in json_file["record"][year].keys()):
            return

        if not str(user.id) in json_file["record"][year][month].keys():
            return

        return json_file["record"][year][month][str(user.id)]["unrealness"]

    async def update_user_unrealness(self, delta: int, guild: discord.Guild, user: int) -> str:
        await self.create_guild_json_file(guild)

        json_file = read_json(self.get_file_path(guild.id))

        today = datetime.datetime.now()
        year = str(today.year)
        month = str(today.month)

        if (not year in json_file["record"].keys()) or (not month in json_file["record"][year].keys()):
            return "something went wrong 72"

        if not str(user) in json_file["record"][year][month].keys():
            return "something went wrong 75"


        json_file["record"][year][month][str(user)]["unrealness"]+=delta
        json_file["record"][year][month][str(user)]["previous_unrealness"][str(today)] = {"value": json_file["record"][year][month][str(user)]["unrealness"], "reason": ""}
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
                now = datetime.datetime.now()
                json_file["record"][year][month][str(user.id)] = Client.init_user(user.name, now)
        else:
            for user in guild.members:
                if not str(user.id) in json_file["record"][year][month].keys():
                    json_file["record"][year][month][str(user.id)] = Client.init_user(user.name, now)
                json_file["record"][year][month][str(user.id)]["name"] = user.name
        
        write_json(self.get_file_path(guild.id), json_file)

    async def update_members_of_guild(self, guild: discord.Guild):
        today = datetime.datetime.now()
        year = str(today.year)
        month = str(today.month)

        await self.create_guild_json_file(guild)

        json_file = read_json(self.get_file_path(guild.id))
        if (not year in json_file["record"].keys()) or (not month in json_file["record"][year].keys()):
            return
        if guild.id == 914593613697142844:
            HC = guild.get_role(914617397481177150)
            NHC = guild.get_role(956032889370329099)

        for member_obj in guild.members:
            if member_obj.id == guild.owner_id:
                continue

            if guild.id == 914593613697142844:
                if not (HC in member_obj.roles or NHC in member_obj.roles):
                    continue

            mem_obj = json_file["record"][year][month][str(member_obj.id)]
            await member_obj.edit(nick=member_obj.name+" ("+str(mem_obj["unrealness"])+")")

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

