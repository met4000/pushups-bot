const util = require("../util");

const config = require("../config.json");

class CommandSession {
  constructor(execObj, closer = undefined, lifespan = config.commandMemory.defaultLifespan) {
    if (closer === undefined) closer = cs => "`CommandSession timeout`";
    this.execObj = execObj;
    this.commandName = execObj.commandName;
    this.commandList = [execObj.args];
    this.expecting = undefined;

    this.user = execObj.msg.author;
    this.channel = execObj.msg.channel;

    this.message = undefined;

    this.closer = closer;
    this.lifespan = lifespan;
    this.timeoutID = null;
  }
  
  static getID(commandSession) { return `${commandSession.user.id}_${commandSession.channel.id}`; }
  getID() { return CommandSession.getID(this); }
  static getIDByMessage(msg) { return new CommandSession({ msg: msg }, () => {}).getID(); }
  
  toObject() {
    return util.deRef({
      execObj: this.execObj,
      closer: this.closer,
      lifespan: this.lifespan
    });
  }

  add(command) {
    this.commandList.push(command);
  }
  
  touch(t = null) {
    clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout(() => {
      if (config.verbose) console.log(`Info: CommandSession '${this.getID()}' has expired.`);

      var ret = this.closer(this);
      if (ret !== undefined) {
        if (typeof ret !== "object") ret = { reply: ret };
        this.message.edit(ret.reply);
        this.message.channel.stopTyping(true);
      }

      remove(this);
    }, t === null ? this.lifespan : t);
  }
};

module.exports = {
  CommandSession: CommandSession,

  add: add,
  get: get,
  getByID: getByID,
  includes: includes,
  remove: remove,
};

var internal = {};

function add(cs) {
  if (!(cs instanceof CommandSession)) return;

  if (internal[cs.getID()] !== undefined); // do something, maybe...?

  internal[cs.getID()] = cs;
  internal[cs.getID()].touch();
  
  return true;
}

function get(cs) {
  return getByID(cs.getID());
}

function getByID(id) {
  return internal[id];
}

function includes(id) {
  return Object.keys(internal).includes(id);
}

function remove(memoryCommand) {
  var cs = get(memoryCommand);
  clearTimeout(this.timeoutID);
  return delete internal[cs.getID()];
}
