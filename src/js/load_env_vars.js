const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { exit } = require("process");

const ENV_VARS = dotenv.parse(fs.readFileSync(path.join(__dirname, "..", "..", ".env")));
if(ENV_VARS.TOKEN === undefined || ENV_VARS.TOKEN === ''){
    console.log("Please supply token in .env file");
    console.log(ENV_VARS);
    exit();
}if(ENV_VARS.CLIENT_ID === undefined || ENV_VARS.CLIENT_ID === ''){
    console.log("Please supply client_id in .env file")
    console.log(ENV_VARS);
    exit();
}


module.exports = ENV_VARS;