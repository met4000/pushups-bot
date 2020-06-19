const Command = require("./Command");

module.exports = {
  submit: new Command("submit", ["submit", "s", "video", "v"], require("./submit"))
};
