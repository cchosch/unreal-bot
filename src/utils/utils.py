import json

def read_json(file_path :str) -> dict:
    file = open(file_path, "r")
    cont = json.loads(file.read())
    file.close()
    return cont

def write_json(file_path:str, json_dat : dict):
    file = open(file_path, "w")
    file.write(json.dumps(json_dat, indent=2))
    file.close()