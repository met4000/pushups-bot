module.exports = {
  Info: info,
  MapArrayToObject: mapArrayToObject,
  DeRef: deRef,
  ObjectMap: objectMap,
};

function info(event, exec, nl = true) {
  var a, b;

  if (typeof event === "function") {
    a = event("ing");
    b = event("ed");
  } else {
    a = event;
    b = `${event} complete`;
  }

  console.info(`Info: ${a}...`);
  exec();
  console.info(`Info: ${b}${nl ? `\n` : ``}`);
}

// turns an array into an object, with the key generated by the application of the array element to a function
function mapArrayToObject(array, generateKey) {
  return array.reduce((o, el) => ({ ...o, [generateKey(el)]: el }), {});
}

function deRef(o) { return JSON.parse(JSON.stringify(o)); } // dereference an object

function objectMap(obj, fn) { return Object.fromEntries(Object.entries(obj).map(([k, v], i) => [k, fn(v, k, i)])); } // map, for objects
