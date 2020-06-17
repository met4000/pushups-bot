const Command = require("./command");

module.exports = {
  nominate: new Command("nominate", ["nominate", "nom", "n"], require("./nominate"))
};
