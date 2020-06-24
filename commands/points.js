const Participant = require("../classes/Participant");
const util = require("../util");

const rankList = require("../rankList.json");

module.exports = function (execObj, scope) {
  // check number of args
  if (execObj.args.length > 0) return "`incorrect arg amount`"; // TODO: better feedback

  // GuildMember object, assuming in the channel, which they kinda should be to have sent a message there...
  var user;
  for (const cachedChannel of Object.values(scope.cachedChannels)) {
    if (cachedChannel.members.has(execObj.msg.author.id)) user = cachedChannel.members.get(execObj.msg.author.id);
  }
  if (user === undefined) return "`could not get user object`"; // should not get here

  // get stats 'n' stuff
  var pUser = new Participant(user);
  var dbret = scope.db.select({ _id: pUser.getID() }, scope.config.databases.participants, true);
  if (dbret === null) {
    if (scope.config.verbose) console.info(`Info: Inserting new participant '${user.displayName} (${user.id})' with id '${pUser.getID()}'`);
    if (scope.db.basicInsertFailCheck(scope.db.insert(pUser, scope.config.databases.participants), 1)) return "(when inserting new participant): `err db bad response`"; // TODO: better feedback
  } else pUser = new Participant(dbret);

  // generate display string
  var ret = "```\n";
  
  { // header
    var width = scope.config.commands.points.headerWidth;

    var centre = pUser.displayName;
    if (centre.length < width) centre = ` ${centre} `;
    if (pUser.displayName.length % 2 === 1) if (centre.length < width) centre = `${centre}-`;

    var side = (width - centre.length) / 2;
    if (side % 1 !== 0) console.error(`ERR: 'side' (${side}) is not an integer`); // I don't think this should happen?
    side = "-".repeat(side);

    ret += side + centre + side + "\n";
  }

  // data
  for (const [key, value] of Object.entries({
    "id": JSON.stringify(pUser.getID()),
    "userid": JSON.stringify(pUser.userid),
    "rank": scope.config.commands.points.joshRank ? getJoshRank(pUser, scope) : getRank(pUser, scope),
    "current points": pUser.points,
    "nominations": pUser.nominations,
    "spare pushups": pUser.spare
  })) {
    ret += `${key}:`.padEnd(scope.config.commands.points.keyWidth) + value + "\n";
  }

  ret += "```\n"
  return ret;
};

function getRank(participant, scope) {
  var dbret = scope.db.select({}, scope.config.databases.participants);
  if (dbret === null) return "`err db bad response`";
  return ordinalise(dbret.sort((a, b) => b.pushups - a.pushups).sort((a, b) => b.pushups - a.pushups).findIndex(v => Participant.getID(v) === participant.getID()) + 1);
}

function getJoshRank(participant, scope) {
  var dbret = scope.db.select({}, scope.config.databases.participants);
  if (dbret === null) return "`err db bad response`";
  return rankList[dbret.sort((a, b) => a.userid - b.userid).findIndex(v => Participant.getID(v) === participant.getID())];
}

function ordinalise(n) { return n + ([,'st','nd','rd'][n / 10 % 10^1 && n % 10] || 'th'); }
