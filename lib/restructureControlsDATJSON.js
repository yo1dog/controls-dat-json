/* 
 * Usage: node restructureControlsDATJSON.js [-min]
 * 
 * I found the structure of the data in the controls.dat project a bit archaic,
 * convoluted, and difficult to use. So I added a script that will restructure
 * the constrols.dat JSON file in a way that (in my opinion) is much easier to
 * work with and much more precise. I think the JSON format makes this much
 * easier.
 * 
 * You can generate controls.json with controlsDATXMLtoJSON.js
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

var util                       = require('util');
var clone                      = require('clone');
var models                     = require('./models');
var controlDefMap              = require('./json/controlDefMap.json');
var oldControlNameToNewTypeMap = require('./json/oldControlNameToNewTypeMap.json');
var cliWrapper                 = require('./helpers/cliWrapper');
var wrapError                  = require('./helpers/wrapError');

var usageExampleStr =
  'node restructureControlsDATJSON.js [-min]\n' +
  '\n' +
  'bash:\n' +
  'cat controls.json | node restructureControlsDATJSON.js > restructuredControls.json\n' +
  '\n' +
  'Windows Command Prompt:\n' +
  'type controls.json | node restructureControlsDATJSON.js > restructuredControls.json\n' +
  '\n' +
  '!! Windows PowerShell !!:\n' +
  'cat controls.json | node restructureControlsDATJSON.js | Out-File -Encoding utf8 restructuredControls.json';



var gameKnownIssues = {
  'assault': 'Has a "Dual 4-way Triggersticks" control but only defines a label for P1_JOYSTICKRIGHT_RIGHT.',
  'firetrk': 'The "360 Steering Wheel" control for both player 1 and 2 are mapped to P1_DIAL.',
  'gtmr2': 'The second "Pedal (Microswitch)" control does not have a button mapped to it.',
  'minigolf': 'Does not define any labels for the "Trackball" control.',
  'quarterb': 'The "8-way Joystick" control for player 1 and 2 are both mapped to P1_JOYSTICK.',
  'speedfrk': 'The "4 Gear Shifter" control does not have any buttons mapped to it.'
};

function setupSpecialCases(oGame) {
  switch (oGame.romname) {
  case 'cybsled':
    // this game has two analog joysticks defined and the second
    // one uses a P2_ MAME input port prefix
    oGame.players[0].controls[1].__overridePlayerNum = 2;
    break;

  case 'teamqb':
    // player 4 has an "8-way Joystick" control that maps to
    // P0_ MAME input ports instead of P4_
    oGame.players[3].controls[0].__overridePlayerNum = 0;
    break;
  
  // these games have dual joysticks but each joystick has
  // different buttons
  case 'vindictr':
  case 'vindctr2':
    oGame.players[0].controls[0].__splitDualControlButtons = true;
    break;
  }
}



cliWrapper(usageExampleStr, function restructureControlsDATJSON(stdinData) {
  ////////////////////////
  // Entry Point
  ////////////////////////
  
  // parse the data from stdin as JSON
  var controlsDat;
  try {
    controlsDat = JSON.parse(stdinData);
  }
  catch(err) {
    throw wrapError(err, 'Error parsing data from stdin as JSON.');
  }
  
  // create a new meta object from the old one
  var nMeta = createNMeta(controlsDat.meta);
  
  // create a game map from the games
  var nGameMap = createNGameMap(controlsDat.games);
  
  var nControlDat = models.controlsDat.create({
    meta   : nMeta,
    gameMap: nGameMap
  });
  return nControlDat;
});

function createNMeta(oMeta) {
  var nMeta = {
    description        : 'Controls.dat restructured JSON file',
    version            : oMeta.version,
    time               : new Date(),
    generatedBy        : '', // set this in the output file if you want
    xmlTime            : oMeta.xmlTime,
    xmlGeneratedBy     : oMeta.xmlGeneratedBy,
    origJSONTime       : oMeta.time,
    origJSONGeneratedBy: oMeta.generatedBy
  };
  
  return nMeta;
}

function createNGameMap(oGames) {
  var nGameMap = {};
  
  // for each old game...
  for (var i = 0; i < oGames.length; ++i) {
    var oGame = oGames[i];
    
    // create a new game from the old one
    var nGame;
    try {
      nGame = createNGame(oGame);
    }
    catch(err) {
      throw wrapError(err, 'Error creating new game from old game with romname "' + oGame.romname + '".');
    }
    
    // add the new game to the map
    nGameMap[nGame.name] = nGame;
  }
  
  return nGameMap;
}

function createNGame(oGame) {
  // set any special case functions on the game if needed
  setupSpecialCases(oGame);
  
  var controlConfigurations;
  var errors = [];
  try {
    controlConfigurations = createControlConfigurationsFromOGame(oGame);
  }
  catch(err) {
    wrapError(err, 'Error creating control sets for old game with romname "' + oGame.romname + '".');
    
    // only print GameErrors, throw others
    if (!(err instanceof GameError)) {
      throw err;
    }
    
    var knownIssueStr = gameKnownIssues[oGame.romname];
    if (knownIssueStr) {
      err.message = 'NOTE: There is a known issue with "' + oGame.romname + '" in controls.dat that most likely caused this error: ' + knownIssueStr + '\n' + err.message;
    }
    
    console.error(err.message + '\n');
    
    controlConfigurations = [];
    errors.push(err.message);
  }
  
  var nGame = models.game.create({
    name                   : oGame.romname,
    description            : oGame.gamename,
    numPlayers             : oGame.numPlayers,
    alternatesTurns        : oGame.alternating,
    usesServiceButtons     : oGame.usesService,
    usesTilt               : oGame.tilt,
    hasCocktailDipswitch   : oGame.cocktail,
    notes                  : oGame.miscDetails,
    errors                 : errors,
    controlConfigurations  : controlConfigurations
  });
  return nGame;
}

function createControlConfigurationsFromOGame(oGame) {
  // TODO: controls.dat does not provide information about alternate
  // control configurations, so we will only create one
  var controlConfiguration = models.controlConfiguration.create({
    controlSets: createControlSetsFromOGame(oGame)
  });
  
  var controlConfigurations = [controlConfiguration];
  return controlConfigurations;
}

function createControlSetsFromOGame(oGame) {
  // make sure there is at least one player explicitly defined
  if (oGame.players.length === 0) {
    throw new GameError('No players defined. See README.');
  }
  // make sure there are not too many players defined
  if (oGame.players.length > oGame.numPlayers) {
    throw new GameError('Too many players defined. See README.');
  }
  
  var controlSets;
  if (oGame.mirrored) {
    controlSets = createControlSetsFromMirroredOGame(oGame);
  }
  else {
    controlSets = createControlSetsFromNonMirroredOGame(oGame);
  }
  
  return controlSets;
}
function createControlSetsFromMirroredOGame(oGame) {
  // the old game is "mirrored" so all players have the same
  // control scheme
  
  // only player 1 should be explicitly defined and all
  // other players are implicitly defined
  var player1 = oGame.players[0];
  
  if (oGame.players.length > 1) {
    throw new GameError('Old game is "mirrored" but multiple players are defined. See README.');
  }
  
  var controlSets;
  
  if (oGame.alternating) {
    // TODO: if players alternate turns, we will assume that there is
    // only 1 set of physical controls that each player shares.
    // Therefore, there should be only 1 control set that supports all
    // the players. This is not always true, however. For example,
    // Centipede in cocktail mode alternates turns but each player has
    // their own set of physical controls on either end of the table.
    
    // create a list of all the players' numbers
    // ex: [1, 2, 3, 4]
    var allPlayerNums = [];
    for (var i = 0; i < oGame.numPlayers; ++i) {
      allPlayerNums.push(i + 1);
    }
    
    // create a control set based on player 1 that supports all the players
    var controlSet;
    try {
      controlSet = createControlSetFromPlayer(player1, allPlayerNums);
    }
    catch(err) {
      throw wrapError(err, 'Error creating control set for mirrored, alternating game\'s player 1.');
    }
    
    controlSets = [controlSet];
  }
  else {
    // TODO: if players do not alternate turns, we will assume that
    // each player should have their own set of physical controls so
    // they can all play at the same time. Therefore, there should
    // be a control set for each player. This is not always true,
    // however. There are some 4 player games were 2 players play
    // at the same time and alternate turns with the other 2 players.
    
    // create a control set for each player
    controlSets = [];
    
    // create a control set for player 1 that supports only player 1
    var player1ControlSet;
    try {
      player1ControlSet = createControlSetFromPlayer(player1, [1]);
    }
    catch(err) {
      throw wrapError(err, 'Error creating control set for mirrored, non-alternating game\'s player 1.');
    }
    
    controlSets.push(player1ControlSet);
    
    // for all other players...
    for (var j = 1; j < oGame.numPlayers; ++j) {
      var playerNum = j + 1;
      
      // copy player 1 (this also updates the player number in the MAME input ports)
      var playerX = copyPlayerAsNum(player1, playerNum);
      
      // create a control set for this player that supports only this player
      var playerXControlSet;
      try {
        playerXControlSet = createControlSetFromPlayer(playerX, [playerNum]);
      }
      catch(err) {
        throw wrapError(err, 'Error creating control set for mirrored, non-alternating game\'s player ' + playerNum + '.');
      }

      controlSets.push(playerXControlSet);
    }
  }
  
  return controlSets;
}
function createControlSetsFromNonMirroredOGame(oGame) {
  // the old game is NOT "mirrored" so players have different
  // control schemes
  
  // therefor, all players must be explicitly defined
  if (oGame.players.length < oGame.numPlayers) {
    throw new GameError('Old game is not "mirrored" and not all players are defined. See README.');
  }
  
  // create a control set for each player
  var controlSets = [];
  
  for (var i = 0; i < oGame.players.length; ++i) {
    var player = oGame.players[i];
    
    // create a control set for the player that supports only that player
    var controlSet;
    try {
      controlSet = createControlSetFromPlayer(player, [player.number]);
    }
    catch(err) {
      throw wrapError(err, 'Error creating control set for non-mirrored game\'s player ' + player.number + '.');
    }
    
    controlSets.push(controlSet);
  }
  
  return controlSets;
}

function createControlSetFromPlayer(player, supportedPlayerNums) {
  // create a map from the MAME input port to the label
  var mameInputPortToLabelMap = createMAMEInputPortToLabelMap(player.labels);
  
  // instead of having control data split up between controls and labels,
  // let's put them together
  
  // create new controls
  var nControls = [];
  
  for (var i = 0; i < player.controls.length; ++i) {
    var oControl = player.controls[i];
    
    var _nControls;
    try {
      _nControls = createNControlsFromOControl(oControl, player.number, mameInputPortToLabelMap);
    }
    catch(err) {
      throw wrapError(err, 'Error creating new controls for old control with name "' + oControl.name + '" at index ' + i + '.');
    }
    
    nControls = nControls.concat(_nControls);
  }
  
  // create the control panel buttons
  var controlPanelButtons = [];
  
  // the labels that are left should be for control panel buttons only
  for (var mameInputPort in mameInputPortToLabelMap)  {
    if (!(/^P\d+_BUTTON\d+$/.test(mameInputPort))) {
      throw new GameError('MAME input port "' + mameInputPort + '" has a label defined but is not bound to any control. See README.');
    }
    
    var label = mameInputPortToLabelMap[mameInputPort];
    
    var buttonInput = models.input.create({
      mameInputPort: mameInputPort,
      label        : label
    });
    
    // TODO: controls.dat does not provide information to identify
    // the location of the button
    var buttonDescriptor = null;
    
    var button = models.button.create({
      descriptor: buttonDescriptor,
      input     : buttonInput
    });
    
    controlPanelButtons.push(button);
  }
  
  // make sure at least 1 control or button is defined
  if (nControls.length === 0 && controlPanelButtons.length === 0) {
    throw new GameError('No controls and no buttons defined. See README.');
  }
  
  // TODO: assume only player 1 is required. This is not always true, however.
  // There are some multi-player games that require at least 2 players to play.
  var isRequired = player.number === 1;
  
  // TODO: assume that all control sets are on the same side of the screen.
  // This is not always true, however. Cocktail games usually require the
  // second player's controls to be on the opposite side of the screen.
  var onOppositeScreenSide = false;
  
  return models.controlSet.create({
    supportedPlayerNums : supportedPlayerNums,
    isRequired          : isRequired,
    onOppositeScreenSide: onOppositeScreenSide,
    controls            : nControls,
    controlPanelButtons : controlPanelButtons
  });
}
function createMAMEInputPortToLabelMap(labels) {
  var mameInputPortToLabelMap = {};
  
  // build a map using the MAME input port as the key and the label as the value
  for (var i = 0; i < labels.length; ++i) {
    var label = labels[i];
    
    var mameInputPort = label.name;
    var labelStr      = label.value;
    
    mameInputPortToLabelMap[mameInputPort] = labelStr;
  }
  
  return mameInputPortToLabelMap;
}

function createNControlsFromOControl(oControl, playerNum, mameInputPortToLabelMap) {
  // Instead of having a control with a list of "constants" and implicit
  // mapping to labels and inputs, let's create an explicit mapping of
  // control outputs to MAME input ports and labels
  
  switch (oControl.name) {
  // skip "Just Buttons" and "Misc Buttons" as they do not provide
  // any information. All control panel buttons should have labels
  // defined for them.
  case 'Just Buttons':
  case 'Misc Buttons':
  
  // skip "Throttle (Handlebar)" as it is a special case. Its
  // outputs are handled by the "handlebars" control
  case 'Throttle (Handlebar)':
    return [];
  }
  
  // get the control definition based on the control name
  var controlDef = getControlDefFromOControlName(oControl.name);
  var isDual = oControl.name.indexOf('Dual') === 0;
  
  // get the MAME input ports that will be bound to buttons
  // on the control
  var controlButtonMAMEInputPorts = oControl.buttons.slice(0); // clone array because we may modify it
  
  // check if a special case requires the player number to be
  // overriden (see setupSpecialCases function)
  if (typeof oControl.__overridePlayerNum !== 'undefined') {
    playerNum = oControl.__overridePlayerNum;
  }
  
  // create the controls
  var nControls;
  
  if (isDual) {
    var splitDualControlButtons = false;
    
    // check if a special case requires the buttons to be split
    // between the controls instead of copied (see
    // setupSpecialCases function)
    if (oControl.__splitDualControlButtons) {
      splitDualControlButtons = true;
    }
    
    nControls = createNControlsFromODualControl(
      controlDef,
      playerNum,
      controlButtonMAMEInputPorts,
      mameInputPortToLabelMap,
      splitDualControlButtons
    );
  }
  else {
    var nControl = createNControlsFromONormalControl(
      controlDef,
      playerNum,
      controlButtonMAMEInputPorts,
      mameInputPortToLabelMap
    );
    nControls = [nControl];
  }
  
  return nControls;
}

function getControlDefFromOControlName(oControlName) {
  var nControlType = oldControlNameToNewTypeMap[oControlName];
  
  if (!nControlType) {
    throw new GameError('Unknown old control name "' + oControlName + '". See README.');
  }
  
  var controlDef = controlDefMap[nControlType];
  
  if (!controlDef) {
    throw new Error('Old control name "' + oControlName + '" exists in controlNameToTypeMap with the new type "' + nControlType + '", but that type does not exist in controlDefMap. This most likely means an entry was added to the controlNameToTypeMap but the corresponding type was not added to controlDefMap.');
  }
  
  return controlDef;
}

function createNControlsFromONormalControl(controlDef, playerNum, controlButtonMAMEInputPorts, mameInputPortToLabelMap) {
  // create the output map
  var outputToInputMap = createOutputToInputMapForControl(
    controlDef,
    playerNum,
    controlButtonMAMEInputPorts,
    mameInputPortToLabelMap
  );
  
  // create the control's buttons
  var buttons = createButtonsFromOControl(controlDef.type, controlButtonMAMEInputPorts, mameInputPortToLabelMap);
  
  // create control
  var nControl = models.control.create({
    type            : controlDef.type,
    descriptor      : null,
    outputToInputMap: outputToInputMap,
    buttons         : buttons
  });
  
  return nControl;
}
function createNControlsFromODualControl(controlDef, playerNum, controlButtonMAMEInputPorts, mameInputPortToLabelMap, splitDualControlButtons) {
  // if the old control is a "dual" control, create two controls (a
  // left one and a right one)
  
  // create controls' output maps
  var outputToInputMapLeft = createOutputToInputMapForControl(
    controlDef,
    playerNum,
    controlButtonMAMEInputPorts,
    mameInputPortToLabelMap,
    true,
    true
  );
  var outputToInputMapRight = createOutputToInputMapForControl(
    controlDef,
    playerNum,
    controlButtonMAMEInputPorts,
    mameInputPortToLabelMap,
    true,
    false
  );
  
  // create the controls' buttons
  var buttons = createButtonsFromOControl(controlDef.type, controlButtonMAMEInputPorts, mameInputPortToLabelMap);
  var buttonsLeft;
  var buttonsRight;
  
  // check if 
  if (splitDualControlButtons) {
    // split the buttons between the left and right
    var index = Math.floor(buttons.length / 2);
    
    buttonsLeft  = buttons.slice(0, index);
    buttonsRight = buttons.slice(index);
  }
  else {
    // copy the left buttons to the right
    buttonsLeft  = buttons;
    buttonsRight = buttons;
  }
  
  // create the controls
  var nControlLeft = models.control.create({
    type            : controlDef.type,
    descriptor      : 'dual-left',
    outputToInputMap: outputToInputMapLeft,
    buttons         : buttonsLeft
  });
  var nControlRight = models.control.create({
    type            : controlDef.type,
    descriptor      : 'dual-right',
    outputToInputMap: outputToInputMapRight,
    buttons         : buttonsRight
  });
  
  var nControls = [nControlLeft, nControlRight];
  return nControls;
}

function createOutputToInputMapForControl(controlDef, playerNum, controlButtonMAMEInputPorts, mameInputPortToLabelMap, isDual, isLeftDual) {
  // check if the control has any outputs
  if (Object.keys(controlDef.outputs).length === 0) {
    return {};
  }
  
  var outputToInputMap = {};
  var mameInputPortPrefix = 'P' + playerNum + '_';
  
  // for each control output...
  for (var outputKey in controlDef.outputs) {
    var defaultMAMEInputPortSuffix = controlDef.outputs[outputKey].defaultMAMEInputPortSuffix;
    
    // get the MAME input port
    var mameInputPort;
    
    // check if the default MAME input port is for a button
    if (defaultMAMEInputPortSuffix === 'BUTTON') {
      // use the control's first button MAME input port in the list
      // also remove it so it does not get used again
      mameInputPort = controlButtonMAMEInputPorts.shift();
      
      // if there are no more button MAME input ports for the control
      // then this output is not bound
      if (!mameInputPort) {
        continue;
      }
    }
    else {
      // use the default MAME input port
      mameInputPort = mameInputPortPrefix + defaultMAMEInputPortSuffix;
    }
    
    if (isDual) {
      // if the control was a "dual" control (Dual 8-way Joysticks)
      // then we need to change the MAME import to reflect if this is
      // the left control or the right control
      // (P1_JOYSTICK_UP -> P1_JOYSTICKLEFT_UP)
      mameInputPort = mameInputPort.replace('_JOYSTICK_', isLeftDual? '_JOYSTICKLEFT_' : '_JOYSTICKRIGHT_');
    }
    
    // check if the control has a label defined for the MAME input port
    var label = mameInputPortToLabelMap[mameInputPort];
    delete mameInputPortToLabelMap[mameInputPort]; // remove the MAME input port and its label from the map
    
    // if no label for the MAME input port was defined then this output is not bound to any input
    if (typeof label === 'undefined') {
      continue;
    }
    
    // create a map from the output to a MAME input port
    var input = models.input.create({
      mameInputPort: mameInputPort,
      label        : label
    });
    
    outputToInputMap[outputKey] = input;
  }
  
  // check if any of the control's outputs were mapped to a MAME input port
  if (Object.keys(outputToInputMap).length === 0) {
    throw new GameError('No outputs bound. See README.');
  }
  
  return outputToInputMap;
}

function createButtonsFromOControl(controlType, controlButtonMAMEInputPorts, mameInputPortToLabelMap) {
  var buttons = [];
  
  for (var i = 0; i < controlButtonMAMEInputPorts.length; ++i) {
    var mameInputPort = controlButtonMAMEInputPorts[i];
    
    // get the label for the button
    var label = mameInputPortToLabelMap[mameInputPort];
    delete mameInputPortToLabelMap[mameInputPort]; // remove the MAME input port and its label from the map
    
    if (typeof label === 'undefined') {
      throw new GameError('No label for button bound to MAME input port "' + mameInputPort + '". See README.');
    }
    
    // TODO: controls.dat does not provide information to identify
    // the location of buttons on controls, but we will make some
    // assumptions
    var buttonDescriptor = null;
    
    switch(controlType) {
    case 'joy-2way-vertical-trigger':
    case 'joy-4way-trigger':
    case 'joy-8way-trigger':
    case 'lightgun':
    case 'lightgun-analog':
      // if the control is a trigger stick or a lightgun and there
      // is only one button defined, assume that button is the
      // trigger
      if (controlButtonMAMEInputPorts.length === 1) {
        buttonDescriptor = 'trigger';
      }
      break;
    
    case 'joy-8way-topfire':
      // if the control is a topfire joystick and there is only one
      // button defined, assume that button is the topfire button
      if (controlButtonMAMEInputPorts.length === 1) {
        buttonDescriptor = 'topfire';
      }
      break;
    }
    var buttonType = null;
    
    var buttonInput = models.input.create({
      mameInputPort: mameInputPort,
      label        : label
    });
    
    var button = models.button.create({
      type      : buttonType,
      descriptor: buttonDescriptor,
      input     : buttonInput
    });
    buttons.push(button);
  }
  
  return buttons;
}

function copyPlayerAsNum(oPlayer, newPlayerNum) {
  // deep copy the player
  var nPlayer = clone(oPlayer);
  
  // set the player number
  nPlayer.number = newPlayerNum;
  
  // replace existing MAME input ports for the new player number
  // TODO: assuming that a player's control set will always
  // map to MAME input port with the player's number prefix
  // (ex: player 1 will never use P2_BUTTON1)
  for (var i = 0; i < nPlayer.controls.length; ++i) {
    for (var j = 0; j < nPlayer.controls[i].buttons.length; ++j) {
      nPlayer.controls[i].buttons[j] = replaceMAMEInputPortPrefix(
        nPlayer.controls[i].buttons[j],
        oPlayer.number,
        nPlayer.number
      );
    }
  }
  
  for (var k = 0; k < nPlayer.labels.length; ++k) {
    nPlayer.labels[k].name = replaceMAMEInputPortPrefix(
        nPlayer.labels[k].name,
        oPlayer.number,
        nPlayer.number
      );
  }
  
  return nPlayer;
}

function replaceMAMEInputPortPrefix(mameInputPort, oPlayerNum, nPlayerNum)  {
  var oMAMEInputPortPrefix = 'P' + oPlayerNum + '_';
  var nMAMEInputPortPrefix = 'P' + nPlayerNum + '_';
  
  var mameInputPortSuffix = mameInputPort.substring(oMAMEInputPortPrefix.length);
  return nMAMEInputPortPrefix + mameInputPortSuffix;
}



function GameError(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
}
util.inherits(GameError, Error);