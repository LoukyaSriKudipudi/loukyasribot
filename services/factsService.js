const fs = require("fs");
const path = require("path");

const factsFile = fs.readFileSync(
  path.join(__dirname, "..", "localDB", "facts.json")
);

const facts = JSON.parse(factsFile);
let index = 0;

function getFact() {
  const fact = facts[index];
  index = (index + 1) % facts.length;
  return fact;
}

module.exports = { getFact };
