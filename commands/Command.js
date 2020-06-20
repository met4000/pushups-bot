module.exports = class Command {
  constructor(name, aliasList, exec) {
    this._name = name;
    if (!Array.isArray(aliasList)) aliasList = [aliasList];
    this._aliasList = aliasList;
    this._exec = exec;
  }
  
  get name() { return this._name; }
  get aliasList() { return this._aliasList; }
  
  exec(execObj, scope) {
    // execObj = { args: ..., msg: ... }, scope = { db: ..., config: ... /* things passed for scope */ }
    var ret = this._exec(execObj, scope);

    if (ret === undefined) return;
    if (typeof ret !== "object") ret = { reply: ret };

    return ret;
  }
};
