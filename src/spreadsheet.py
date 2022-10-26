import os
import json
import xlwt
from utils.utils import read_json
from utils.utils import write_json

GUILD_PATH =os.path.join(os.getcwd(), "guilds")

xlwt.Workbook()

def to_spreadsheet(year: str, month: str, guildid: str):
    file_path = os.path.join(GUILD_PATH, f"{guildid}.json")
    if not os.path.exists(file_path):
        raise FileNotFoundError(file_path+" not found")
    guild = read_json(file_path)
    if year not in guild["record"].keys() or month not in guild["record"][year]:
        print("INVALID YEAR OR MONTH")
        return
    
    for user in guild["record"][year][month].keys():
        print(user+": "+json.dumps(guild["record"][year][month][user]["previous_unrealness"]))


if __name__ == "__main__":
    to_spreadsheet("2022", "10", "763224124612542504")
    pass

