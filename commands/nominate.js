const Participant = require("../classes/Participant");
const util = require("../util");

module.exports = function (execObj, scope) {
  // check number of args
  if (execObj.args.length !== 1) return "`incorrect arg amount`"; // TODO: better feedback
  
  // check arg type
  var nominee = /^<@!(\d+)>$/.exec(execObj.args[0]); // user ID, assuming valid input
  if (nominee === null) return "`invalid arg`"; // TODO: better feedback

  // check user in channel
  nominee = execObj.msg.channel.members.get(nominee[1]); // GuildMember object, assuming in the channel
  if (nominee === undefined) return "`user not in channel`"; // TODO: better feedback
  var nominator = execObj.msg.channel.members.get(execObj.msg.author.id); // GuildMember object, assuming in the channel, which they kinda should be to have sent a message there...

  // check they're not trying to nominate a bot
  if (nominee.user.bot) return "`cannot nominate bot`"; // TODO: better feedback

  // check that they're not trying to nominate themselves
  if (nominator.id === nominee.id) return "`cannot nominate yourself`"; // TODO: better feedback

  // get stats 'n' stuff
  var pNominator = new Participant(nominator), pNominee = new Participant(nominee);
  var dbret = scope.db.select({ _id: { $in: [pNominator.getID(), pNominee.getID()] } }, scope.config.databases.participants);
  if (dbret === null) return "(when getting stats): `err db bad response`";
  var stats = util.mapArrayToObject(dbret.map(v => new Participant(v)), o => o.getID());

  // check db results, and add peeps if they don't exist
  var dbfail = false;
  [{ u: nominator, p: pNominator }, { u: nominee, p: pNominee }].forEach(v => {
    if (stats[v.p.getID()] === undefined) {
      if (scope.config.verbose) console.info(`Info: Inserting new participant '${v.u.displayName} (${v.u.id})' with id '${v.p.getID()}'`);
      if (scope.db.basicInsertFailCheck(scope.db.insert(v.p, scope.config.databases.participants), 1)) dbfail = true;
      stats[v.p.getID()] = v.p;
    }
  });
  if (dbfail) return "(when inserting new participants): `err db bad response`"; // TODO: better feedback

  // check that the nominator has enough points
  if (stats[pNominator.getID()].points < 1) return "`not enough points`"; // TODO: better feedback

  // update stats
  var newStats = util.objectMap(stats, v => new Participant(v)), dbfail = false;
  newStats[pNominator.getID()].points--;
  newStats[pNominator.getID()].nominations--; // because nominations are now intrinsicly tied to points :)
  newStats[pNominee.getID()].nominations++;
  [pNominator.getID(), pNominee.getID()].forEach(el => {
    if (scope.db.basicUpdateFailCheck(scope.db.update({ _id: el }, newStats[el], scope.config.databases.participants), 1)) dbfail = true;
  });
  if (dbfail) return "(when updating participants): `err db bad response`"; // TODO: better feedback
  
  var nominatorStatsText = `${nominator.displayName}: ${stats[pNominator.getID()].points} -> ${newStats[pNominator.getID()].points} points`;
  var nomineeStatsText = `${nominee.displayName}: ${stats[pNominee.getID()].nominations} -> ${newStats[pNominee.getID()].nominations} nominations`;
  return `<@!${nominee.id}> has been nominated!\n(${nominatorStatsText}, ${nomineeStatsText})`;
};
