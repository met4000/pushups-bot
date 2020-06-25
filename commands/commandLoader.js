module.exports = {
  load: load,
  getByName: getByName
};

function load(target, obj, verbose = true) {
  Object.keys(obj).forEach(commandname => {
    var command = obj[commandname];
    command.aliasList.forEach(alias => {
      if (target[alias] !== undefined) throw new Error(`FATAL ERROR: Alias overlap detected between commands '${alias}' ('${command.name}') and '${alias}' ('${target[alias].name}')`);
      target[alias] = command;
    });
    if (verbose) console.info(`Info: Loaded command ${command.name}`);
  });

  return target;
}

function getByName(source, name) { return source[name]; }
