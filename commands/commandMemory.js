const util = require("../util");

const config = require("../config.json");

class MemoryCommand {
  constructor(execObj, closer = () => {}, lifespan = config.commandMemory.defaultLifespan) {
    this.execObj = execObj;
    this.closer = closer;
    this.lifespan = lifespan;
    this.timeoutID = setTimeout(expire, lifespan, this);
  }
  
  static getID(memoryCommand) { return memoryCommand.execObj.msg.id; }
  getID() { return MemoryCommand.getID(this); }
  
  toObject() {
    return util.deRef({
      execObj: this.execObj,
      closer: this.closer,
      lifespan: this.lifespan
    });
  }
  
  touch() {
    clearTimeout(this.timeoutID);
    this.timeoutID = setTimeout(expire, this.lifespan, this);
  }
};

module.exports = {
  MemoryCommand: MemoryCommand,

  add: add,
  get: get,
  remove: remove,
};

var internal = {};

function add(mc) {
  if (!(mc instanceof MemoryCommand)) return;

  if (internal[mc.getID()] !== undefined); // do something, maybe...?

  internal[mc.getID()] = mc;
  return true;
}

function get(id) {
  return internal[id];
}

function remove(memoryCommand) {
  return delete internal[memoryCommand.getID()];
}

function expire(memoryCommand) {
  if (config.verbose) console.log(`Info: MemoryCommand '${memoryCommand.getID()}' has expired.`);
  memoryCommand.closer(memoryCommand.execObj);
  remove(memoryCommand);
}
