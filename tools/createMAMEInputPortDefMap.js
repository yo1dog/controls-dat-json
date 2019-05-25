/* 
 * Usage: node createMAMEInputPortDefMap.js [--min]
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

const cliWrapper = require('../helpers/cliWrapper');

const usageExampleStr =
`node createMAMEInputPortDefMap.js [--min]

bash:
cat inpttype.h | node createMAMEInputPortDefMap.js > mameInputPortDefMap.json

Windows Command Prompt:
type inpttype.h | node createMAMEInputPortDefMap.js > mameInputPortDefMap.json

!! Windows PowerShell !!:
cat inpttype.h | node createMAMEInputPortDefMap.js | Out-File -Encoding utf8 mameInputPortsDefMap.json`;


cliWrapper(usageExampleStr, createMAMEInputPortDefMap);
function createMAMEInputPortDefMap(stdinData) {
  ////////////////////////
  // Entry Point
  ////////////////////////
  
  // extract the MAME input port definitions form stdin
  const mameInputPortDefMap = {};
  
  const re = new RegExp(
    '^'                                                    + // start of line
    '\\s*INPUT_PORT_(?<interfaceType>DIGITAL|ANALOG)_TYPE' + // the function that defines an input port (INPUT_PORT_DIGITAL_TYPE or INPUT_PORT_ANALOG_TYPE)
    '\\s*\\(\\s*'                                          + // start of params
    '(?<playerNum>\\d+)'                                   + // player number
    '\\s*,\\s*'                                            + // param separator
    '(?<group>[\\w\\d_]+)'                                 + // group
    '\\s*,\\s*'                                            + // param separator
    '(?<group>[\\w\\d_]+)'                                 + // type suffix
    '\\s*,\\s*'                                            + // param separator
    '("(?<defaultLabel>[^"]*)"|nullptr)',                    // default label - capture group 5 & 6
  'gm');
  
  let match;
  while ((match = re.exec(stdinData))) {
    const iterfaceType = match.groups.interfaceType.toLowerCase(); // "digital" or "analog"
    const playerNum    = parseInt(match.groups.playerNum, 10);
    const group        = match.groups.group;
    const typeSuffix   = match.groups.typeSuffix;
    const defaultLabel = match.groups.defaultLabel || '';
    
    const typePrefix = playerNum > 0? `P${playerNum}_` : '';
    const type = typePrefix + typeSuffix;
    
    const mameInputPortDef = {
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
}

