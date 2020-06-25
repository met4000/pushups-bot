const Command = require("./Command");

module.exports = {
  help: new Command({ name: "help", aliasList: ["help", "h", "?"] }),
  points: new Command({ name: "points", aliasList: ["points", "p"] }),
};
