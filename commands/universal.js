const Command = require("./Command");

module.exports = {
  points: new Command("points", ["points", "p"], require("./points")), // TODO
};
