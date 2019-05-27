/* 
 * Usage: node restructuredControlsDATJSONToPSQL.js
 * 
 * Converts the resturcted controls JSON into a PSQL database.
 * 
 * You can generate restructuredControls.json with restructureControlsDATJSON.js
 * 
 * 
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * !!         WARNING          !!
 * !!                          !!
 * !! Windows PowerShell Users !!
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * 
 * You can not use the > operator to write the output SQL to a file as it will be
 * saved with UTF-8-BOM encoding which will make it invalid SQL. Using
 * "| Out-File -Encoding utf8" instead solves this problem.
 */

const readStdin = require('../helpers/readStdin');
const CError    = require('@yo1dog/cerror');
const fs        = require('fs').promises;
const pathUtil  = require('path');

const usageExampleStr =
`node restructuredControlsDATJSONToPSQL.js

bash:
cat restructuredControls.json | node restructuredControlsDATJSONToPSQL.js > controls.sql

Windows Command Prompt:
type restructuredControls.json | node restructuredControlsDATJSONToPSQL.js > controls.sql

!! Windows PowerShell !!:
cat restructuredControls.json | node restructuredControlsDATJSONToPSQL.js | Out-File -Encoding utf8 controls.sql`;


(async function run() {
  const stdinStr = await readStdin()
  .catch(err => {throw new CError(err, `Error reading stdin.`);});
  
  if (!stdinStr) {
    console.error('Nothing piped to stdin.');
    console.error(`Usage:\n${usageExampleStr}`);
    process.exit(1);
  }
  
  let controlsDat;
  try {
    controlsDat = JSON.parse(stdinStr);
  }
  catch(err) {
    throw new CError(err, 'Error parsing data from stdin as JSON.');
  }
  
  if (!controlsDat.meta || !controlsDat.gameMap) {
    throw new Error(`stdin JSON does not look like controls. 'meta' and/or 'gameMap' keys missing.`);
  }
  
  console.error('Collecting data...');
  const data = collectData(controlsDat);
  
  console.error('Generating SQL...');
  let sql = await getCreateSchemaSQL();
  
  for (const [tableName, {columns, values}] of Object.entries(data)) {
    console.error(tableName);
    sql += `
      INSERT INTO ${tableName}
      (${columns.map(column => `"${column}"`).join(',')})
      VALUES
      ${values.map(valuesSet => `\n(${valuesSet.map(convertSQLValue).join(',')})`).join(',')}
    ;`;
  }
  
  console.error('Outputting SQL...');
  process.stdout.write(sql, 'utf8');
})()
.then(() => {
  process.exit(0);
})
.catch(err => {
  console.error(err);
  process.exit(1);
});

async function getCreateSchemaSQL() {
  const schemaSQLFilepath = pathUtil.resolve(__dirname, '..', 'sql', 'controlsSchema.sql');
  
  const schemaSQLStr = fs.readFile(schemaSQLFilepath, {encoding: 'utf8'})
  .catch(err => {throw new CError(err, `Error reading schema SQL file '${schemaSQLFilepath}'.`);});
  
  return schemaSQLStr;
}

function collectData(controlsDat) {
  const data = {};
  collectMetaData(data, controlsDat.meta);
  
  for (const game of Object.values(controlsDat.gameMap)) {
    try {
      collectGameData(data, game);
    } catch(err) {
      throw new CError(err, `Error collecting data for game '${game.name}'.`);
    }
  }
  
  return data;
}

function collectMetaData(data, meta) {
  data.meta = {
    columns: [
      'description',
      'version',
      'time',
      'generated_by'
    ],
    values: [[
      meta.description,
      meta.version,
      new Date(meta.time).toISOString(),
      meta.generatedBy
    ]]
  };
}

function collectGameData(data, game) {
  if (!data.game) {
    data.game = {
      columns: [
        'name',
        'description',
        'num_players',
        'alternates_turns',
        'uses_service_buttons',
        'uses_tilt',
        'has_cocktail_dipswitch',
        'notes',
        'errors'
      ],
      values: []
    };
  }
  
  data.game.values.push([
    game.name,
    game.description,
    game.numPlayers,
    game.alternatesTurns,
    game.usesServiceButtons,
    game.usesTilt,
    game.hasCocktailDipswitch,
    game.notes,
    game.errors
  ]);
  
  game.controlConfigurations.forEach((controlConfig, i) => {
    try {
      collectControlConfigData(data, controlConfig, game.name, i);
    } catch(err) {
      throw new CError(err, `Error collecting data for control configuration at index ${i}.`);
    }
  });
}

