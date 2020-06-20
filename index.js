const Discord = require("discord.js");
const client = new Discord.Client();

const util = require("./util");
const db = require("./db");
const commandLoader = require("./commands/commandLoader");

const config = require("./config.json");
var _config = require("./_config.json");
if (!Array.isArray(_config.channelID)) _config.channelID = [_config.channelID];

var commands = {};
function getCommandByName(source, name) { return source[name]; }
var commandRegexp;


// Startup
util.info(suffix => `Load${suffix} commands`, () => {
  util.info(suffix => `Load${suffix} channel commands`, () => commands.channel = commandLoader.load(require("./commands/channel")), false);
  util.info(suffix => `Load${suffix} direct commands`, () => commands.direct = commandLoader.load(require("./commands/direct")), false);
});

// util.info("DB startup", () => {
{
  var dblist = [config.databases.participants, config.databases.submissions]
db.init();
  if (config.backup) db.backup(dblist);
  db.load(dblist);
}
// });


// Discord Behaviours
client.on("ready", () => {
  console.log(`Discord connected. Logged in as ${client.user.tag}.`);
  commandRegexp = new RegExp(`^${config.prefix}(?:${client.user.username}|${client.user.username[0]}) ([^ ]+)(?: (.*))?$`);
});

client.on("error", e => {
  console.error(`Unexpected error: ${e}`);
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
  
  if (config.verbose) logMessageVerbose("channel", msg, processed);

  var command = getCommandByName(commands.channel, processed.command);
  if (command === undefined) { return -1; } // TODO

  msg.channel.startTyping();
  var ret = command.exec({ args: processed.args, msg: msg }, { db: db, config: config });
  if (ret) msg.reply(ret.reply);
  msg.channel.stopTyping(true);
}

function directmsg(msg, processed) {
  if (config.verbose) logMessageVerbose("direct", msg, processed);

  var command = getCommandByName(commands.direct, processed.command);
  if (command === undefined) { return -1; } // TODO

  msg.channel.startTyping();
  var ret = command.exec({ args: processed.args, msg: msg }, { db: db, config: config });
  if (ret) msg.channel.send(ret.reply);
  msg.channel.stopTyping(true);
}


// Load discord
client.login(_config.token);
