module.exports = function (execObj) {
  if (execObj.args.length !== 1) return; // TODO: feedback
  
  var nominee = /^<@!(\d+)>$/.exec(execObj.args[0]); // user ID, assuming valid input
  if (nominee === null) return; // TODO: feedback

  nominee = execObj.msg.channel.members.get(nominee[1]).user; // user object, assuming in the channel
  if (nominee === undefined) return; // TODO: feedback

  // TODO: actually nominate someone

  return `<@!${nominee.id}> has been nominated! (-1 nomination: ${-1 /* TODO: get count */} remaining)`;
};