function collectControlConfigData(data, controlConfig, gameName, controlConfigIndex) {
  if (!data.control_config) {
    data.control_config = {
      columns: [
        'id',
        'game_name',
        'target_cabinet_type',
        'requires_cocktail_cabinet',
        'notes'
      ],
      values: []
    };
  }
  
  const controlConfigId = `${gameName}_config_${controlConfigIndex}`;
  data.control_config.values.push([
    controlConfigId,
    gameName,
    controlConfig.targetCabinetType,
    controlConfig.requiresCocktailCabinet,
    controlConfig.notes
  ]);
  
  if (!data.control_config_menu_button) {
    data.control_config_menu_button = {
      columns: [
        'control_config_id',
        'descriptor',
        'label',
        'mame_input_port'
      ],
      values: []
    };
  }
  
  for (const button of controlConfig.menuButtons) {
    data.control_config_menu_button.values.push([
      controlConfigId,
      button.descriptor,
      button.input.label || null,
      button.input.mame_input_port
    ]);
  }
  
  controlConfig.controlSets.forEach((controlSet, i) => {
    try {
      collectControlSetData(data, controlSet, controlConfigId, i);
    } catch(err) {
      throw new CError(err, `Error collecting data for control set at index ${i}.`);
    }
  });
}

function collectControlSetData(data, controlSet, controlConfigId, controlSetIndex) {
  if (!data.control_set) {
    data.control_set = {
      columns: [
        'id',
        'control_config_id',
        'supported_player_nums',
        'is_required',
        'is_on_opposite_screen_side'
      ],
      values: []
    };
  }
  
  const controlSetId = `${controlConfigId}_set_${controlSetIndex}`;
  data.control_set.values.push([
    controlSetId,
    controlConfigId,
    controlSet.supportedPlayerNums,
    controlSet.isRequired,
    controlSet.isOnOppositeScreenSide
  ]);
  
  if (!data.control_config_control_pannel_button) {
    data.control_config_control_pannel_button = {
      columns: [
        'control_set_id',
        'descriptor',
        'label',
        'mame_input_port'
      ],
      values: []
    };
  }
  
  for (const button of controlSet.controlPanelButtons) {
    data.control_config_control_pannel_button.values.push([
      controlSetId,
      button.descriptor,
      button.input.label || null,
      button.input.mame_input_port
    ]);
  }
  
  controlSet.controls.forEach((control, i) => {
    try {
      collectControlData(data, control, controlSetId, i);
    } catch(err) {
      throw new CError(err, `Error collecting data for control at index ${i}.`);
    }
  });
}

function collectControlData(data, control, controlSetId, controlIndex) {
  if (!data.control) {
    data.control = {
      columns: [
        'id',
        'control_set_id',
        'type',
        'descriptor'
      ],
      values: []
    };
  }
  
  const controlId = `${controlSetId}_control_${controlIndex}`;
  data.control.values.push([
    controlId,
    controlSetId,
    control.type,
    control.descriptor
  ]);
  
  if (!data.control_button) {
    data.control_button = {
      columns: [
        'control_id',
        'descriptor',
        'label',
        'mame_input_port'
      ],
      values: []
    };
  }
  
  for (const button of control.buttons) {
    data.control_button.values.push([
      controlId,
      button.descriptor,
      button.input.label || null,
      button.input.mame_input_port
    ]);
  }
  
  for (const outputKey in control.outputToInputMap) {
    try {
      collectControlOutputData(data, control, controlId, outputKey);
    } catch(err) {
      throw new CError(err, `Error collecting data for control output key '${outputKey}'.`);
    }
  }
}

function collectControlOutputData(data, control, controlId, outputKey) {
  if (!data.control_output) {
    data.control_output = {
      columns: [
        'id',
        'control_id',
        'output_key'
      ],
      values: []
    };
  }
  
  const controlOutputId = `${controlId}_output_${outputKey}`;
  data.control_output.values.push([
    controlOutputId,
    controlId,
    outputKey
  ]);
  
  if (!data.control_ouput_input) {
    data.control_ouput_input = {
      columns: [
        'control_output_id',
        'is_analog',
        'mame_input_port',
        'label',
        'neg_label',
        'pos_label'
      ],
      values: []
    };
  }
  
  const input = control.outputToInputMap[outputKey];
  if (input) {
    data.control_ouput_input.values.push([
      controlOutputId,
      input.isAnalog,
      input.mameInputPort,
      input.label || null,
      input.negLabel || null,
      input.posLabel || null
    ]);
  }
}

function convertSQLValue(value) {
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, `''`)}'`;
  }
  else if (typeof value === 'undefined' || value === null) {
    return 'NULL';
  }
  else if (Array.isArray(value)) {
    return `ARRAY[${value.map(convertSQLValue).join(',')}]${value.length === 0? '::TEXT[]' : ''}`;
  }
  return value.toString();
}