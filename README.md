# controls.dat JSON

Converts the http://controls.arcadecontrols.com controls.dat project's XML into JSON and adds a new easy-to-use data structure.

You can download the latest versions here:
- [controls.json](https://raw.githubusercontent.com/yo1dog/controls-dat-json/master/json/controls.json)
- [restructuredControls.json](https://raw.githubusercontent.com/yo1dog/controls-dat-json/master/json/restructuredControls.json)


## TOC
 - [Usage](#usage)
 - [Tools](#tools)
   - [XML to JSON converter](#xml-to-json-converter)
   - [Restructurer](#restructurer)
   - [JSON Formater](#json-formater)
   - [MAME Input Port Definitions Map Creator](#mame-input-port-definitions-map-creator)
   - [Control Definition Map Verifier](#control-definition-map-verifier)
   - [Restructured Controls JSON Verifier](#restructured-controls-json-verifier)
 - [JSON Files](#json-files)
 - [New Structure](#new-structure)
   - [ControlsDat](#controlsdat)
   - [Game](#game)
   - [ControlConfiguration](#controlconfiguration)
   - [ControlSet](#controlset)
   - [Control](#control)
   - [Button](#button)
   - [Input](#input)
 - [Errors](#errors)
   - [controls.dat Data Errors](#controlsdat-data-errors)
   - [Restructurer Errors](#restructurer-errors)


## Usage

`npm install`

Use this format for all tools:

**bash:**<br />
`cat controls.xml | node controlsDATXMLtoJSON.js > controls.json`

**Windows Command Prompt:**<br />
`type controls.xml | node controlsDATXMLtoJSON.js > controls.json`

**Windows PowerShell:**<br />
`cat controls.xml | node controlsDATXMLtoJSON.js | Out-File -Encoding utf8 controls.json`

### :warning: WARNING: Windows PowerShell Users :warning:

You can not use the `>` operator to write the output JSON to a file as it will be saved with UTF-8-BOM encoding which will make it invalid JSON. Using `| Out-File -Encoding utf8` instead solves this problem.


## Tools

### XML to JSON converter
```
node controlsDATXMLtoJSON.js [-min]

cat controls.xml | node controlsDATXMLtoJSON.js > controls.json
cat controls.xml | node controlsDATXMLtoJSON.js -min > controls.min.json
```

Converts the controls.dat XML format into a JSON format with a similar structure.

You can download `controls.xml` from http://controls.arcadecontrols.com.


### Restructurer

```
node restructureControlsDATJSON.js [-min]

cat controls.json | node restructureControlsDATJSON.js > restructuredControls.json
cat controls.json | node restructureControlsDATJSON.js -min > restructuredControls.min.json
cat controls.xml | node controlsDATXMLtoJSON.js -min | node restructureControlsDATJSON.js -min > restructuredControls.min.json
```

I found the structure of the data in the controls.dat project a bit archaic, convoluted, and difficult to use. So I created a tool that will restructure the controls.dat JSON file in a way that (in my opinion) is much easier to work with. I think the JSON format makes this much easier compared to XML. I also expanded the structure so that more exact and meaningful information could be recorded. It also updates the way the MAME input ports are stored so it is compatible with the latest MAME (no more `_EXT` inputs).

More information on this [new structure](#new-structure) below.

Details about [errors](#errors) below.

You can generate `controls.json` with [`/tools/controlsDATXMLtoJSON.js`](#xml-to-json-converter).


### JSON Formater

```
node formatJSON.js [-min]

cat file.min.json | node formatJSON.js > file.json
cat file.json | node formatJSON.js -min > file.min.json
```

Pretty-prints or minifies JSON.


### MAME Input Port Definitions Map Creator

```
node createMAMEInputPortDefMap.js [-min]

cat inpttype.h | node createMAMEInputPortDefMap.js > mameInputPortDefMap.json
cat inpttype.h | node createMAMEInputPortDefMap.js -min > mameInputPortDefMap.min.json
```

Creates a JSON map of the MAME input ports defined in `inpttype.h` from MAME's source.

You can get `inpttype.h` from https://github.com/mamedev/mame/blob/master/src/emu/inpttype.h


### Control Definition Map Verifier

```
node verifyControlDefMap.js
```

Verifies the integrity of [`/json/controlDefMap.json`](https://github.com/yo1dog/controls-dat-json/blob/master/json/controlDefMap.json). Should be used after making changes.

Can also be `require()`d.


### Restructured Controls JSON Verifier

```
node verifyRestructuredControlsJSON.js
```

Verifies the integrity of [`/json/restructuredControls.json`](https://github.com/yo1dog/controls-dat-json/blob/master/json/restructuredControls.json). Should be used after making changes.

Can also be `require()`d.



## JSON Files

TODO



## New Structure

The main reason I decided to change the structure is because I wanted something that I could import into a project and be able to use quickly and easily. The controls.dat structure requires a lot of flag checking and/or preprocessing due to the many implicit relationships and values. I am focused on utility projects based around ROM management with an emphasis on control panel planning and automatic control panel layout/input configuration.

The new structure also allows the details of a game's controls to be stored more precisely and in greater detail.

For reference on the models in the new structure see bellow, [`/helpers/models.js`](https://github.com/yo1dog/controls-dat-json/blob/master/helpers/models.js), and [`/json/restructuredControlsSchema.json`](https://github.com/yo1dog/controls-dat-json/blob/master/json/restructuredControlsSchema.json).


### ControlsDat

The root object that holds meta information and the game map.

It stores the games in a map (by game name) rather than an array. The game name is like the ID for the game/ROM. I feel the most common scenario faced is the need to get control information for a specific game/ROM. This map makes it very easy to do a lookup: `var game = controls.gameMap[gameName];`. Iterating over the games can still be done easily with a `for (gameName in controls.gameMap) {...}` loop.

property           | description 
-------------------|------------
`meta.description` | Description of this file.
`meta.version`     | Version of controls.dat this was created from.
`meta.time`        | Time this file was generated in ISO 8601 format.
`meta.generatedBy` | Who this file was generated by.
`gameMap`          | A map of game names to [games](#game).


### Game

Holds all the information about the game/ROM.

property                | description
------------------------|------------
`name`                  | The game's name is like its ID as it is unique. It also is the filename the ROM file must be named for MAME to identify it correctly. Example: `"centiped"`
`description`           | The title of the game/description of the machine. Example: `"Centipede (revision 3)"`
`numPlayers`            | Max number of players the game supports.
`alternatesTurns`       | If the players take turns (`true`) or play at the same time (`false`).
`usesServiceButtons`    | If the game uses service buttons (to navigate menus, for example).
`usesTilt`              | If the game supports tilt detection (bumping or hitting the physical cabinet - usually used by pinball games to prevent cheating by lifting the table).
`hasCocktailDipswitch`  | If the game supports a switch that can toggle it between upright and cocktail mode. Sometimes this causes a change in control configurations.
`notes`                 | Notes about this game (not user friendly).
`errors`                | Any errors that occurred while restructuring. See the [error descriptions](#errors) below.
`controlConfigurations` | List of [control configurations](#controlConfiguration). Ordered from most preferred configuration to least. Note that this may be empty in a few cases. Check `errors` in these cases.


### ControlConfiguration

Defines a list of control sets that are used to play the game.

There may be multiple per game if the game supports multiple control configurations. For example, a game that supports using a trackball or a joystick would have two control configurations: one with a trackball and one with a joystick. For another example, a game like Centipede that supports upright and cocktail modes would have two control configurations: one with a single control set for the upright mode and one with two control sets for the cocktail mode.

The `playerControlSetIndexes` helper array provides an easy way to look up the control set for any given player like so:

```javascript
var player3ControlSetIndex = playerControlSetIndexes[2];
var player3ControlSet = controlSets[player3ControlSetIndex];
```

Note that multiple players may use the same control set so multiple entries in `playerControlSetIndexes` may have the same value. Also, the value may be null if a player is not supported in this configuration.

property                  | description
--------------------------|------------
`targetCabinetType`       | If this control configuration is meant for an upright cabinet ("upright") or a cocktail cabinet ("cocktail"). Note this does not dictate that this control configuration can only be used on this type of cabinet; A control configuration meant for an upright cabinet may still be playable on a cocktail cabinet and vice-versa.
`requiresCocktailCabinet` | Dictates if this control configuration can only be used on a cocktail cabinet. This will be true if one or more of the control sets in this configuration are required to be on the opposite side of the screen (`isOnOppositeScreenSide` = true).
`notes`                   | Notes about this control configuration (not user friendly).
`playerControlSetIndexes`  | A helper array that contains the index of the control set that supports each player. For example, `playerControlSetIndexes[1]` is the index of the control set in `controlSets` that supports player 2.
`controlSets`             | List of [control sets](#controlset) in this configuration.
`menuButtons`             | List of buttons that are used to navigate or start the game. This is where you will find "start" and "select" buttons if they are separate from the players' control set. For the list of valid button descriptors see [`/json/menuButtonDescriptors.json`](https://github.com/yo1dog/controls-dat-json/blob/master/json/menuButtonDescriptors.json).


### ControlSet

Defines a set of physical controls that are used by one or more players. You should NOT think of a control set as "player X's controls" but rather as a set of controls that any given player needs to play the game. This is because multiple players might use the same control set. For example, in the Galaga upright cabinet there is only 1 control set (only 1 physical joystick and 1 fire button), but two people can play alternating turns. So that 1 control set is both player 1 and player 2's control set. In Street Fighter, there are 2 control sets (2 physical joysticks and 2 sets of buttons). In this case there is a control set for player 1 and a control set for player 2.

property                 | description
-------------------------|------------
`supportedPlayerNums`    | The player numbers (1, 2, 3...) this control set supports. For example, if both player 1 and player 2 use this control set then the value would be `[1, 2]`. If only player 2 uses this control set then the value would be `[2]`.
`isRequired`             | If this control set is required in order for the game to be playable. At least 1 control set is always required. Others may be required depending on the game. For example, versus-only fighting games may require at least 2 players to be playing at the same time and would require at least 2 control sets. Games like The Simpsons can allow multiple players but only 1 player is required to play so only 1 control set is required.
`isOnOppositeScreenSide` | If this control set must be on the opposite side of the screen on cocktail cabinets. For example, Centipede has a cocktail arcade cabinet which has player 1's controls on one side of the screen and player 2's on the other. The screen flips between turns so the display is right-side-up for the active player. In this case, one control set would have `isOnOppositeScreenSide = false` and the other would have `isOnOppositeScreenSide = true`. Any control set that has `isOnOppositeScreenSide = true` can not be used on an upright arcade cabinet.
`controls`               | The [controls](#control) in this control set.
`controlPanelButtons`    | The standard [buttons](#button) on the control panel in this control set. Button descriptors must have the format "main-$rowNum,$columnNum" which describes the button's position in a standard button layout. From the player's perspective the bottom-left-most button would have the descriptor "main-0,0". This should only be used if the button is part of a standard grouping.


### Control

Describes a physical control that is used by the player and provides input to the game.

property           | description
-------------------|------------
`type`             | The type of physical control (ex: `"joy-8way-rotary-mechanical"`). The value must be one of the types defined in the controls definitions map ([`/json/controlDefMap.json`](https://github.com/yo1dog/controls-dat-json/blob/master/json/controlDefMap.json)).
`descriptor`       | *optional* A descriptor for the control. It describes any  special detail about where the control is/aspects of the control. The value must be one of the descriptors defined for this control's definition in the control definitions map ([`/json/controlDefMap.json`](https://github.com/yo1dog/controls-dat-json/blob/master/json/controlDefMap.json)).
`outputToInputMap` | A map from the control's outputs to [inputs](#input). The value may be `null` if the output is not bound it any MAME input port.
`buttons`          | A list of [buttons](#button) that are physically attached to the control. Button descriptors must be one of the descriptors defined by the control definition in the control definitions map ([`/json/controlDefMap.json`](https://github.com/yo1dog/controls-dat-json/blob/master/json/controlDefMap.json)).


### Button

A button. Could be either a simple button on the control panel or a button attached to a control (like the trigger button on a triggerstick).

property     | description
-------------|------------
`descriptor` | *optional* A predefined value that describes where the button is/the type of button. Valid values are defined by the context where the button is defined. Can be null if no descriptor applies.
`input`      | The [input](#input) that the button is bound to.


### Input

Defines a MAME input port and a label.
 
It is important to remember that what happens when "`P1_BUTTON1` was pressed" is completely up to the ROM and the ROM doesn't know or care if that "was pressed" data was sent because you pressed a button on the control panel or on the side of the light gun, pulled the trigger of a flight-simulator joystick, or stepped on a pedal. "`P1_BUTTON1` was pressed" is always going to make Donkey Kong Jr jump and that is the only way to make Donkey Kong Jr jump. So when you think about customizing controls for a game, remember that you are not changing what MAME input port makes Donkey Kong Jr jump, you are changing what physical control sends the "was pressed" data to the `P1_BUTTON1` input port type.

property        |description
----------------|-----------
`isAnalog`      | If this input is an analog input (`true`) or digital (`false`).
`mameInputPort` | This is the MAME input port that is sent data to. The value is a constant defined by MAME that represents a game input. The value must be one of the types defined in the MAME input ports definitions map ([`/json/mameInputPortDefMap.json`](https://github.com/yo1dog/controls-dat-json/blob/master/json/mameInputPortDefMap.json)) For example, if  "was pressed" data was sent to the P1_BUTTON1 input port, the ROM would receive "P1_BUTTON1 was pressed" and would cause your character to jump if you were playing Donkey Kong Jr or shoot if you were playing Centipede. Or maybe it would activate the left-arrow if you were playing Dance Dance Revolution.
`label`         | The user friendly description of how the input effects the game. This is usually text from the game's instruction card (ex: "Jump", "Shoot", "High Kick", etc.). If this input is digital (isAnalog = false) then only `label` will be defined. If this input is analog (isAnalog = true) then only `negLabel` and `posLabel` will be defined.



## Errors

### controls.dat Data Errors

These errors are caused by problems with the old-structured controls.dat JSON that is given to the [restructurer](#restructurer) tool.


> No players defined.

The game did not define any players (`game.players.length = 0`).


> Too many players defined.

The game defined more players than its max number of players (`game.players.length > `game.numPlayers`). Example: A game has 2 max players but defines a player 3.


> Old game is "mirrored" but multiple players are defined.

The game is "mirrored" which should mean that all players have the same controls but multiple players were defined (`game.mirrored = true && game.players.length > 1`).


> Old game is not "mirrored" and not all players are defined.

The game is not "mirrored" which should mean that players have different controls. This requires all players to be defined but they were not (`game.mirrored = false && game.players.length < game.numPlayers`). Example: A game is not "mirrored" and has 4 max players but only players 1 and 2 are defined.


> MAME input port "$mameInputPort" has a label defined but is not bound to any control.

The game defined a label for a MAME input port but it is not used by any control. Example: the game specified a label for the `P1_TRACKBALL_X` MAME input port but no trackball control was defined for player 1.


> No controls and no buttons defined for player $playerNum.

The game defined a player which contained no controls and no buttons (`player.controls.length === 0 && player.labels.length === 0`).


> Unknown old control name "$oControlName".

The game defined a control with a name that was not recognized (`oldControlNameToNewTypeMap[control.name] = null`). All control names must have an entry in the old-control-name-to-new-type map ([`/json/oldControlNameToNewTypeMap.json`](https://github.com/yo1dog/controls-dat-json/blob/master/json/oldControlNameToNewTypeMap.json)).


> No control outputs bound.

The game defined a control but did not define a label for any of control's outputs. Example: the game specified a `joy4way` control for player 1, but neither `P1_JOYSTICK_UP`, `P1_JOYSTICK_DOWN`, `P1_JOYSTICK_LEFT`, nor `P1_JOYSTICK_RIGHT` have a label defined.


> No label for button bound to MAME input port "$mameInputPort".

The game defined a MAME input port for a button on a control but no label for that MAME input port was defined. Example: A control's `buttons` array contains `P1_BUTTON1` but the control's `labels` array has no entry for `P1_BUTTON1`.



### Restructurer Errors

These errors are caused by problems with the [restructurer tool](#restructurer).


> Old control name "$oControlName" exists in oldControlNameToNewTypeMap with the new type "$nControlType", but that type does not exist in controlDefMap. This most likely means an entry was added to the oldControlNameToNewTypeMap but the corresponding type was either mistyped or needs to be added to controlDefMap.

A game defined a control with a type that has an entry in the old-control-name-to-new-type map ([`/json/oldControlNameToNewTypeMap.json`](https://github.com/yo1dog/controls-dat-json/blob/master/json/oldControlNameToNewTypeMap.json)) but the return control type from that map does not have an entry in the controls definitions map ([`/json/controlDefMap.json`](https://github.com/yo1dog/controls-dat-json/blob/master/json/controlDefMap.json)) (`(controlType = oldControlNameToNewTypeMap[control.name]) != null && controlDefMap[controlType] = null`). This means there is a disconnect between the old-control-name-to-new-type map and the controls definitions map. As stated in the error, this most likely means an entry was added to the old-control-name-to-new-type map but the corresponding type was either mistyped or needs to be added to controls definitions map.
