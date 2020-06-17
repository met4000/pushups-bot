const Discord = require("discord.js");
const client = new Discord.Client();

const db = require("./db");

const config = require("./config.json");
var _config = require("./_config.json");
if (!Array.isArray(_config.channelID)) _config.channelID = [_config.channelID];

var commandRegexp;


// Startup
db.Init();
if (config.backup) db.Backup();
db.Load();


// Discord Behaviours
client.on("ready", () => {
  console.log(`Discord connected. Logged in as ${client.user.tag}.`);
  commandRegexp = new RegExp(`^${config.prefix}(?:${client.user.username}|${client.user.username[0]}) ([^ ]+)(?: (.*))?$`);
});

client.on("error", e => {
  console.error(`Unexpected error: ${e}.`);
});

client.on("message", msg => {
  if (msg.author.bot) return;

  var processed = commandRegexp.exec(msg.content);
  if (!processed) return;
  processed = { command: processed[1], args: processed[2] ? processed[2].split(" ") : [] };

  if (msg.channel instanceof Discord.TextChannel) channelmsg(msg, processed);
  if (msg.channel instanceof Discord.DMChannel) directmsg(msg, processed);
});

function logMessageVerbose(type, msg, processed) {
  var msgString = JSON.stringify({
    author: msg.author.tag,
    channelID: msg.channel.id
  }), processedString = JSON.stringify(processed);

  console.log(`${type}: ${msgString}, ${processedString}`);
};

function channelmsg(msg, processed) {
  if (!_config.channelID.includes(parseInt(msg.channel.id))) return;
  
  if (config.verbose) logMessageVerbose("text", msg, processed);
  
  // process channel commands
}

function directmsg(msg, processed) {
  if (config.verbose) logMessageVerbose("direct", msg, processed);

  // process dm commands
}


// Load discord
client.login(_config.token);
