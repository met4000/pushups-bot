const Command = require("./Command");

module.exports = {
  submit: new Command("submit", ["submit", "s", "video", "v"], require("./submit")),
  quota: new Command("quota"), // TODO
  
  review: new Command("review", ["review", "r"], require("./review"), true),
};
