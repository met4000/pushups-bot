const Discord = require("discord.js");
const deasync = require("deasync-promise");

module.exports = class BaseUser {
  constructor(user) {
    this._id = undefined;
    if (BaseUser.isGuildMemberObject(user)) {
      this.userid = user.id;
      this.displayName = user.displayName;
    } else {
      this.userid = user.userid;
      this.displayName = user.displayName;
    }
    this._id = this.getID();
  }

  static isGuildMemberObject(user) { return user instanceof Discord.GuildMember; }
  static isUserObject(user) { return user instanceof Discord.User; }

  static getID(user) { return user._id || user.userid; }
  getID() { return BaseUser.getID(this); }

  getUserObject() { return deasync(global.client.users.fetch(this.userid)); }
};
