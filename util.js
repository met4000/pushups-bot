module.exports = {
  Info: info
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
