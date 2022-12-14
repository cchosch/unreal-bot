from datetime import datetime
import os
import xlwt
import calendar
import sys
import json
from utils.utils import read_json

GUILD_PATH =os.path.join(os.getcwd(), "guilds")

def get_last_score(year: str, month: str, userid: str, guild_data: dict):
    if year not in guild_data["record"].keys():
        return 0
    if month not in guild_data["record"][year].keys() or userid not in guild_data["record"][year][month].keys():
        if int(month) != 1:
            return get_last_score(year, str(int(month)-1), userid, guild_data)
        return get_last_score(str(int(year)-1), "12", userid, guild_data)
    prev_unrealkeys = list(guild_data["record"][year][month][userid]["previous_unrealness"].keys())
    return guild_data["record"][year][month][userid]["previous_unrealness"][prev_unrealkeys[len(prev_unrealkeys)-1]]["value"]



def to_spreadsheet( guildid: str, year: int=None, month: int=None):
    if (month == None and year != None) or (year == None and month != None):
        print('invalid input')
        return
    
    wb = xlwt.Workbook()
    ws :xlwt.Worksheet = wb.add_sheet("monthly summary", cell_overwrite_ok=True)


    today = datetime.now()
    if month != None:
        if (year != today.year and month != today.month): # if month is not this month
            today = datetime(year, month, calendar.monthrange(year, month)[1])
        else:
            year = None
            month = None
    
    if year == None:
        year = today.year
    if month == None:
        month = today.month
    year = str(year)
    month = str(month)

    file_path = os.path.join(GUILD_PATH, f"{guildid}.json")
    if not os.path.exists(file_path):
        raise FileNotFoundError(file_path+" not found")
    guild = read_json(file_path)
    if year not in guild["record"].keys() or month not in guild["record"][year]:
        print("INVALID YEAR OR MONTH")
        return

    for i in range(1, today.day+1):
        ws.write(0, i, calendar.month_abbr[today.month]+" "+str(i))
    crow = 0
    for user in enumerate(guild["record"][year][month].keys()):
        '''
        # foreach user
        if int(month) == 1:
            assumed_val = get_last_score(str(int(year)-1), "12", user[1], guild)
        else:
            assumed_val = get_last_score(year, str(int(month)-1), user[1], guild)
        '''
        assumed_val = 0
        prev_unreal : dict= guild["record"][year][month][user[1]]["previous_unrealness"]
        unreal_keys = list(prev_unreal.keys())
        if len(unreal_keys) == 1:
            continue
        crow +=1

        ws.write(crow, 0, guild["record"][year][month][user[1]]["name"])

        for date in range(1, datetime.fromisoformat(unreal_keys[0]).day):
            ws.write(crow, date, assumed_val)
        c_i = 0
        for date in range(datetime.fromisoformat(unreal_keys[0]).day, today.day+1):
            if c_i+1 != len(unreal_keys):
                while datetime.fromisoformat(unreal_keys[c_i+1]).day == date:
                    c_i+=1
                    if c_i+1 == len(unreal_keys):
                        break
            ws.write(crow, date, prev_unreal[unreal_keys[c_i]]["value"])
            pass

    wb.save(os.path.join(os.getcwd(), f"{year}-{month}-{guildid}.xlsx"))


if __name__ == "__main__":
    if len(sys.argv) == 3:
        to_spreadsheet("914593613697142844", int(sys.argv[1]), int(sys.argv[2]))
    else:
        to_spreadsheet("914593613697142844")

