module.exports = class Participant {
  constructor(user) { // discord.js user object
    this.userid = user.id;
    this.displayName = user.displayName;

    this.points = 0;
    this.nominations = 0;
  }

  static getID(participant) { return participant.userid; }
  getID() { return Participant.getID(this); }
};
