const Submission = require("../classes/Submission");

module.exports = function (execObj, scope) {
  // check number of args
  if (![1, 2].includes(execObj.args.length)) return "`incorrect arg amount`"; // TODO: better feedback

  // get the author's user object
  var user = execObj.msg.author;

  // get the stuff from the args
  var claim, url;
  if (execObj.args.length === 1) {
    var attachments = execObj.msg.attachments;

    if (attachments.size < 1) return "`no attached video`";
    if (attachments.size > 1) return "`too many attached videos`";

    claim = parseInt(execObj.args[0]);
    url = attachments.first().url;
  } else if (execObj.args.length === 2) {
    var i = execObj.args.findIndex(v => Number.isInteger(parseInt(v)));

    if (i === -1) return "`could not find claim arg`"; // TODO: better feedback

    claim = parseInt(execObj.args[i]);
    url = execObj.args[~i + 2];
  } else { throw new Error("FATAL ERROR: INVALID ARGUMENT COUNT PAST ARGUMENT COUNT CHECK"); }

  // check claim and url data validity
  if (!Number.isInteger(claim)) return "`invalid claim datatype`";
  if (claim < 1) return "`invalid claim data`";
  if (!isValidURL(url)) return "`invalid URL`";

  // check url not already submitted
  var newSubmission = new Submission(user, url, claim);
  var res = scope.db.Select("*", scope.config.databases.submissions, v => v.url === newSubmission.url);
  if (res.length > 0) return `\`url already submitted by '${scope.db.Select("displayName", scope.config.databases.participants, v => v.userid === res[0].userid)[0]}'\``;

  // add to DB
  scope.db.Insert({ [newSubmission.getID()]: newSubmission }, scope.config.databases.submissions);
  scope.db.Save(scope.config.databases.submissions);

  return "Your submission has received. You will receive a notification once a moderator has reviewed it.";
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
