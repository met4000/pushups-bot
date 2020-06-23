const fs = require("fs");

const util = require("./util");

module.exports = {
  // Events (i.e. changes to the programme)
  init: function () {},
  close: function () { /* this.save("*"); */ },

  // Actions (i.e. changes to the database)
  load: load,
  save: save,
  backup: backup,

  // Manipulators (i.e. changes to the data)
  select: select,
  insert: insert,
  update: update,
  delete: del,
};

var internal = {};

function isLoaded(dbname) {
  return internal[dbname] !== undefined;
}

function filenameByDBName(dbname) {
  if (!dbname) throw new Error("FATAL ERROR: No name passed.");
  return `${dbname}.json`;
}

function filepathByDBName(dbname) {
  if (!dbname) throw new Error("FATAL ERROR: No name passed.");
  return `db/${filenameByDBName(dbname)}`;
}

function mkdirSyncFullpath(path) {
  path = path.split(/[\\\/]+/);

  path.forEach((v, i, a) => {
    var p = a.slice(0, i + 1).join("/");
    if (!fs.existsSync(p)) fs.mkdirSync(p);
  });
}


// Actions (i.e. changes to the database)
function load(dbname, force = false) {
  if (!Array.isArray(dbname)) dbname = [dbname];
  
  util.info(suffix => `Load${suffix} databases`, () => {
    dbname.forEach(_dbname => {
      // if (!force) if (isLoaded(dbname)) save(dbname);

      util.info(suffix => `Load${suffix} database '${_dbname}'`, () => {
        delete internal[_dbname];

      	internal[_dbname] = {
          json: require(`./${filepathByDBName(_dbname)}`),
        }
      }, false);
    });
  });
}

function save(dbname = "*") {
  if (dbname === "*") {
    dbname = Object.keys(internal);
  } else {
    if (!Array.isArray(dbname)) dbname = [dbname];
  }

  var ca = 0, cs = 0, fail;
  util.info(suffix => `Sav${suffix} databases`, () => {
    dbname.forEach(_dbname => {
      ca++;
      if (!isLoaded(_dbname)) { console.error(`Error: Unable to save database '${_dbname}': No data found`); return; }

      fail = false;
      console.info(`Info: Saving database '${_dbname}'...`);
      try { fs.writeFileSync(`./${filepathByDBName(_dbname)}`, JSON.stringify(internal[_dbname].json, null, 2)); } catch (err) { fail = true; console.error(`Error: Error while saving database ${err}`); }
      if (!fail) console.info(`Info: Saved database '${_dbname}'`);
      cs++;
    });
  });
  return [ca, cs];
}

function backup(dbname, save = false) {
  if (!Array.isArray(dbname)) dbname = [dbname];

  console.info("Info: Starting backup...");

  util.info("DB Backup", () => {
    if (save) save(dbname);

    // formatted date-time string suitable for directory names (format: `dd.mm.yyyy.hhmm.ss.fff`)
    var d = new Date(), dtstring = d.getUTCDate().toString().padStart(2, "0") + "." +
                                  (d.getUTCMonth()+1).toString().padStart(2, "0") + "." +
                                   d.getUTCFullYear().toString().padStart(4, "0") + "." + 
                                   d.getUTCHours().toString().padStart(2, "0") + d.getUTCMinutes().toString().padStart(2, "0") + "." +
                                   d.getUTCSeconds().toString().padStart(2, "0") + "." +
                                   d.getUTCMilliseconds().toString().padStart(2, "0");

  	dbname.forEach(_dbname => {
      util.info(suffix => `Back${suffix} up ${_dbname}`, () => {
        var p = `backups/${_dbname}/${dtstring}`, filep = filepathByDBName(_dbname), file = filep, regexresult;
        while (regexresult = /^([^/]+)\/(.+)$/.exec(file)) [p, file] = [`${p}/${regexresult[1]}`, regexresult[2]];

        mkdirSyncFullpath(p);
        fs.copyFileSync(`./${filep}`, `./${p}/${file}`, fs.constants.COPYFILE_EXCL);
      }, false);
    });
  });
}


