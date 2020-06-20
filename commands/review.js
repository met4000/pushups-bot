const Moderator = require("../classes/Moderator");
const { MemoryCommand } = require("../commands/commandMemory");

module.exports = function (execObj, scope) {
  return { reply: "`REVIEW MENU`", save: new MemoryCommand(execObj, () => {}, 5000) };
};
