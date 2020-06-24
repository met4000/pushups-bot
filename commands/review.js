const { MessageAttachment } = require("discord.js");

const { CommandSession } = require("./commandSession");
const Submission = require("../classes/Submission");
const Participant = require("../classes/Participant");
const util = require("../util");

module.exports = function (execObj, scope) {
  if (execObj.cs !== undefined) return c_session(execObj, execObj.cs, scope);
  else return initial(execObj, scope);
};

function initial(execObj, scope) {
  if (execObj.args.length !== 0) return "`incorrect arg amount`"; // TODO: better feedback

  var cs = new CommandSession(execObj, (cs, isTimeout) => {
    var edit = cs.message.content.split("\n");
    if (edit[1][0] === ">") edit = [edit[0]].concat(edit.slice(2));
    return {
      edit: edit, // should become the default edit?
      reply: isTimeout ? "`c_session timeout`" : "`c_session closed`"
    };
  });
  cs.expecting = ["t"];

  var ret = c_session(execObj, cs, scope);
  ret.reply = ret.edit;
  delete ret.edit;
  return { ...ret, session: cs };
}

function c_session(execObj, cs, scope) {
  var data = { commands: {} }, reply = undefined;

  if (execObj.args.length > 1) return "`incorrect arg amount`"; // TODO: better feedback
  
  if (execObj.args.length > 0) cs.add(execObj.args[0]); // because [] is back

  var command = "review";
  if (cs.commandList.length) command += "." + cs.commandList.join(".");

  switch (command) {
    case "review":
      data.commands = { "next": "review the next unreviewed submission" };
      break;

    case "review.next":
      if (execObj.args.length === 0) { // i.e. back => next
        cs.commandList.pop();
        return c_session(execObj, cs, scope);
      }

      var dbret = scope.db.select({ approved: null }, scope.config.databases.submissions, true);
      if (dbret !== null) {
        cs.data = dbret;
        data.display = dbret;
        data.commands = {
          "affirmative": "confirm and award the claimed pushups",
          "negative": "deny the claimed pushups"
        };
        data.after = `( ${dbret.url} )`;
      } else {
        data.display = ["There are no new submissions (or the database is broken)", ":)"];
      }
      break;
     
    case "review.next.affirmative":
      var dbret = util.deRef(cs.data);
      cs.data = {};

      if (scope.db.basicUpdateFailCheck(scope.db.update({ _id: Submission.getID(dbret) }, { approved: true }, scope.config.databases.submissions), 1)) return "(when updating submissions): `err db bad response`";
      if (scope.db.basicUpdateFailCheck(scope.db.update({ _id: Participant.getID({ ...dbret, _id: undefined }) }, { $inc: { pushups: dbret.claim } }, scope.config.databases.participants, true), 1)) return "(when updating participants): `err db bad response`";
      dbret.approved = true;

      global.client.users.fetch(dbret.userid).then(user => user.send(`\`submission '${Submission.getID(dbret)}' (+${dbret.claim}) accepted\``)); // TODO: better feedback
      
      data.display = [dbret, "", "Submission has been approved"];
      data.after = `( ${dbret.url} )`;
      reply = `\`submission '${Submission.getID(dbret)}' (+${dbret.claim}) accepted\``;
      break;

    case "review.next.negative":
      var dbret = util.deRef(cs.data);
      cs.data = {};

      if (scope.db.basicUpdateFailCheck(scope.db.update({ _id: Submission.getID(dbret) }, { approved: false }, scope.config.databases.submissions), 1)) return "(when updating submissions): `err db bad response`";
      dbret.approved = false;

      global.client.users.fetch(dbret.userid).then(user => user.send(`\`submission '${Submission.getID(dbret)}' (+${dbret.claim}) denied\``)); // TODO: better feedback

      data.display = [dbret, "", "Submission has been denied"];
      data.after = `( ${dbret.url} )`;
      reply = `\`submission '${Submission.getID(dbret)}' (+${dbret.claim}) denied\``;
      break;

    default:
      return "`err unexpected path`";
  }
  
  cs.expecting = Object.keys(data.commands);
  var ret = { edit: generateMenu(cs, data, scope.config) };
  if (reply !== undefined) ret = { ...ret, reply: reply };
  return ret;
}

function generateMenu(cs, data, config) { // TODO move to CommandSession
  var ret = "```\n";

  // current command
  ret += "> " + cs.commandName;
  if (cs.commandList.length) ret += " > " + cs.commandList.join(" > ");
  ret += "\n";

  // header
  {
    var even = cs.commandName.length % 2 === 0, centre = cs.commandName.toUpperCase() + (even ? " " : "") + " MENU";
    
    if (centre.length < config.commandSession.menuWidth) centre = ` ${centre} `;
    if (even) if (centre.length < config.commandSession.menuWidth) centre = ` ${centre} `;

    var side = (config.commandSession.menuWidth - centre.length) / 2;
    if (side % 1 !== 0) console.error(`ERR: 'side' (${side}) is not an integer`); // I don't think this should happen?
    side = "-".repeat(side);

    ret += side + centre + side + "\n";
  }

  // data
  if (data.display) {
    var arr = data.display;
    if (!Array.isArray(arr)) arr = [arr];
    arr.forEach(el => {
      if (typeof el === "object") Object.keys(el).forEach(k => ret += `${k}: ${JSON.stringify(el[k])}\n`);
      else ret += el + "\n";
    });
    ret += "\n";
  }

  // commands
  ret += "Commands:\n";
  Object.keys(data.commands).forEach(k => ret += k.padEnd(config.commandSession.commandNameWidth) + "- " + data.commands[k] + "\n");
  if (cs.commandList.length > 0) ret += "back".padEnd(config.commandSession.commandNameWidth) + "- close the submenu (go back)\n";
  ret += "close".padEnd(config.commandSession.commandNameWidth) + "- close the menu entirely\n";

  ret += "\n```";
  if (data.after !== undefined) {
    var arr = data.after;
    if (!Array.isArray(arr)) arr = [arr];
    arr.forEach(el => {
      if (typeof el === "object") Object.keys(el).forEach(k => ret += `${k}: ${JSON.stringify(el[k])}\n`);
      else ret += el + "\n";
    });
  }
  return ret;
}