// Manipulators (i.e. changes to the data)
/**
 * Selects data from the named database(s).
 *
 * @param {"*"|Object.<string, *>} sel The key (or array of keys) to retrieve the value(s) for. "*" is wildcard.
 * @param {string|[string]} dbname The name of the database(s).
 * @param {string|[string]|function(Object.<string, *>, string):boolean} [condition=(values, dbname) => true] The condition to determine if a row should be included. Parameters are the row values and the database name.
 * @param {number} [amount] The number of rows to find. Defaults to Infinity ("all").
 * @returns A list containing the selected data. Either a single value, or an object with the requested keys/values.
 */
function select(sel, dbname, condition = (values, dbname) => true, amount = Infinity) {
  var wildcard = sel === "*", multimode = Array.isArray(sel);
  if (!Array.isArray(dbname)) dbname = [dbname];
  if (typeof condition !== "function") if (!Array.isArray(condition)) condition = [condition];

  var l = [];
  db_search: for (const _dbname of dbname) {
    if (!isLoaded(_dbname)) { console.error(`Error: Unable to select from database '${_dbname}': Database not loaded`); return -1; }

    for (const _key in internal[_dbname].json) {
      if (l.length >= amount) break db_search;

      var _values = internal[_dbname].json[_key];
      if (typeof condition === "function" ? condition(_values, _dbname) : condition.includes(_key)) {
        if (wildcard) {
          l.push(_values);
        } else if (multimode) {
          var obj = {};
          sel.forEach(k => {
            if (_values[k] === undefined) { console.error(`Error: Unable to select key '${k}' of row '${_key}' from database '${_dbname}': Key not found`); return -1; }

            obj[k] = _values[k];
          });
          l.push(obj);
        } else {
          l.push(_values[sel]);
        }
      }
    }
  }
  return util.deRef(l);
}

function insert(el, dbname) { // TODO: add error checking on type of `el`
  if (!Array.isArray(dbname)) dbname = [dbname];
  
  var ia = 0, is = 0;
  dbname.forEach(_dbname => {
    if (!isLoaded(_dbname)) { console.error(`Error: Unable to insert into database '${_dbname}': Database not loaded`); return -1; }

    Object.keys(el).forEach(_key => {
      ia++;
      if (internal[_dbname].json[_key] !== undefined) { console.error(`Error: Unable to insert row '${_key}' into database '${_dbname}': Row already exists`); return -1; }
      
      internal[_dbname].json[_key] = util.deRef(el[_key]);
      is++;
    });
  });

  return [ia, is];
}

/**
 * @param {Object.<string, *>|Object.<string, function(*):*>} el
 * @param {string|[string]} dbname
 * @param {string|[string]|function(Object.<string, *>, string):boolean} [condition=(values, dbname) => false]
 * @returns
 */
function update(els, dbname, condition = (values, dbname) => false) {
  if (!Array.isArray(dbname)) dbname = [dbname];
  if (typeof condition !== "function") if (!Array.isArray(condition)) condition = [condition];

  var rc = 0, ec = 0;
  dbname.forEach(_dbname => {
    if (!isLoaded(_dbname)) { console.error(`Error: Unable to update database '${_dbname}': Database not loaded`); return -1; }

    Object.keys(internal[_dbname].json).forEach(_key => {
      var _values = internal[_dbname].json[_key];
      if (typeof condition === "function" ? condition(_values, _dbname) : condition.includes(_key)) {
        rc++;
        Object.keys(els).forEach(k => {
          if (_values[k] === undefined) { console.error(`Error: Unable to update key '${k}' of row '${_key}' in database '${_dbname}': Key not found`); return -1; }

          _values[k] = typeof els[k] === "function" ? util.deRef(els[k](_values[k])) : util.deRef(els[k]);
          ec++;
        });
      }
    });
  });
  return [rc, ec];
}

function del(el, dbname, condition = (v, db) => false) {
  if (!isLoaded(dbname)) { console.error(`Error: Unable to delete from database '${dbname}': Database not loaded`); return -1; }

	// TODO: implement
}
