module.exports = class Submission {
  constructor(user, url, claim) { // TODO: add check of user type (to have support for both Discord.User/Participant)
    this._id = undefined;
    this.userid = user.id;
    this.datetime = Date.now();
    this.url = url;
    this.claim = parseInt(claim);
    this.approved = null;

    this._id = this.getID();
  }

  static getID(submission) { return submission._id || `${submission.userid}_${submission.datetime}`; }
  getID() { return Submission.getID(this); }
};
