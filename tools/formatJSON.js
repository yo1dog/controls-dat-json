/* 
 * Usage: node formatJSON.js
 * 
 * Pretty-prints or minifies JSON.
 * 
 * 
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !!         WARNING          !!
 * !!                          !!
 * !! Windows PowerShell Users !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * 
 * You can not use the > operator to write the output JSON to a file as it will be
 * saved with UTF-8-BOM encoding which will make it invalid JSON. Using
 * "| Out-File -Encoding utf8" instead solves this problem.
 */

const cliWrapper = require('../helpers/cliWrapper');

const usageExampleStr =
`node formatJSON.js [--min]

bash:
cat file.min.json | node formatJSON.js > file.json
cat file.json | node formatJSON.js --min > file.min.json

Windows Command Prompt:
type file.min.json | node formatJSON.js > file.json
type file.json | node formatJSON.js --min > file.min.json

!! Windows PowerShell !!:
cat file.min.json | node formatJSON.js | Out-File -Encoding utf8 file.json
cat file.json | node formatJSON.js --min | Out-File -Encoding utf8 file.min.json`;


cliWrapper(usageExampleStr, formatJSON);
function formatJSON(stdinData) {
  ////////////////////////
  // Entry Point
  ////////////////////////
  
  // parse the data from stdin as JSON
  try {
    return JSON.parse(stdinData);
  }
  catch(err) {
    console.error('Error parsing data from stdin as JSON.');
    throw err;
  }
}
