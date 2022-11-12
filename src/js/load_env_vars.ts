import fs from "fs";
import path from "path";
import dotenv from "dotenv";
const { exit } = require("process");

const EVS = dotenv.parse(fs.readFileSync(path.join(__dirname, "..", ".env")));
if(EVS.TOKEN === undefined || EVS.TOKEN === ''){
    console.log("Please supply token in .env file ENV_VARS:");
    console.log(EVS);
    exit();
}if(EVS.CLIENT_ID === undefined || EVS.CLIENT_ID === ''){
    console.log("Please supply client_id in .env file ENV_VARS:")
    console.log(EVS);
    exit();
}


module.exports = EVS;