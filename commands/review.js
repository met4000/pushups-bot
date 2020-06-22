const { CommandSession } = require("./commandSession");

module.exports = function (execObj, scope) {
  if (execObj.cs !== undefined) return c_session(execObj, execObj.cs, scope);
  else return initial(execObj, scope);
};

function initial(execObj, scope) {
  if (execObj.args.length !== 0) return "`incorrect arg amount`"; // TODO: better feedback

  var cs = new CommandSession(execObj, undefined, 15000);
  cs.expecting = ["t"];

  return { reply: c_session(execObj, cs, scope), session: cs };
}

function c_session(execObj, cs, scope) {
  // processing
  var data = { commands: {} };

  if (execObj.args.length > 1) return "`incorrect arg amount`"; // TODO: better feedback
  
  var command = execObj.args[0];
  if (command) {
    cs.add(command);
    switch (command) {
      case "t":
        data.display = "T";
        break;
    }
  } else { // root
    data.commands = { "t": "touch" };
  }
  
  cs.expecting = Object.keys(data.commands);
  return generateMenu(cs, data, scope.config);
}

function generateMenu(cs, data, config) { // TODO move to CommandSession
  var ret = "```\n";

  // current command
  ret += "> review";
  if (cs.commandList.length) ret += " / " + cs.commandList.join(" / ");
  ret += "\n";

  // header
  {
    var even = cs.commandName.length % 2 === 0, centre = cs.commandName.toUpperCase() + (even ? " " : "") + " MENU";
    
    if (centre.length < config.commandSession.menuWidth) centre = ` ${centre} `;
    if (even) if (centre.length < config.commandSession.menuWidth) centre = ` ${centre} `;

    var side = (config.commandSession.menuWidth - centre.length) / 2;
    if (side % 1 !== 0) console.error(`ERR: 'side' (${side}) is not an integer`); // I don't think this should happen?
    side = "-".repeat(side);

    ret += side + centre + side + "\n";
  }

  // data
  if (data.display) {
    if (typeof data.display === "object") Object.keys(data.display).forEach(k => ret += `${k}: ${JSON.stringify(data.display[k])}\n`);
    else ret += JSON.stringify(data.display) + "\n";
    ret += "\n";
  }

  // commands
  ret += "Commands:\n";
  Object.keys(data.commands).forEach(k => ret += k.padEnd(config.commandSession.commandNameWidth) + "- " + data.commands[k] + "\n");
  if (cs.commandList.length > 0) ret += "back".padEnd(config.commandSession.commandNameWidth) + "- close the submenu (go back)\n";
  ret += "close".padEnd(config.commandSession.commandNameWidth) + "- close the menu entirely\n";

  return ret + "\n```";
}
