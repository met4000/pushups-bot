module.exports = class Command {
  constructor({ name, description = safeRequire(`./desc/${name}`), aliasList, exec = safeRequire(`./${name}`), moderatorOnly = false }) {
    this._name = name;
    this._description = description;
    if (!Array.isArray(aliasList)) aliasList = [aliasList];
    this._aliasList = aliasList;
    this._exec = exec;
    this._moderatorOnly = moderatorOnly;
  }
  
  get name() { return this._name; }
  get description() { return this._description; }
  get aliasList() { return this._aliasList; }
  get moderatorOnly() { return this._moderatorOnly; }
  
  exec(execObj, scope) {
    var ret = (() => {
      if (execObj.cs !== undefined) {
        execObj.cs.touch();
        var expecting = execObj.cs.expecting;
        if (expecting !== undefined) {
          switch (execObj.args[0]) {
            case "close":
              execObj.cs.close();
              return;
            
            case "back":
              if (execObj.cs.commandList.length > 0) {
                execObj.args = []; // used to be able to tell if back was just called
                execObj.cs.commandList.pop();
                break;
              }
              // FALL THROUGH
            default:
              if (!expecting.includes(execObj.args[0])) {
                return "`err not expecting`"; // TODO: better feedback
              }
              break;
          }
        }
      }

      // execObj = { args: ..., msg: ..., commandName: }, scope = { db: ..., config: ... /* things passed for scope */ }
      return this._exec(execObj, scope);
    })();

    if (ret === undefined) return;
    if (typeof ret !== "object") ret = { reply: ret };

    return ret;
  }
};

function safeRequire(file, failReturnValue = undefined) {
  var ret = failReturnValue;
  try {
    ret = require(file);
  } catch (err) { console.warn(`Failed to load '${file}': returning '${failReturnValue}'`); }
  return ret;
}
