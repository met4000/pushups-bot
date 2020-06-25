const Command = require("./Command");

module.exports = {
  submit: new Command({ name: "submit", aliasList: ["submit", "s", "video", "v"] }),
  quota: new Command({ name: "quota", aliasList: [], exec: () => {} }), // TODO
  
  review: new Command({ name: "review", aliasList: ["review", "r"], moderatorOnly: true }),
};
