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

  // get stats 'n' stuff
  var nominator = execObj.msg.channel.members.get(execObj.msg.author.id); // GuildMember object, assuming in the channel, which they kinda should be to have sent a message there...
  var pNominator = new Participant(nominator), pNominee = new Participant(nominee);
  var stats = util.mapArrayToObject(scope.db.select("*", scope.config.databases.participants, v => [pNominator.getID(), pNominee.getID()].includes(Participant.getID(v))).map(v => new Participant(v)), o => o.getID());

  // check db results, and add peeps if they don't exist
  var inserted = [{ u: nominator, p: pNominator }, { u: nominee, p: pNominee }].reduce((r, v) => {
    if (stats[v.p.getID()] === undefined) {
      if (scope.config.verbose) console.info(`Info: Inserting new participant '${v.u.displayName} (${v.u.id})' with id '${v.p.getID()}'`);
      scope.db.insert({ [v.p.getID()]: v.p }, scope.config.databases.participants);
      stats[v.p.getID()] = v.p;
      return true;
    }
    return r;
  });

  // check that the nominator has enough points
  if (stats[pNominator.getID()].points < 1) {
    if (inserted) scope.db.save(scope.config.databases.participants);
    return "`not enough points`"; // TODO: better feedback
  }

  // update stats
  var newStats = util.objectMap(stats, v => new Participant(v));
  newStats[pNominator.getID()].points--;
  newStats[pNominee.getID()].nominations++;
  [pNominator.getID(), pNominee.getID()].forEach(el => scope.db.update(newStats[el], scope.config.databases.participants, v => v.userid === el));
  scope.db.save(scope.config.databases.participants);
  
  var nominatorStatsText = `${nominator.displayName}: ${stats[pNominator.getID()].points} -> ${newStats[pNominator.getID()].points} points`;
  var nomineeStatsText = `${nominee.displayName}: ${stats[pNominee.getID()].nominations} -> ${newStats[pNominee.getID()].nominations} nominations`;
  return `<@!${nominee.id}> has been nominated!\n(${nominatorStatsText}, ${nomineeStatsText})`;
};


