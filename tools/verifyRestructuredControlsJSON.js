/* 
 * Usage: node verifyRestructuredControlsJSON.js
 * 
 * Verifies the integrity of /json/restructuredControls.json. Should be used after making
 * changes.
 * 
 * Can also be require()d.
 */

var jsonschema            = require('jsonschema');
var controlsDatSchema     = require('../json/restructuredControlsSchema.json');
var mameInputPortDefMap   = require('../json/mameInputPortDefMap.json');
var controlDefMap         = require('../json/controlDefMap.json');
var menuButtonDescriptors = require('../json/menuButtonDescriptors.json');

function verifyRestructuredControlsJSON(controlsDat) {
  // verify the restructured controls.dat JSON matches the schema
  var result = jsonschema.validate(controlsDat, controlsDatSchema);
  if (!result.valid) {
    var validationError = result.errors[0];
    throw new Error(validationError.toString());
  }
  
  // verify each game
  for (var key in controlsDat.gameMap) {
    try {
      verifyGame(key, controlsDat.gameMap[key]);
    }
    catch(err) {
      throw wrapError(err, 'Error verifying game at key "' + key + '".');
    }
  }
}


// ====================================================
// Game
// ====================================================

function verifyGame(key, game) {
  // make sure the key is the same as the game's name
  if (key !== game.name) {
    throw new Error('Has name "' + game.name + '" but is at key "' + key + '".');
  }
  
  // verify each control configuration
  for (var i = 0; i < game.controlConfigurations.length; ++i) {
    try {
      verifyControlConfiguration(game.controlConfigurations[i], game.numPlayers);
    }
    catch(err) {
      throw wrapError(err, 'Error verifying control configuration at index ' + i + '.');
    }
  }
  
  // make sure there is at least one control configuration or an error
  if (game.controlConfigurations.length === 0 && game.errors.length === 0) {
    throw new Error('"controlConfigurations" and "errors" can not both be empty.');
  }
  
  if (game.controlConfigurations.length > 0) {
    // make sure every player is supported in at least one of the
    // control configurations
    var controlConfigurationFound = false;
    for (var j = 0; j < game.controlConfigurations.length; ++j) {
      var controlConfiguration = game.controlConfigurations[j];
      
      var configSupportsAllPlayers = true;
      for (var k = 0; k < game.numPlayers; ++k) {
        var playerNum = k + 1;
        
        var controlSetForPlayerFound = false;
        for (var l = 0; l < controlConfiguration.controlSets.length; ++l) {
          var controlSet = controlConfiguration.controlSets[l];
          
          if (controlSet.supportedPlayerNums.indexOf(playerNum) > -1) {
            controlSetForPlayerFound = true;
            break;
          }
        }
        
        if (!controlSetForPlayerFound) {
          configSupportsAllPlayers = false;
          break;
        }
      }
      
      if (configSupportsAllPlayers) {
        controlConfigurationFound = true;
        break;
      }
    }
    
    if (!controlConfigurationFound) {
      throw new Error('No control configration exists that supports all players.');
    }
  }
}


// ====================================================
// ControlConfiguration
// ====================================================

