const universal = require("./universal");
const channel = require("./channel");
const direct = require("./direct");

module.exports = function (execObj, scope) {
  switch (execObj.args.length) {
    case 0:
      return "\n" + allHelp(execObj, scope);

    case 1:
      return "\n" + specificHelp(execObj, scope);

    default:
      return "`incorrect arg amount`"; // TODO: better feedback
  }
};

function allHelp(execObj, scope) {
  var ret = "```\n";

  // header
  {
    var centre = "  HELP  MENU  ";

    var side = (scope.config.commands.help.width - centre.length) / 2;
    if (side % 1 !== 0) console.error(`ERR: 'side' (${side}) is not an integer`); // I don't think this should happen?
    side = "-".repeat(side);

    ret += side + centre + side + "\n";
  }

  // commands
  var commands = {
    "Anywhere": require("./universal"),
    "Guild Channels": require("./channel"),
    "Direct Messages": require("./direct")
  };
  Object.keys(commands).forEach(k => {
    ret += `Works: ${k}\n`;
    Object.values(commands[k]).forEach(command => {
      var commandString = command.name.padEnd(scope.config.commands.help.commandNameWidth);
      if (commandString.length > scope.config.commands.help.width) {
        commandString += "\n" + "".padEnd(scope.config.commands.help.commandNameWidth);
      }
      commandString += "- ";
      if (command.description !== undefined) {
        var padLength = scope.config.commands.help.commandNameWidth + 2, wrapLength = scope.config.commands.help.width - padLength;
        commandString += `${command.description.short.replace(new RegExp(`(.{${wrapLength}})(?!$)`, "g"), "$1\n" + "".padEnd(padLength))}\n`;
      } else commandString += "[no description provided]";
      ret += commandString + "\n";
    });
    ret += "\n";
  });

  ret += "```\n";
  return ret;
}

function specificHelp(execObj, scope) {}
