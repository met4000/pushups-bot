module.exports = class Submission {
  constructor(user, url, claim) {
    this.userid = user.id;
    this.datetime = Date.now();
    this.url = url;
    this.claim = parseInt(claim);
    this.approved = null;
  }

  static getID(submission) { return `${submission.userid}_${submission.datetime}`; }
  getID() { return Submission.getID(this); }
};
