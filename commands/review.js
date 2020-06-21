const Moderator = require("../classes/Moderator");
const { CommandSession } = require("./commandSession");

module.exports = function (execObj, scope) {
  return { reply: "`REVIEW MENU`", session: new CommandSession(execObj, undefined, 5000) };
};
