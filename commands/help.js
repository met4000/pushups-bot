const commandLoader = require("./commandLoader");
const Moderator = require("../classes/Moderator");

module.exports = function (execObj, scope) {
  var f;

  switch (execObj.args.length) {
    case 0:
      f = allHelp;
      break;

    case 1:
      f = specificHelp;
      break;

    default:
      return "`incorrect arg amount`"; // TODO: better feedback
  }

  return "\n" + f(execObj, scope, new Moderator({ ...execObj.msg.author, userid: execObj.msg.author.id }).isModerator(scope));
};

var commandsDesc = { universal: "Anywhere", channel: "Guild Channels", direct: "Direct Messages" };

function allHelp(execObj, scope, isModerator) {
  var ret = "```\n";

  ret += generateHeader(scope.config);

  // commands
  Object.entries(scope.commandsObject).forEach(([_k, v]) => {
    ret += `Works: ${commandsDesc[_k]}\n`;
    Object.entries(v).forEach(([k, command]) => {
      if (k !== command.aliasList[0]) return;
      if (command.moderatorOnly) if (!isModerator) return;

      ret += padMultiline(
        command.name,
        scope.config.commands.help.commandNameWidth,
        command.description === undefined ? "[no description provided]" : command.description.short,
        scope.config.commands.help.width
      );
    });
    ret += "\n";
  });

  ret += "```\n";
  return ret;
}

function specificHelp(execObj, scope, isModerator) {
  var commandName = execObj.args[0];
  var type = undefined, command;
  ["universal", ...(["channel", "direct"][Moderator.isGuildMemberObject(execObj.msg.author) ? "slice" : "reverse"]())].some(t => { // "channel" and "direct" flip if in DMs instead of a GuildChannel
    command = commandLoader.getByName(scope.commandsObject[t], commandName);
    if (command === undefined) return false;
    if (command.moderatorOnly) if (!isModerator) return false;

    type = t;
    return true;
  });
  if (type === undefined) return "`command not found`"; // TODO: better feedback

  if (command.description === undefined) return "`no command description provided`"; // TODO: better feedback


  // Generate response

  var ret = "```\n";

  ret += generateHeader(scope.config);

  // conditions
  ret += "(";
  ret += `${type} command`;
  if (command.moderatorOnly) ret += ", MODERATOR ONLY";
  ret += ", aliases: ";
  command.aliasList.forEach(v => ret += v + ", ");
  ret = ret.slice(0, -2); // remove the last 2 characters
  ret += ")\n";

  // command usage
  ret += `${(command.description.specific || {}).call}\n`;

  // arguments
  if (((command.description.specific || {}).parameters || []).length > 0) {
    var hasOptional = false;
    command.description.specific.parameters.forEach(obj => {
      if (obj.optional) hasOptional = true;

      ret += padMultiline(
        `${obj.optional ? "*" : " "} ${obj.parameter}`,
        scope.config.commands.help.commandParamWidth,
        obj.description,
        scope.config.commands.help.width
      );
    });
    if (hasOptional) ret += "(* optional parameter)\n";
  }

  // (long) description
  if ((command.description.specific || {}).long !== undefined) {
    ret += "\n";
    var arr = command.description.specific.long;
    if (!Array.isArray(arr)) arr = [arr];
    arr.forEach(v => ret += splitByWidth(v, scope.config.commands.help.width).join("\n") + "\n");
  }

  ret += "```\n";
  return ret;
}

function generateHeader(config) {
  var centre = "  HELP  MENU  ";

  var side = (config.commands.help.width - centre.length) / 2;
  if (side % 1 !== 0) console.error(`ERR: 'side' (${side}) is not an integer`); // I don't think this should happen?
  side = "-".repeat(side);

  return side + centre + side + "\n";
}

function splitByWidth(str, width) {
  var split = str.split(" "), ret = [];
  for (var i = 0, n = 0, combined; i < split.length; i++) {
    if (ret[n] === undefined) { ret[n] = split[i]; continue; }
    combined = `${ret[n]} ${split[i]}`;
    if (combined.length > width) { n++; i--; continue; }
    ret[n] = combined;
  }
  return ret;
}

function padMultiline(a, aWidth, b, width) {
  var ret = a.padEnd(aWidth);

  if (ret.length > width) ret += "\n" + "".padEnd(aWidth);
  ret += "- ";

  var padLength = aWidth + 2, wrapLength = width - padLength;
  ret += splitByWidth(b, wrapLength).join("\n" + "".padEnd(padLength)) + "\n";

  return ret;
}