function verifyControlConfiguration(controlConfiguration, numPlayers) {
  // verify each control set
  for (var i = 0; i < controlConfiguration.controlSets.length; ++i) {
    try {
      verifyControlSet(controlConfiguration.controlSets[i]);
    }
    catch(err) {
      throw wrapError(err, 'Error verifying control set at index ' + i + '.');
    }
  }
  
  // requiresCocktailCabinet should only be true if one or more of the
  // control sets in the configuration are required to be on the opposite
  // side of the screen (isOnOppositeScreenSide = true).
  var shouldRequireCocktailCabinet = false;
  for (var j = 0; j < controlConfiguration.controlSets.length; ++j) {
    if (controlConfiguration.controlSets[j].isOnOppositeScreenSide) {
      shouldRequireCocktailCabinet = true;
      break;
    }
  }
  
  if (shouldRequireCocktailCabinet && !controlConfiguration.requiresCocktailCabinet) {
    throw new Error('Contains a control set with isOnOppositeScreenSide=true so requiresCocktailCabinet must be true.');
  }
  if (!shouldRequireCocktailCabinet && controlConfiguration.requiresCocktailCabinet) {
    throw new Error('Contains no control sets with isOnOppositeScreenSide=true so requiresCocktailCabinet must be false.');
  }
  
  // at least one control set must be required
  var foundRequired = false;
  for (var k = 0; k < controlConfiguration.controlSets.length; ++k) {
    if (controlConfiguration.controlSets[k].isRequired) {
      foundRequired = true;
      break;
    }
  }
  
  if (!foundRequired) {
    throw new Error('At least one control set must be required.');
  }
  
  // make sure multiple control sets don't support the same player
  var playerNum;
  for (var l = 0; l < numPlayers; ++l) {
    playerNum = l + 1;
    
    var controlSetFoundIndex = -1;
    for (var m = 0; m < controlConfiguration.controlSets.length; ++m) {
      if (controlConfiguration.controlSets[m].supportedPlayerNums.indexOf(playerNum) > -1) {
        if (controlSetFoundIndex > -1) {
          throw new Error('Player ' + playerNum + ' is supported by multiple control sets (index ' + controlSetFoundIndex + ' and ' + m + ').');
        }
        else {
          controlSetFoundIndex = m;
        }
      }
    }
  }
  
  // make sure if there is a control set with isOnOppositeScreenSide=true there is at
  // least one with isOnOppositeScreenSide=false
  var existsWith = false;
  var existsWithout = false;
  for (var o = 0; o < controlConfiguration.controlSets; ++o) {
    if (controlConfiguration.controlSets[o].isOnOppositeScreenSide) {
      existsWith = true;
    }
    else {
      existsWithout = true;
    }
  }
  
  if (existsWith && !existsWithout) {
    throw new Error('All control sets have isOnOppositeScreenSide=true and none have isOnOppositeScreenSide=false.');
  }
  
  // make sure every entry in playerControlSetIndexes is correct
  for (var p = 0; p < controlConfiguration.playerControlSetIndexes.length; ++p) {
    playerNum = p + 1;
    var playerControlSetIndex = controlConfiguration.playerControlSetIndexes[p];
    var playerControlSet = controlConfiguration.controlSets[playerControlSetIndex];
    
    if (!playerControlSet) {
      throw new Error('playerControlSetIndexes[' + p + '] for player ' + playerNum + ' refers to the control set index ' + playerControlSetIndex + ' which does not exist.');
    }
    
    if (playerControlSet.supportedPlayerNums.indexOf(playerNum) === -1) {
      throw new Error('playerControlSetIndexes[' + p + '] for player ' + playerNum + ' refers to the control set index ' + playerControlSetIndex + ' which does not support player ' + playerNum + '.');
    }
  }
  
  // make sure each button in the menu buttons array has a valid descriptor
  for (var q = 0; q < controlConfiguration.menuButtons.length; ++q) {
    var button = controlConfiguration.menuButtons[q];
    
    if (
      button.descriptor !== null &&
      menuButtonDescriptors.indexOf(button.descriptor) === -1
    ) {
      throw new Error('Descriptor "' + button.descriptor + '" is not valid for a menu button.');
    }
  }
}


// ====================================================
// ControlSet
// ====================================================

function verifyControlSet(controlSet) {
  // verify each control
  for (var i = 0; i < controlSet.controls.length; ++i) {
    try {
      verifyControl(controlSet.controls[i]);
    }
    catch(err) {
      throw wrapError(err, 'Error verifying control at index ' + i + '.');
    }
  }
  
  // verify each control panel button
  for (var j = 0; j < controlSet.controlPanelButtons.length; ++j) {
    try {
      verifyButton(controlSet.controlPanelButtons[j], true);
    }
    catch(err) {
      throw wrapError(err, 'Error verifying control panel button at index ' + j + '.');
    }
  }
  
  // make sure at least one control or button exists
  if (controlSet.controls.length === 0 && controlSet.controlPanelButtons.length === 0) {
    throw new Error('"controls" and "controlPanelButtons" can not both be empty.');
  }
}


