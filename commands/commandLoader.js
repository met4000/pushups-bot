module.exports = {
  load: load,
};

function load(obj) {
  var loaded = {};

  Object.keys(obj).forEach(commandname => {
    var command = obj[commandname];
    command.aliasList.forEach(alias => {
      if (loaded[alias] !== undefined) throw new Error(`FATAL ERROR: Alias overlap detected between commands '${alias}' ('${command.name}') and '${alias}' ('${loaded[alias].name}')`);
      loaded[alias] = command;
    });
    console.info(`Info: Loaded command ${command.name}`);
  });

  return loaded;
}
