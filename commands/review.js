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
  var commands = {};
  
  if (execObj.args[0]) cs.add(execObj.args[0]);
  else { // root
    commands = { "t": "touch" };
  }
  
  cs.expecting = Object.keys(commands);
  return generateMenu(cs, { commands: commands }, scope.config);
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
  data.display;

  // commands
  ret += "Commands:\n";
  Object.keys(data.commands).forEach(v => ret += v.padEnd(config.commandSession.commandNameWidth) + "- " + data.commands[v] + "\n");
  ret += "back".padEnd(config.commandSession.commandNameWidth) + "- close the submenu (go back)\n";
  ret += "close".padEnd(config.commandSession.commandNameWidth) + "- close the menu entirely\n";

  return ret + "\n```";
}
