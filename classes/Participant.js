const Discord = require("discord.js");

const config = require("../config.json");

module.exports = class Participant {
  constructor(user) {
    if (user instanceof Discord.GuildMember) {
      this.userid = user.id;
      this.displayName = user.displayName;

      this.pushups = 0;
      this.nominations = 0;
    } else /* if (user instanceof Participant) */ {
      this.userid = user.userid;
      this.displayName = user.displayName;
      this.pushups = user.pushups;
      this.nominations = user.nominations;
    }
  }

  get points() { return Math.floor(this.pushups / config.pointCost); }
  set points(n) { this.pushups += (n - this.points) * config.pointCost; }

  static getID(participant) { return participant.userid; }
  getID() { return Participant.getID(this); }
};
