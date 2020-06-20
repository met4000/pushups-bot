const Discord = require("discord.js");

module.exports = class BaseUser {
  constructor(user) {
    if (BaseUser.isGuildMemberObject(user)) {
      this.userid = user.id;
      this.displayName = user.displayName;
    } else {
      this.userid = user.userid;
      this.displayName = user.displayName;
    }
  }

  static isGuildMemberObject(user) { return user instanceof Discord.GuildMember; }

  static getID(user) { return user.userid; }
  getID() { return BaseUser.getID(this); }
};
