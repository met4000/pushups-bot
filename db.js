const fs = require("fs");

const util = require("./util");

module.exports = {
  // Events (i.e. changes to the programme)
  Init: function () {},
  Close: function () { /* this.Save("*"); */ },

  // Actions (i.e. changes to the database)
  Load: load,
  Save: save,
  Backup: backup,

  // Manipulators (i.e. changes to the data)
  Select: select,
  Insert: insert,
  Update: update,
  Delete: del,
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
  return `./db/${filenameByDBName(dbname)}`;
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
  
  util.Info(suffix => `Load${suffix} databases`, () => {
    dbname.forEach(_dbname => {
      // if (!force) if (isLoaded(dbname)) save(dbname);

      util.Info(suffix => `Load${suffix} database '${_dbname}'`, () => {
        delete internal[_dbname];

      	internal[_dbname] = {
          json: require(filepathByDBName(_dbname)),
        }
      }, false);
    });
  });
}

function save(dbname = "*") {
  var db = [];

  if (dbname === "*") {
    db = Object.keys(internal);
  } else {
    if (!Array.isArray(dbname)) db = [dbname];
  }

  var ca = 0, cs = 0, fail;
  util.Info(suffix => `Sav${suffix} databases`, () => {
    db.forEach(_dbname => {
      ca++;
      if (!isLoaded(_dbname)) { console.error(`Error: Unable to save database '${_dbname}': No data found`); return; }

      fail = false;
      console.info(`Info: Saving database '${_dbname}'...`);
      try { fs.writeFileSync(filepathByDBName(_dbname), JSON.stringify(internal[_dbname].json, null, 2)); } catch (err) { fail = true; console.error(`Error: Error while saving database ${err}`); }
      if (!fail) console.info(`Info: Saved database '${_dbname}'`);
      cs++;
    });
  });
  return [ca, cs];
}

function backup(dbname, save = false) {
  if (!Array.isArray(dbname)) dbname = [dbname];

  console.info("Info: Starting backup...");

  util.Info("DB Backup", () => {
    if (save) save(dbname);

    // formatted date-time string suitable for directory names (format: `dd.mm.yyyy.hhmm.ss.fff`)
    var d = new Date(), dtstring = d.getUTCDate().toString().padStart(2, "0") + "." +
                                  (d.getUTCMonth()+1).toString().padStart(2, "0") + "." +
                                   d.getUTCFullYear().toString().padStart(4, "0") + "." + 
                                   d.getUTCHours().toString().padStart(2, "0") + d.getUTCMinutes().toString().padStart(2, "0") + "." +
                                   d.getUTCSeconds().toString().padStart(2, "0") + "." +
                                   d.getUTCMilliseconds().toString().padStart(2, "0");

  	dbname.forEach(_dbname => {
      util.Info(suffix => `Back${suffix} up ${_dbname}`, () => {
        var p = `./backups/${_dbname}/${dtstring}`, file = filepathByDBName(_dbname);
        mkdirSyncFullpath(p);
        fs.copyFileSync(file, `${p}/${file}`, fs.constants.COPYFILE_EXCL);
      }, false);
    });
  });
}


// Manipulators (i.e. changes to the data)

/**
 * Selects data from the named database(s).
 *
 * @param {*} sel The key (or array of keys) to retrieve the value(s) for. "*" is wildcard.
 * @param {string} [dbname] The name of the database(s).
 * @param {boolean} [condition=(v, db) => true] The condition to determine if a row should be included. Parameters are the row values and the database name.
 * @returns A list containing the selected data. Either a single value, or an object with the requested keys/values.
 */
function select(sel, dbname, condition = (v, db) => true) {
  var wildcard = sel === "*", multimode = Array.isArray(sel);
  if (!Array.isArray(dbname)) dbname = [dbname];

  var l = [];
  dbname.forEach(_dbname => {
    if (!isLoaded(_dbname)) { console.error(`Error: Unable to select from database '${_dbname}': Database not loaded`); return -1; }

    Object.keys(internal[_dbname].json).forEach(_key => {
      var _values = internal[_dbname].json[_key];
      if (condition(_values, _dbname)) {
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
    });
  });
  return util.DeRef(l);
}

function insert(el, dbname) { // TODO: add error checking on type of `el`
  if (!Array.isArray(dbname)) dbname = [dbname];
  
  var ia = 0, is = 0;
  dbname.forEach(_dbname => {
    if (!isLoaded(_dbname)) { console.error(`Error: Unable to insert into database '${_dbname}': Database not loaded`); return -1; }

    Object.keys(el).forEach(_key => {
      ia++;
      if (internal[_dbname].json[_key] !== undefined) { console.error(`Error: Unable to insert row '${_key}' into database '${_dbname}': Row already exists`); return -1; }
      
      internal[_dbname].json[_key] = util.DeRef(el[_key]);
      is++;
    });
  });

  return [ia, is];
}

function update(el, dbname, condition = (v, db) => false) {
  if (!Array.isArray(dbname)) dbname = [dbname];

  var rc = 0, ec = 0;
  dbname.forEach(_dbname => {
    if (!isLoaded(_dbname)) { console.error(`Error: Unable to update database '${_dbname}': Database not loaded`); return -1; }

    Object.keys(internal[_dbname].json).forEach(_key => {
      var _values = internal[_dbname].json[_key];
      if (condition(_values, _dbname)) {
        rc++;
        Object.keys(el).forEach(k => {
          if (_values[k] === undefined) { console.error(`Error: Unable to update key '${k}' of row '${_key}' in database '${_dbname}': Key not found`); return -1; }

          _values[k] = util.DeRef(el[k]);
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
