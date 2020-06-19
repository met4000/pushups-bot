const Command = require("./Command");

module.exports = {
  nominate: new Command("nominate", ["nominate", "nom", "n"], require("./nominate"))
};
