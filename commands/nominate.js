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
  var nominator = execObj.msg.channel.members.get(execObj.msg.author.id); // GuildMember object, assuming in the channel, which they kinda should be to haev sent a message there...
  var stats = util.MapToObject(scope.db.Select("*", scope.config.databases.participants, v => [nominator.id, nominee.id].includes(v.id)), o => o.id);

  // check db results, and add peeps if they don't exist
  var inserted = false;
  if (stats[nominator.id] === undefined) {
    inserted = true;
    var newNominator = { id: nominator.id, displayName: nominator.displayName, points: 0, nominations: 0 }; // TODO: make a Participant class somewhere else, to make sure inserts don't go wrong
    if (scope.config.verbose) console.info(`Info: Inserting new participant '${nominator.displayName} (${nominator.id})'`);
    scope.db.Insert({ [nominator.id]: newNominator }, scope.config.databases.participants);
    stats[nominator.id] = newNominator;
  }
  if (stats[nominee.id] === undefined) {
    inserted = true;
    var newNominee = { id: nominee.id, displayName: nominee.displayName, points: 0, nominations: 0 }; // TODO: see above
    if (scope.config.verbose) console.info(`Info: Inserting new participant '${nominee.displayName} (${nominee.id})'`);
    scope.db.Insert({ [nominee.id]: newNominee }, scope.config.databases.participants);
    stats[nominee.id] = newNominee;
  }

  // check that the nominator has enough points
  if (stats[nominator.id].points <= 0) {
    if (inserted) scope.db.Save(scope.config.databases.participants);
    return "`not enough points`"; // TODO: better feedback
  }

  // update stats
  var newStats = {
    [nominator.id]: { points: stats[nominator.id].points - 1 },
    [nominee.id]: { nominations: stats[nominee.id].nominations + 1 },
  };
  scope.db.Update(newStats[nominator.id], scope.config.databases.participants, v => v.id === nominator.id);
  scope.db.Update(newStats[nominee.id], scope.config.databases.participants, v => v.id === nominee.id);
  scope.db.Save(scope.config.databases.participants);
  
  var nominatorStatsText = `${nominator.displayName}: ${stats[nominator.id].points} -> ${newStats[nominator.id].points}`;
  var nomineeStatsText = `${nominee.displayName}: ${stats[nominee.id].nominations} -> ${newStats[nominee.id].nominations}`;
  return `<@!${nominee.id}> has been nominated! (${nominatorStatsText}, ${nomineeStatsText})`;
};
