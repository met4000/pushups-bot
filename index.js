const Discord = require("discord.js");
global.client = new Discord.Client();

const util = require("./util");
const db = require("./db");
const commandLoader = require("./commands/commandLoader");
const commandSession = require("./commands/commandSession");

const config = require("./config.json");
var _config = require("./_config.json");
if (!Array.isArray(_config.channelID)) _config.channelID = [_config.channelID];

function generateScope() {
  return { db: db, config: config };
}

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

  var ret = (() => {
    var cs = commandSession.getByID(commandSession.CommandSession.getIDByMessage(msg));
    if (cs !== undefined) {
      if (msg.channel instanceof Discord.TextChannel) return commandSessionChannelHandler(msg, cs);
      if (msg.channel instanceof Discord.DMChannel) return commandSessionDirectHandler(msg, cs);
    }

  var processed = processCommandString(msg.content);
  if (processed === undefined) return;

    if (msg.channel instanceof Discord.TextChannel) return channelmsg(msg, processed);
    if (msg.channel instanceof Discord.DMChannel) return directmsg(msg, processed);
  })();
});

function logMessageVerbose(type, msg, data) {
  var msgString = JSON.stringify({
    author: msg.author.tag,
    channelID: msg.channel.id
  }), dataString = JSON.stringify(data);

  console.log(`${type}: ${msgString}, ${dataString}`);
};

function commandSessionChannelHandler(msg, cs) {
  return commandSessionCommandHandler(msg, cs, commands.channel);
}

function commandSessionDirectHandler(msg, cs) {
  return commandSessionCommandHandler(msg, cs, commands.direct);
}

function commandSessionCommandHandler(msg, cs, commandSource) {
  if (config.verbose) logMessageVerbose("c_session", msg, msg.content);

  cs.message.channel.startTyping();
  var command = getCommandByName(commandSource, cs.commandName); // could probs move this to CommandSession constructor, but eh
  var ret = command.exec({ args: msg.content.split(" "), msg: msg, cs: cs }, generateScope());
  if (ret === undefined) ret = {};
  if (ret.reply !== null) cs.message.edit(ret.reply || "`ERR NO REPLY`");
  cs.message.channel.stopTyping(true);
}

function commandHandler(msg, processed, command, replyFunc) {
  msg.channel.startTyping();
  var ret = command.exec({ args: processed.args, msg: msg, commandName: processed.command }, generateScope());
  if (!commandSession.add(ret.session)) console.error("Error: Failed to save command session"); // TODO: better feedback
  if (ret) replyFunc(ret.reply).then(ret.session ? v => commandSession.getByID(ret.session.getID()).message = v : () => {});
  msg.channel.stopTyping(true);
}

function channelmsg(msg, processed) {
  if (!_config.channelID.includes(parseInt(msg.channel.id))) return;
  
  if (config.verbose) logMessageVerbose("channel", msg, processed);

  var command = getCommandByName(commands.channel, processed.command);
  if (command === undefined) { return -1; } // TODO

  commandHandler(msg, processed, command, v => msg.reply(v));
}

function directmsg(msg, processed) {
  if (config.verbose) logMessageVerbose("direct", msg, processed);

  var command = getCommandByName(commands.direct, processed.command);
  if (command === undefined) { return -1; } // TODO

  commandHandler(msg, processed, command, v => msg.channel.send(v));
}


// Load discord
client.login(_config.token);
