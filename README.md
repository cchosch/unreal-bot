# unreal-bot
this is a discord bot to tally up the unrealness factor of a given individual in discord


# Installation
run `pip3 install -r requirements.txt` and create a `./.env` file

to put your token in, just write `TOKEN=` in the `.env` file followed by your bot's token

to put your client id in, write `CLIENT_ID=` in the `.env` file followed by your bot's client id

# Run
finally, run `python3 src/main.py` and the bot will handle the rest

# Guild JSON Documentation

## User JSON
| name                | type   | description                                          |
| ------------------- | ------ | ---------------------------------------------------- |
| name                | string | name of user                                         |
| unrealness          | int    | current unrealness score                             |
| previous_unrealness | object | log of previous unrealness scores at different times |

## previous unrealness
| key                | type   | description            |
| ------------------ | ------ | ---------------------- |
| date in iso format | object | dated unrealness value |

## dated unrealness
| name   | type   | description                  |
| ------ | ------ | ---------------------------- |
| value  | int    | unrealness value at the time |
| reason | string | reason for unrealness change |