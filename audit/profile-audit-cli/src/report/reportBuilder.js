const fs = require("fs");

function buildReport(data) {
  const filename = `report-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log("Report generated:", filename);
}

module.exports = { buildReport };