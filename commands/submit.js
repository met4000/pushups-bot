const Submission = require("../classes/Submission");
const Participant = require("../classes/Participant");

module.exports = function (execObj, scope) {
  // check number of args
  if (![1, 2].includes(execObj.args.length)) return "`incorrect arg amount`"; // TODO: better feedback

  // get the author's user object
  var user = execObj.msg.author;
  // add them if they don't exist
  var dbfail = false;
  {
    var pUser = new Participant({ ...user, userid: user.id }), dbret = scope.db.select({ _id: pUser.getID() }, scope.config.databases.participants, true);
    if (dbret === null) {
      if (scope.config.verbose) console.info(`Info: Inserting new participant '${user.displayName} (${user.id})' with id '${pUser.getID()}'`);
      if (scope.db.basicInsertFailCheck(scope.db.insert(pUser, scope.config.databases.participants), 1)) dbfail = true;
    }
  }
  if (dbfail) return "(when inserting new participant): `err db bad response`"; // TODO: better feedback

  // get the stuff from the args
  var claim, url;
  if (execObj.args.length === 1) {
    var attachments = execObj.msg.attachments;

    if (attachments.size < 1) return "`no attached video`"; // TODO: better feedback
    if (attachments.size > 1) return "`too many attached videos`"; // TODO: better feedback

    claim = parseInt(execObj.args[0]);
    url = attachments.first().url;
  } else if (execObj.args.length === 2) {
    var i = execObj.args.findIndex(v => Number.isInteger(parseInt(v)));

    if (i === -1) return "`could not find claim arg`"; // TODO: better feedback

    claim = parseInt(execObj.args[i]);
    url = execObj.args[~i + 2];
  } else { throw new Error("FATAL ERROR: INVALID ARGUMENT COUNT PAST ARGUMENT COUNT CHECK"); }

  // check claim and url data validity
  if (!Number.isInteger(claim)) return "`invalid claim datatype`"; // TODO: better feedback
  if (claim < 1) return "`invalid claim data`"; // TODO: better feedback
  if (!isValidURL(url)) return "`invalid URL`"; // TODO: better feedback

  // check url not already submitted
  var newSubmission = new Submission(user, url, claim), oldSubmission;
  {
    var dbret = scope.db.select({ url: newSubmission.url }, scope.config.databases.submissions, true);
    // ! TODO: ERROR HANDLING
    if (dbret !== null) oldSubmission = dbret;
  }
  if (oldSubmission !== undefined) {
    var displayName;
    {
      var dbret = scope.db.select({ _id: Participant.getID({ userid: oldSubmission.userid }) }, scope.config.databases.participants, true);
      if (dbret !== null) displayName = dbret.displayName;
    }
    return displayName !== undefined ? `\`url already submitted by '${displayName}'\`` : "(when selecting participant name): `err db bad response`"; // TODO: better feedback
  }

  // add to DB
  if (scope.db.basicInsertFailCheck(scope.db.insert(newSubmission, scope.config.databases.submissions), 1))
    return "(when inserting new submission): `err db bad response`"; // TODO: better feedback

  return "Your submission has been received. You will receive a notification once a moderator has reviewed it.";
};

function isValidURL(string) {
  var url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;  
  }

  return url.protocol === "http:" || url.protocol === "https:";
}
