module.exports = {  
  // ====================================================
  // ControlsDat
  // 
  // Root object that holds the meta data and the games.
  // ====================================================
  
  controlsDat: {
    create: function createControlsDat(options) {
      // holds the meta information and the game map
      return {
        meta : {
          // description of this file
          description: options.meta.description,
          
          // version of controls.dat this was created from
          version: options.meta.version,
          
          // time this file was generated in ISO 8601 format
          time: options.meta.time,
          
          // who this file was generated by
          generatedBy: options.meta.generatedBy,
        },
        
        // a map of game names to games
        gameMap: options.gameMap
      };
    }
  },
  
  
  
  // ====================================================
  // Game
  // 
  // Holds all the information about a game/ROM.
  // ====================================================
  
  game: {
    create: function createGame(options) {
      return {
        // the game's name is like its ID as it is unique. It also is the filename the ROM
        // file must be named for MAME to identify it correctly
        name: options.name,
        
        // the title of the game/description of the machine
        description: options.description,
        
        // max number of players the game supports
        numPlayers: options.numPlayers,
        
        // if the players take turns (true) play at the same time (false)
        alternatesTurns: options.alternatesTurns,
        
        // if the game uses service buttons (to navigate menus, for example)
        usesServiceButtons: options.usesServiceButtons,
        
        // if the game supports tilt detection (bumping or hitting the physical cabinet -
        // usually used by pinball games to prevent cheating my lifting the table)
        usesTilt: options.usesTilt,
        
        // if the game supports a switch the can toggle it between upright and cocktail mode.
        // Sometimes this causes a change in control configurations
        hasCocktailDipswitch: options.hasCocktailDipswitch,
        
        // notes about this game (not user friendly)
        notes: options.notes,
        
        // any errors that occurred while restructuring
        errors: options.errors,
        
        // list of control configurations. Ordered from most preferred configuration to least
        controlConfigurations: options.controlConfigurations
      };
    }
  },
  
  
  
  // ====================================================
  // ControlConfiguration
  // 
  // Defines a list of control sets that are used to play the game.
  // 
  // There may be multiple per game if the game supports multiple control configurations.
  // For example, a game that supports using a trackball or a joystick would have two control
  // configurations: one with a trackball and one with a joystick. For another example,
  // a game like Centipede that supports upright and cocktail modes would have two
  // control configurations: one with a single control set for the upright mode and one
  // with two control sets for the cocktail mode.
  // ====================================================
  
  controlConfiguration: {
    create: function createControlConfiguration(options) {
      return {
        // if this control configuration is meant for an upright cabinet ("upright") or a
        // cocktail cabinet ("cocktail"). Note this does not dictate that this control
        // configuration can only be used on this type of cabinet; A control configuration
        // meant for an upright cabinet may still be playable on a cocktail cabinet and 
        // vice-versa.
        targetCabinetType: options.targetCabinetType,
        
        // dictates if this control configuration can only be used on a cocktail
        // cabinet. This will be true if one or more REQUIRED control sets in this
        // configuration are required to be on the opposite side of the screen
        // (isRequired = true && isOnOppositeScreenSide = true).
        requiresCocktailCabinet: options.requiresCocktailCabinet,
        
        // notes about this control configuration (not user friendly)
        notes: options.notes,
        
        // A helper array that contains the index of the control set that supports each
        // player. For example, playerControlSetIndexes[1] is the index of the control set in
        // controlSets that supports player 2. This provides an easy way to look up the
        // control set for any given player like so:
        // 
        // var player3ControlSetIndex = playerControlSetIndexes[2];
        // var player3ControlSet = controlSets[player3ControlSetIndex];
        // 
        // Note that multiple players may use the same control set so multiple entries may have
        // the same value. Also, the value may be null if a player is not supported in this
        // configuration. 
        playerControlSetIndexes: options.playerControlSetIndexes,
        
        // list of control sets in this configuration.
        controlSets: options.controlSets,
        
        // list of buttons that are used to navigate or start the game. This is where you
        // will find "start" and "select" buttons if they are separate from the players'
        // control set. For the list of valid button descriptors see
        // /json/menuButtonDescriptors.json
        menuButtons: options.menuButtons
      };
    }
  },
  
  
  
  // ====================================================
  // ControlSet
  // 
  // Defines a set of physical controls that are used by one or more players.
  // You should NOT think of a control set as "player X's controls" but rather
  // as a set of controls that any given player needs to play the game. This
  // is because multiple players might use the same control set. For example,
  // in the Galaga upright cabinet there is only 1 control set (only 1 physical
  // joystick and 1 fire button), but two people can play alternating turns. So
  // that 1 control set is both player 1 and player 2's control set. In Street
  // Fighter, there are 2 control sets (2 physical joysticks and 2 sets of
  // buttons). In this case there is a control set for player 1 and a control
  // set for player 2.
  // ====================================================
  
  controlSet: {
    create: function createControlSet(options) {
      return {
        // the player numbers (1, 2, 3...) this control set supports. For example, if
        // both player 1 and player 2 use this control set then the value would be
        // [1, 2]. If only player 2 uses this control set then the value would be [2].
        supportedPlayerNums: options.supportedPlayerNums,
        
        // if this control set is required in order for the game to be playable. At least 1
        // control set is always required. Others may be required depending on the game. For
        // example, versus-only fighting games may require at least 2 players to be playing at
        // the same time and would require at least 2 control sets. Games like The Simpsons
        // can allow multiple players but only 1 player is required to play so only 1 control
        // set is required.
        isRequired: options.isRequired,
        
        // if this control set must be on the opposite side of the screen on cocktail
        // cabinets. For example, Centipede has a cocktail arcade cabinet which has
        // player 1's controls on one side of the screen and player 2's on the other.
        // The screen flips between turns so the display is right-side-up for the
        // active player. In this case, one control set would have
        // isOnOppositeScreenSide = false and the other would have
        // isOnOppositeScreenSide = true. Any control set that has
        // isOnOppositeScreenSide = true can not be used on an upright arcade cabinet.
        isOnOppositeScreenSide: options.isOnOppositeScreenSide,
        
        // the controls in this control set
        controls: options.controls,
        
        // the standard buttons on the control panel in this control set. Button
        // descriptors must have the format "main-$rowNum,$columnNum" which describes the
        // button's position in a standard button layout. From the player's perspective the
        // bottom-left-most button would have the descriptor "main-0,0". This should only
        // be used if the button is part of a standard grouping.
        controlPanelButtons: options.controlPanelButtons
      };
    },
  },
  
  
  
  // ====================================================
  // Control
  // 
  // Describes a physical control that is used by the player and provides
  // input to the game.
  // ====================================================
  
  control: {
    create: function createControl(options) {
      return {
        // the type of physical control (ex: "joy-8way-rotary-mechanical").
        // The value must be one of the types defined in the controls
        // definitions map (./controlDefMap.json).
        type: options.type,
        
        // *optional* a descriptor for the control. It describes any 
        // special detail about where the control is/aspects of the
        // control. The value must be one of the descriptors defined
        // for this control's definition in the control definitions map
        // (./json/controlDefMap.json).
        descriptor: options.descriptor,
        
        // a map from the control's outputs inputs. The value may be null if
        // the output is not bound it any MAME input port.
        outputToInputMap: options.outputToInputMap,
        
        // a list of buttons that are physically attached to the control. Button
        // descriptors must be one of the descriptors defined by the control definition in
        // the control definitions map (./json/controlDefMap.json).
        buttons: options.buttons
      };
    }
  },
  
  
  
  // ====================================================
  // Button
  // 
  // A button. Could be either a simple button on the control panel or a
  // button attached to a control (like the trigger button on a
  // triggerstick).
  // ====================================================
  
  button: {
    create: function createButton(options) {
      return {
        // *optional* A predefined value that describes where the button is/the type of
        // button. Valid values are defined by the context where the button is defined. Can
        // be null if no descriptor applies.
        descriptor: options.descriptor,
        
        // the input that the button is bound to
        input: options.input
      };
    }
  },
  
  
  
  // ====================================================
  // Input
  // 
  // Defines a MAME input port and a label.
  // 
  // It is important to remember that what happens when "P1_BUTTON1 was pressed"
  // is completely up to the ROM and the ROM doesn't know or care if that
  // "was pressed" data was sent because you pressed a button on the control panel
  // or on the side of the light gun, pulled the trigger of a flight-simulator
  // joystick, or stepped on a pedal. "P1_BUTTON1 was pressed" is always going to
  // make Donkey Kong Jr jump and that is the only way to make Donkey Kong Jr jump.
  // So when you think about customizing controls for a game, remember that you are
  // not changing what MAME input port makes Donkey Kong Jr jump, you are changing
  // what physical control sends the "was pressed" data to the P1_BUTTON1 input port
  // type.
  // ====================================================
  
  input: {
    create: function createInput(options) {
      return {
        // if this input is an analog input (true) or digital (false)
        isAnalog: options.isAnalog,
        
        // this is the MAME input port that is sent data to. The value is a constant
        // defined by MAME that represents a game input. The value must be one of the
        // types defined in the MAME input ports definitions map
        // (./json/mameInputPortDefMap.json) For example, if  "was pressed" data was sent to
        // the P1_BUTTON1 input port, the ROM would receive "P1_BUTTON1 was pressed" and would
        // cause your character to jump if you were playing Donkey Kong Jr or shoot if you
        // were playing Centipede. Or maybe it would activate the left-arrow if you were
        // playing Dance Dance Revolution.
        mameInputPort: options.mameInputPort,
        
        // the user friendly description of how the input effects the game. This is
        // usually text from the game's instruction card (ex: "Jump", "Shoot",
        // "High Kick", etc.). If this input is digital (isAnalog = false) then only
        // label will can be defined. If this input is analog (isAnalog = true) then only
        // negLabel and posLabel will can be defined.
        label   : options.label,
        negLabel: options.negLabel,
        posLabel: options.posLabel
      };
    }
  }
};


