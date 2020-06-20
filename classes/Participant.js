const BaseUser = require("./BaseUser");

const config = require("../config.json");

module.exports = class Participant extends BaseUser {
  constructor(user) {
    super(user);

    if (BaseUser.isGuildMemberObject(user)) {
      this.pushups = 0;
      this.nominations = 0;
    } else {
      this.pushups = user.pushups;
      this.nominations = user.nominations;
    }
  }

  get points() { return Math.floor(this.pushups / config.pointCost); }
  set points(n) { this.pushups += (n - this.points) * config.pointCost; }
};
