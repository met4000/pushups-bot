const { CommandSession } = require("./commandSession");

module.exports = function (execObj, scope) {
  if (execObj.cs !== undefined) return c_session(execObj, execObj.cs, scope);
  else return initial(execObj, scope);
};

function initial(execObj, scope) {
  var cs = new CommandSession(execObj, undefined, 5000);
  cs.expecting = ["t"];

  return { reply: "`REVIEW MENU`", session: cs };
}

function c_session(execObj, cs, scope) {
  //
  cs.add(execObj.args[0]);

  return `\`Touched ${cs.commandList.length - 1}\``
}
