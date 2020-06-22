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
    var ret = (() => {
      if (execObj.cs !== undefined) {
        execObj.cs.touch();
        if (execObj.cs.expecting !== undefined) {
          if (!execObj.cs.expecting.includes(execObj.args[0])) {
            execObj.msg.channel.send("`ERR NOT EXPECTING`"); // TODO: better feedback
            return null;
          }
        }
      }

      // execObj = { args: ..., msg: ... }, scope = { db: ..., config: ... /* things passed for scope */ }
      return this._exec(execObj, scope);
    })();

    if (ret === undefined) return;
    if (ret === null || typeof ret !== "object") ret = { reply: ret };

    return ret;
  }
};
