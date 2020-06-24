const { MongoClient } = require("mongodb");
const deasync = require("deasync-promise");

/** @type {MongoClient} */
var client;

module.exports = {
  // Events (i.e. changes to the programme)
  init: init,
  close: close,

  // Actions (i.e. changes to the database)
  load: () => true,
  save: () => true,
  backup: () => true,

  // Manipulators (i.e. changes to the data)
  select: select,
  insert: insert,
  update: update,
  delete: del,

  basicInsertFailCheck: basicInsertFailCheck,
  basicUpdateFailCheck: basicUpdateFailCheck,
};

/**
 * @param {*} t The value to take on `this` for the function
 * @param {function(...*):Promise<*>} f The function to call as sync
 * @param {*[]} [args=[]] The args to `apply` to the function
 * @param {*} [failReturnType=null] The value to return if the function call fails
 * @returns {*} The resolved value of the promise
 */
function syncCall(t, f, args = [], failReturnType = null) {
  var result;
  try {
    result = deasync(f.apply(t, args));
  } catch (err) {
    console.error(err);
    return failReturnType;
  }
  return result;
}

function init(un, pw) {
  client = new MongoClient(`mongodb+srv://${un}:${pw}@cluster0-73obo.gcp.mongodb.net/main?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true });
  syncCall(client, client.connect);
}

function close() {
  syncCall(client, client.close, [true]);
}

function select(obj, dbname, onlyOne = false) {
  const collection = client.db().collection(dbname);
  if (onlyOne) {
    return syncCall(collection, collection.findOne, [obj]);
  } else {
    const find = collection.find(obj);
    return syncCall(find, find.toArray);
  }
}

function insert(obj, dbname) {
  const collection = client.db().collection(dbname);
  return syncCall(collection, collection.insertOne, [obj]);
}

function update(selObj, updateObj, dbname, manual = false) {
  const collection = client.db().collection(dbname);
  return syncCall(collection, collection.updateOne, [selObj, manual ? updateObj : { $set: updateObj }]);
}

function del() { throw new Error("FATAL ERROR: db.delete has not been implemented"); } // ! WIP

function basicInsertFailCheck(dbret, n, failReturnType = null) {
  if (dbret === failReturnType) return true;
  if (dbret.result.n !== n) return true;
  if (dbret.ops.length !== n) return true;

  return false;
}

function basicUpdateFailCheck(dbret, n, failReturnType = null) {
  if (dbret === failReturnType) return true;
  if (dbret.result.n !== n) return true;

  return false;
}
