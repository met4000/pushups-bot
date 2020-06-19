module.exports = class Participant {
  constructor(user) { // discord.js user object
    this.id = user.id;
    this.displayName = user.displayName;

    this.points = 0;
    this.nominations = 0;
  }
};
