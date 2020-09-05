const BaseUser = require("./BaseUser");

const config = require("../config.json");

module.exports = class Participant extends BaseUser {
  constructor(user) {
    super(user);

    if (BaseUser.isGuildMemberObject(user)) {
      this.pushups = 0;
      this._nominations = 0;
    } else {
      this.pushups = user.pushups;
      this._nominations = user.nominations;
    }
  }

  get points() { return Math.floor(this.pushups / config.pointCost); }
  set points(n) { this.pushups += (n - this.points) * config.pointCost; }

  get nominations() { return Math.max(this._nominations - this.points, 0); }
  set nominations(n) { this._nominations += n - this.nominations; }  // ! POSSIBLE FUTURE BUG (ALLOWS `_nominations` TO GO BELOW 0)

  get spare() { return this.pushups - this.points * config.pointCost; }
};
