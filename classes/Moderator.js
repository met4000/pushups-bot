const BaseUser = require("./BaseUser");

module.exports = class Moderator extends BaseUser {
  isModerator({ db, config }) {
    var dbret = db.select({ _id: this.getID() }, config.databases.moderators, true);
    // ! TODO: ERROR HANDLING
    return dbret !== null;
  }
};
