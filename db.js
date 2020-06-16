const fs = require("fs");

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

function fileNameByDBName(dbname) {
  if (!dbname) throw new Error("Fatal Error: No name passed.");
  return `./${dbname}.json`;
}


// Actions (i.e. changes to the database)
function load(dbname = "_data", force = false) {
  if (!Array.isArray(dbname)) dbname = [dbname];
  
  dbname.forEach(_dbname => {
    // if (!force) if (isLoaded(dbname)) save(dbname);

    delete internal[_dbname];

  	internal[_dbname] = {
      json: require(fileNameByDBName(_dbname)),
    }

    console.info(`Info: Loaded database '${_dbname}'`);
  });
}

function save(dbname = "*") {
  var db = [];

  if (dbname === "*") {
    db = Object.keys(internal);
  } else {
    if (!Array.isArray(dbname)) db = [dbname];
  }

  var ca = 0, cs = 0;
  db.forEach(_dbname => {
    ca++;
    if (!isLoaded(_dbname)) { console.error(`Error: Unable to save database '${_dbname}': No data found`); return; }

    fs.writeFile(fileNameByDBName(_dbname), JSON.stringify(internal[_dbname].json, null, 2), (err) => console.error);
    console.info(`Info: Saving database '${_dbname}'...`);
    cs++;
  });
  return [ca, cs];
}

function backup(dbname = "_data", save = false) {
  if (save) save(dbname);

	// TODO: implement
}


// Manipulators (i.e. changes to the data)

/**
 * Selects data from the named database(s).
 *
 * @param {*} sel The key (or array of keys) to retrieve the value(s) for. "*" is wildcard.
 * @param {boolean} [condition=(v, db) => true] The condition to determine if a row should be included. Parameters are the row values and the database name.
 * @param {string} [dbname="_data"] The name of the database(s).
 * @returns The selected data. Either a single value, or an object with the requested keys/values.
 */
function select(sel, condition = (v, db) => true, dbname = "_data") {
  var wildcard = sel === "*", multimode = Array.isArray(sel);
  if (!Array.isArray(dbname)) dbname = [dbname];

  var l = [];
  dbname.forEach(_dbname => {
    if (!isLoaded(_dbname)) { console.error(`Error: Unable to select from database '${_dbname}': Database not found`); return -1; }

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
  return l;
}

function insert(el, dbname = "_data") {
	if (!isLoaded(dbname)) { console.error(`Error: Unable to insert into database '${dbname}': Database not found`); return -1; }
}

function update(el, condition = (v, db) => false, dbname = "_data") {
  if (!Array.isArray(dbname)) dbname = [dbname];

  var rc = 0, ec = 0;
  dbname.forEach(_dbname => {
    if (!isLoaded(_dbname)) { console.error(`Error: Unable to update database '${_dbname}': Database not found`); return -1; }

    Object.keys(internal[_dbname].json).forEach(_key => {
      var _values = internal[_dbname].json[_key];
      if (condition(_values, _dbname)) {
        rc++;
        Object.keys(el).forEach(k => {
          if (_values[k] === undefined) { console.error(`Error: Unable to update key '${k}' of row '${_key}' in database '${_dbname}': Key not found`); return -1; }

          _values[k] = el[k];
          ec++;
        });
      }
    });
  });
  return [rc, ec];
}

function del(el, condition = (v, db) => false, dbname = "_data") {
  if (!isLoaded(dbname)) { console.error(`Error: Unable to delete from database '${dbname}': Database not found`); return -1; }

	// TODO: implement
}