// ====================================================
// Control
// ====================================================

function verifyControl(control) {
  // make sure the type is valid
  var controlDef = controlDefMap[control.type];
  if (!controlDef) {
    throw new Error('Unrecognized control type "' + control.type + '".');
  }
  
  // verify each input
  for (var key in control.outputToInputMap) {
    var input = control.outputToInputMap[key];
    
    if (!input) {
      continue;
    }
    
    try {
      verifyInput(input);
    }
    catch(err) {
      throw wrapError(err, 'Error verifying input in outputToInputMap at key "' + key + '".');
    }
  }
  
  // verify each button
  for (var i = 0; i < control.buttons.length; ++i) {
    try {
      verifyButton(control.buttons[i], controlDef);
    }
    catch(err) {
      throw wrapError(err, 'Error verifying button at index ' + i + '.');
    }
  }
  
  // make sure the descriptor is valid for the control type
  if (control.descriptor !== null) {
    if (controlDef.descriptors.indexOf(control.descriptor) === -1) {
      throw new Error('Descriptor "' + control.descriptor + '" is not valid for control type "' + control.type + '".');
    }
  }
  
  // make sure all outputs are defined
  for (var outputName in controlDef.outputMap) {
    if (typeof control.outputToInputMap[outputName] === 'undefined') {
      throw new Error('Output "' + outputName + '" missing for control type "' + control.type + '".');
    }
  }
  
  // make sure there are no unrecognized outputs
  for (var outputKey in control.outputToInputMap) {
    if (!controlDef.outputMap[outputKey]) {
      throw new Error('Unrecognized output "' + outputKey + '" for control type "' + control.type + '".');
    }
  }
}


// ====================================================
// Button
// ====================================================

function verifyButton(button, onControlDef) {
  // verify input
  try {
    verifyInput(button.input);
  }
  catch(err) {
    throw wrapError(err, 'Error verifying input.');
  }
  
  // make the descriptor is valid
  if (button.descriptor !== null) {
    if (onControlDef) {
      if (onControlDef.buttonDescriptors.indexOf(button.descriptor) === -1) {
        throw new Error('Button descriptor "' + button.descriptor + '" is not valid for a button on a control with type "' + onControlDef.type + '".');
      }
    }
    else {
      if (!(/^main-\d+,\d+$/.test(button.descriptor))) {
        throw new Error('Button descriptor "' + button.descriptor + '" is not valid for a control panel button.');
      }
    }
  }
}


// ====================================================
// Input
// ====================================================

function verifyInput(input) {
  // make sure the MAME input port is valid
  if (!mameInputPortDefMap[input.mameInputPort]) {
    throw new Error('Unrecognized MAME input port "' + input.mameInputPort + '".');
  }
  
  if (input.isAnalog) {
    // make sure "negLabel" and "posLabel" are defined but not "label"
    if (typeof input.negLabel === 'undefined') {
      throw new Error('Is analog and missing required "negLabel" property.');
    }
    if (typeof input.posLabel === 'undefined') {
      throw new Error('Is analog and missing required "posLabel" property.');
    }
    
    if (typeof input.label !== 'undefined') {
      throw new Error('Is analog and should not have "label" property.');
    }
    
    // make sure at least one label is used
    if (input.negLabel === null && input.posLabel === null) {
      throw new Error('Both the negative and positive labels are unused.');
    }
  }
  else {
    // make sure "label" is defined but not "negLabel" and "posLabel"
    if (typeof input.label === 'undefined') {
      throw new Error('Is digital and missing required "label" property.');
    }
    
    if (typeof input.negLabel !== 'undefined') {
      throw new Error('Is digital and should not have "negLabel" property.');
    }
    if (typeof input.posLabel !== 'undefined') {
      throw new Error('Is digital and should not have "posLabel" property.');
    }
  }
}



// export the function if it was required or run it
if (require.main !== module) {
  module.exports = verifyRestructuredControlsJSON;
}
else {
  verifyRestructuredControlsJSON(require('../json/restructuredControls.json'));
}