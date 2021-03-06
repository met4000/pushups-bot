const Discord = require("discord.js");
global.client = new Discord.Client();
const deasync = require("deasync-promise");

const util = require("./util");
const db = require("./db");
const commandLoader = require("./commands/commandLoader");
const Moderator = require("./classes/Moderator");
const commandSession = require("./commands/commandSession");

const config = require("./config.json");
var _config = process.env.HEROKU ? new Proxy(process.env, { get: (...args) => JSON.parse(Reflect.get(...args))}) : require("./_config.json");
if (!Array.isArray(_config.channelIDs)) _config.channelIDs = [_config.channelIDs];

var cachedChannels = {};

var commands = { universal: {}, channel: {}, direct: {} };
var commandRegexp;
function processCommandString(str) {
  var processed = commandRegexp.exec(str);
  if (!processed) return;
  return { command: processed[1], args: processed[2] ? processed[2].split(" ") : [] };
}

function generateScope() {
  return { db: db, cachedChannels: cachedChannels, commandsObject: commands, config: config };
}


// Startup
util.info(suffix => `Load${suffix} commands`, () => {
  util.info(suffix => `Load${suffix} universal commands`, () => commandLoader.load(commands.universal, require("./commands/universal")), false);
  util.info(suffix => `Load${suffix} channel commands`, () => commandLoader.load(commands.channel, require("./commands/channel")), false);
  util.info(suffix => `Load${suffix} direct commands`, () => commandLoader.load(commands.direct, require("./commands/direct")), false);
});

util.info("DB startup", () => {
  var dblist = [config.databases.moderators, config.databases.participants, config.databases.submissions];
  db.init(_config.mongodb_un, _config.mongodb_pw, _config.debug);
  if (config.backup) db.backup(dblist);
  db.load(dblist);
});


// Discord Behaviours
client.on("ready", () => {
  console.info(`Info: Discord connected. Logged in as ${client.user.tag}.`);

  commandRegexp = new RegExp(`^(?:${client.user.username}|${client.user.username[0]})${config.prefix}([^ ]+)(?: (.*))?$`);
  
  console.info("Info: Async fetching channels...");
  _config.channelIDs.forEach(channelID => {
    console.info(`Info: Async fetching '${channelID}'...`);
    client.channels.fetch(channelID).then(v => {
      cachedChannels[v.id] = v;
      console.info(`Info: Fetched '${v.id}' (${v.name})`);
    });
  });

  client.user.setStatus(_config.debug ? "dnd" : "online");
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
  return commandSessionCommandHandler(msg, cs, { ...commands.channel, ...commands.universal });
}

function commandSessionDirectHandler(msg, cs) {
  return commandSessionCommandHandler(msg, cs, { ...commands.direct, ...commands.universal });
}

function commandSessionCommandHandler(msg, cs, commandSource) {
  if (config.verbose) logMessageVerbose("c_session", msg, msg.content);

  var command = commandLoader.getByName(commandSource, cs.commandName); // could probs move this to CommandSession constructor, but eh
  
  cs.message.channel.startTyping();
  var ret = command.exec({ args: msg.content.split(" "), msg: msg, cs: cs }, generateScope());
  if (ret === undefined) ret = {};
  if (ret.edit !== undefined) cs.message.edit(ret.edit);
  if (ret.reply !== undefined) cs.message.channel.send(ret.reply);
  cs.message.channel.stopTyping(true);
  return true;
}

function commandHandler(msg, processed, command, replyFunc) {
  if (command.moderatorOnly) if (!(new Moderator({ ...msg.author, userid: msg.author.id }).isModerator({ db: db, config: config }))) return;

  msg.channel.startTyping();
  var ret = command.exec({ args: processed.args, msg: msg, commandName: command.name }, generateScope());
  if (ret === undefined) ret = {};
  if (ret.session !== undefined) if (!commandSession.add(ret.session)) console.error("Error: Failed to save command session"); // TODO: better feedback
  if (ret.reply !== undefined) replyFunc(ret.reply || "`err no reply`", ret.attachments || []).then(ret.session ? v => commandSession.getByID(ret.session.getID()).message = v : () => {});
  msg.channel.stopTyping(true);
  return true;
}

function channelmsg(msg, processed) {
  if (!_config.channelIDs.includes(msg.channel.id)) return;
  
  if (config.verbose) logMessageVerbose("channel", msg, processed);

  var command = commandLoader.getByName({ ...commands.channel, ...commands.universal }, processed.command);
  if (command === undefined) { return; } // TODO

  return commandHandler(msg, processed, command, v => msg.reply(v));
}

function directmsg(msg, processed) {
  if (!Object.values(cachedChannels).some(cachedChannel => cachedChannel.members.has(msg.author.id))) return;

  if (config.verbose) logMessageVerbose("direct", msg, processed);

  var command = commandLoader.getByName({ ...commands.direct, ...commands.universal }, processed.command);
  if (command === undefined) { return; } // TODO

  return commandHandler(msg, processed, command, v => msg.channel.send(v));
}


// Load discord
client.login(_config.token);
