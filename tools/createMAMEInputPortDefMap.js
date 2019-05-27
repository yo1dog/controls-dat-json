/* eslint-disable */
/* 
 * Usage: node createMAMEInputPortDefMap.js [-min]
 * 
 * Creates a JSON map of the MAME input ports defined in
 * inpttype.h from MAME's source.
 * 
 * You can get inpttype.h from
 * https://github.com/mamedev/mame/blob/master/src/emu/inpttype.h
 * 
 * Generates /json/mameInputPortDefMap.json
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
  'node createMAMEInputPortDefMap.js [-min]\n' +
  '\n' +
  'bash:\n' +
  'cat inpttype.h | node createMAMEInputPortDefMap.js > mameInputPortDefMap.json\n' +
  '\n' +
  'Windows Command Prompt:\n' +
  'type inpttype.h | node createMAMEInputPortDefMap.js > mameInputPortDefMap.json\n' +
  '\n' +
  '!! Windows PowerShell !!:\n' +
  'cat inpttype.h | node createMAMEInputPortDefMap.js | Out-File -Encoding utf8 mameInputPortsDefMap.json';


cliWrapper(usageExampleStr, function createMAMEInputPortDefMap(stdinData) {
  ////////////////////////
  // Entry Point
  ////////////////////////
  
  // extract the MAME input port definitions form stdin
  var mameInputPortDefMap = {};
  
  var re = new RegExp(
    '^'                                    + // start of line
    '\\s*INPUT_PORT_(DIGITAL|ANALOG)_TYPE' + // the function that defines an input port (INPUT_PORT_DIGITAL_TYPE or INPUT_PORT_ANALOG_TYPE) - capture group 1
    '\\s*\\(\\s*'                          + // start of params
    '(\\d+)'                               + // player number - capture group 2
    '\\s*,\\s*'                            + // param separator
    '([\\w\\d_]+)'                         + // group - capture group 3
    '\\s*,\\s*'                            + // param separator
    '([\\w\\d_]+)'                         + // type suffix - capture group 4
    '\\s*,\\s*'                            + // param separator
    '("([^"]*)"|nullptr)',                   // default label - capture group 5 & 6
  'gm');
  
  var match;
  while ((match = re.exec(stdinData))) {
    var iterfaceType = match[1].toLowerCase(); // "digital" or "analog"
    var playerNum    = parseInt(match[2]);
    var group        = match[3];
    var typeSuffix   = match[4];
    var defaultLabel = match[6] || '';
    
    var typePrefix = playerNum > 0? 'P' + playerNum + '_' : '';
    var type = typePrefix + typeSuffix;
    
    var mameInputPortDef = {
      type        : type,
      group       : group,
      playerNum   : playerNum,
      iterfaceType: iterfaceType,
      defaultLabel: defaultLabel
    };
    
    mameInputPortDefMap[mameInputPortDef.type] = mameInputPortDef;
  }
  
  if (Object.keys(mameInputPortDefMap).length === 0) {
    throw new Error('No valid MAME port definitions found.');
  }
  
  return mameInputPortDefMap;
});

