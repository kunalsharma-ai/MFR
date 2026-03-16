import fs from "fs";

function loadJson(filename) {
  try {
    let data = fs.readFileSync(filename);
    let output = JSON.parse(data);
    return output;
  } catch (error) {
    console.log(error)
    return []
  }
}
function writeFile(filename,data){
  fs.writeFileSync(filename,JSON.stringify(data),"utf-8");
}
function prepareOptions(option){
  let question=option.variable;
  let options=option.options.map(opt=>({
    question,
    ...opt,
    "parentValue": [
    ],
    "origin": "mfr.sampledge.duckdns.org",
    "isDeleted": false,
    "isActive": true
  }))
  return options;
}

function main() {
  const data = loadJson("updatedOptions.json")
  const variables=[];
  let options=[];
  for (let index = 0; index < data.length; index++) {
    variables.push(data[index]["variable"]);
    options=[...options,...prepareOptions(data[index])]
  }
  writeFile("importableJsonOptions",options)
  writeFile("varialbes",variables);
}
main();
