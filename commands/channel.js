const Command = require("./Command");

module.exports = {
  nominate: new Command({ name: "nominate", aliasList: ["nominate", "nom", "n"] })
};
