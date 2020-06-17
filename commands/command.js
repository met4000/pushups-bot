class Command {
  constructor(name, aliasList, exec) {
    this._name = name;
    if (!Array.isArray(aliasList)) aliasList = [aliasList];
    this._aliasList = aliasList;
    this._exec = exec;
  }
  
  get name() { return this._name; }
  get aliasList() { return this._aliasList; }
  
  exec(execObj) {
    var ret = this._exec(execObj);  // execObj = { args: ..., msg: ... }

    if (ret === undefined) return;
    if (typeof ret !== "object") ret = { reply: ret };

    return ret;
  }
}

module.exports = Command;
