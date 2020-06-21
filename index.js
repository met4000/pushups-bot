const Discord = require("discord.js");
global.client = new Discord.Client();

const util = require("./util");
const db = require("./db");
const commandLoader = require("./commands/commandLoader");
const commandSession = require("./commands/commandSession");

const config = require("./config.json");
var _config = require("./_config.json");
if (!Array.isArray(_config.channelID)) _config.channelID = [_config.channelID];

var commands = {};
function getCommandByName(source, name) { return source[name]; }
var commandRegexp;
function processCommandString(str) {
  var processed = commandRegexp.exec(str);
  if (!processed) return;
  return { command: processed[1], args: processed[2] ? processed[2].split(" ") : [] };
}


// Startup
util.info(suffix => `Load${suffix} commands`, () => {
  util.info(suffix => `Load${suffix} channel commands`, () => commands.channel = commandLoader.load(require("./commands/channel")), false);
  util.info(suffix => `Load${suffix} direct commands`, () => commands.direct = commandLoader.load(require("./commands/direct")), false);
});

// util.info("DB startup", () => {
{
  var dblist = [config.databases.participants, config.databases.submissions];
  db.init();
  if (config.backup) db.backup(dblist);
  db.load(dblist);
}
// });


// Discord Behaviours
client.on("ready", () => {
  console.log(`Discord connected. Logged in as ${client.user.tag}.`);
  commandRegexp = new RegExp(`^(?:${client.user.username}|${client.user.username[0]})${config.prefix}([^ ]+)(?: (.*))?$`);
});

client.on("error", e => {
  console.error(`Unexpected error: ${e}`);
});

client.on("message", msg => {
  if (msg.author.bot) return;

  var commandSessionID = commandSession.CommandSession.getIDByMessage(msg);
  if (commandSession.includes(commandSessionID)) commandSessionCommandHandler(msg, commandSession.getByID(commandSessionID));

  var processed = processCommandString(msg.content);
  if (processed === undefined) return;

  if (msg.channel instanceof Discord.TextChannel) channelmsg(msg, processed);
  if (msg.channel instanceof Discord.DMChannel) directmsg(msg, processed);
});

function logMessageVerbose(type, msg, data) {
  var msgString = JSON.stringify({
    author: msg.author.tag,
    channelID: msg.channel.id
  }), dataString = JSON.stringify(data);

  console.log(`${type}: ${msgString}, ${dataString}`);
};

function commandSessionCommandHandler(msg, cs) {
  if (config.verbose) logMessageVerbose("c_session", msg, "[CommandSession]");

  cs.touch();
  msg.reply("`TOUCHED`");
}

function channelmsg(msg, processed) {
  if (!_config.channelID.includes(parseInt(msg.channel.id))) return;
  
  if (config.verbose) logMessageVerbose("channel", msg, processed);

  var command = getCommandByName(commands.channel, processed.command);
  if (command === undefined) { return -1; } // TODO

  msg.channel.startTyping();
  var ret = command.exec({ args: processed.args, msg: msg }, { db: db, config: config });
  if (ret.session) if (!commandSession.add(ret.session)) console.error("Error: Failed to save command session"); // TODO: better feedback
  if (ret) msg.reply(ret.reply);
  msg.channel.stopTyping(true);
}

function directmsg(msg, processed) {
  if (config.verbose) logMessageVerbose("direct", msg, processed);

  var command = getCommandByName(commands.direct, processed.command);
  if (command === undefined) { return -1; } // TODO

  msg.channel.startTyping();
  var ret = command.exec({ args: processed.args, msg: msg }, { db: db, config: config });
  if (ret.session) if (!commandSession.add(ret.session)) console.error("Error: Failed to save command session"); // TODO: better feedback
  if (ret) msg.channel.send(ret.reply);
  msg.channel.stopTyping(true);
}


// Load discord
client.login(_config.token);
