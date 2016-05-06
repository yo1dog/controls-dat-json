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

var cliWrapper = require('../helpers/cliWrapper');

var usageExampleStr =
  'node formatJSON.js [-min]\n' +
  '\n' +
  'bash:\n' +
  'cat file.min.json | node formatJSON.js > file.json\n' +
  'cat file.json | node formatJSON.js -min > file.min.json\n' +
  '\n' +
  'Windows Command Prompt:\n' +
  'type file.min.json | node formatJSON.js > file.json\n' +
  'type file.json | node formatJSON.js -min > file.min.json\n' +
  '\n' +
  '!! Windows PowerShell !!:\n' +
  'cat file.min.json | node formatJSON.js | Out-File -Encoding utf8 file.json' +
  'cat file.json | node formatJSON.js -min | Out-File -Encoding utf8 file.min.json';


cliWrapper(usageExampleStr, function formatJSON(stdinData) {
  ////////////////////////
  // Entry Point
  ////////////////////////
  
  // parse the data from stdin as JSON
  var obj;
  try {
    obj = JSON.parse(stdinData);
  }
  catch(err) {
    console.error('Error parsing data from stdin as JSON.');
    throw err;
  }
  
  return obj;
});

