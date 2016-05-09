/* 
 * Usage: node listXMLToJSON.js [-min] [-props prop1,prop2,...]
 * 
 * Converts the mame.exe -listxml output into a JSON format.
 * 
 * Use the -props param to specify a comma-separated whitelist of machine properties
 * that should be printed. For example, if you specify -props "name,cloneof,ports" the
 * machines in the JSON will only contain the "name", "cloneof", and "ports" properties.
 * Can be used to keep the file size down if you only need a small subset of the
 * properties.
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

var fs         = require('fs');
var os         = require('os');
var xmldoc     = require('xmldoc');
var xmlHelper  = require('../helpers/xmlHelper');
var cliWrapper = require('../helpers/cliWrapper');
var wrapError  = require('../helpers/wrapError');

var usageExampleStr =
  'node listXMLToJSON.js [-min] [-props prop1,prop2,...]\n' +
  '\n' +
  'bash:\n' +
  'mame.exe -listxml | node listXMLToJSON.js > mameList.json\n' +
  'mame.exe -listxml | node listXMLToJSON.js -min > mameList.min.json\n' +
  'mame.exe -listxml | node listXMLToJSON.js -props name,cloneof,ports -min > mameList.partial.min.json\n' +
  '\n' +
  'Windows Command Prompt:\n' +
  'mame.exe -listxml | node listXMLToJSON.js > mameList.json\n' +
  'mame.exe -listxml | node listXMLToJSON.js -min > mameList.min.json\n' +
  'mame.exe -listxml | node listXMLToJSON.js -props name,cloneof,ports -min > mameList.partial.min.json\n' +
  '\n' +
  '!! Windows PowerShell !!:\n' +
  'mame.exe -listxml | node listXMLToJSON.js | Out-File -Encoding utf8 mameList.json' +
  'mame.exe -listxml | node listXMLToJSON.js -min | Out-File -Encoding utf8 mameList.min.json\n' +
  'mame.exe -listxml | node listXMLToJSON.js -props name,cloneof,ports -min | Out-File -Encoding utf8 mameList.partial.min.json \n' +


cliWrapper(usageExampleStr, function listXMLToJSON(stdinData, prettyPrint) {
  ////////////////////////
  // Entry Point
  ////////////////////////
  
  var listXMLStr = stdinData;
  
  // get the property whitelist
  var propWhiteList = parsePropWhiteListParam();
  
  // format the controls.dat XML document as a readable object
  console.error('Formating the data...');
  var mameListObj = formatListXML(listXMLStr, prettyPrint, propWhiteList);
  
  return mameListObj;
});

function parsePropWhiteListParam() {
  var hasPropsFlag = false;
  var propWhiteListStr = null;
  for (var i = 2; i < process.argv.length; ++i) {
    if (process.argv[i].toLowerCase() === '-props') {
      hasPropsFlag = true;
      propWhiteListStr = process.argv[i + 1];
      break;
    }
  }
  
  if (hasPropsFlag && (!propWhiteListStr || propWhiteListStr.toLowerCase() === '-min')) {
    console.error('Missing property whitelist list after -props flag.');
    console.error('Usage:\n' + usageExampleStr);
    process.exit(1);
  }
  
  if (!propWhiteListStr) {
    return null;
  }
  
  var propWhiteList = propWhiteListStr.split(',');
  
  var validProps = [
    'name',
    'sourcefile',
    'isbios',
    'isdevice',
    'ismechanical',
    'runnable',
    'cloneof',
    'romof',
    'sampleof',
    'description',
    'year',
    'manufacturer',
    'biossets',
    'roms',
    'disks',
    'device_refs',
    'samples',
    'chips',
    'displays',
    'sound',
    'input',
    'dipswitches',
    'configurations',
    'ports',
    'adjusters',
    'driver',
    'devices',
    'slots',
    'softwarelists',
    'ramoptions'
  ];
  for (var j = 0; j < propWhiteList.length; ++j) {
    if (validProps.indexOf(propWhiteList[j]) === -1) {
      throw new Error('Unknown property "' + propWhiteList[j] + '".');
    }
  }
  
  return propWhiteList;
}

function getOrdSuffix(num) {
  var lastDigit = num % 10;
  
  if (lastDigit === 1 && num !== 11) {
    return 'st';
  }
  else if (lastDigit === 2 && num !== 12) {
    return 'nd';
  }
  else if (lastDigit === 3 && num !== 13) {
    return 'rd';
  }
  else {
    return 'th';
  }
}

function formatXMLElemChildren(xmlElem, childName, formatFn) {
  var formatedChildren = [];
  
  var childrenXMLElems = xmlElem.childrenNamed(childName);
  for (var i = 0; i < childrenXMLElems.length; ++i) {
    try {
      formatedChildren[i] = formatFn(childrenXMLElems[i]);
    }
    catch(err) {
      var childNum = i + 1;
      var ordSuffix = getOrdSuffix(childNum);
      
      throw wrapError(err, 'Error formating the ' + childNum + ordSuffix + ' "' + childName + '" XML child element.');
    }
  }
  
  return formatedChildren;
}



function formatListXML(listXMLStr, prettyPrint, propWhiteList) {
  // the file is too large to parse as XML
  
  // pull out the "mame" opening tag
  var index1 = listXMLStr.indexOf('<mame');
  var index2 = listXMLStr.indexOf('>', index1);
  if (index1 === -1 || index2 === -1 ) {
    throw new Error('Unable to find "mame" tag in XML.');
  }
  
  var mameXMLElemStr = listXMLStr.substring(index1, index2 + 1) + '</mame>';
  var mameXMLElem = new xmldoc.XmlDocument(mameXMLElemStr);
  
  var mame = {
    build     : xmlHelper.getXMLElemRequiredAttr    (mameXMLElem, 'build'),
    debug     : xmlHelper.getXMLElemOptionalAttrBool(mameXMLElem, 'debug', false),
    mameconfig: xmlHelper.getXMLElemRequiredAttr    (mameXMLElem, 'mameconfig'),
    machines  : []
  };
  
  // stringify the MAME object
  var mameJSONStr = JSON.stringify(mame);
  
  // write the MAME object JSON except for the ending ]}
  fs.writeSync(1, mameJSONStr.substring(0, mameJSONStr.length - 2) + (prettyPrint? os.EOL : ''));
  
  // write the machines JSON
  formatMachines(listXMLStr, prettyPrint, propWhiteList);
  
  // close the MAME object
  fs.writeSync(1, ']}');
}

function formatMachines(listXMLStr, prettyPrint, propWhiteList) {
   // the file is too large to parse as XML
  
  var openTagToken  = '<machine';
  var closeTagToken = '</machine>';
  
  // count the number of machine tags
  var numMachines = 0;
  var index = 0;
  while ((index = listXMLStr.indexOf(openTagToken, index)) > -1) {
    index += openTagToken.length;
    ++numMachines;
  }
  
  // for each machine tag...
  var numMachinesFormated = 0;
  var index1 = 0;
  var index2 = 0;
  while ((index1 = listXMLStr.indexOf(openTagToken, index2)) > -1) {
    index2 = listXMLStr.indexOf(closeTagToken, index1);
    if (index2 === -1) {
      throw new Error('Unable to find closing "machine" tag for opening tag.');
    }
    
    index2 += closeTagToken.length;
    
    var machineXMLElemStr = listXMLStr.substring(index1, index2);
    var machineXMLElem = new xmldoc.XmlDocument(machineXMLElemStr);
    var machineName = machineXMLElem.attr.name;
    
    if (numMachinesFormated % 1000 === 0) {
      console.error(numMachinesFormated + '/' + numMachines);
    }
    
    var machine;
    try {
      machine = formatMachine(machineXMLElem);
    }
    catch(err) {
      var childNum = numMachinesFormated + 1;
      var ordSuffix = getOrdSuffix(childNum);
      
      throw wrapError(err, 'Error formating "' + machineName + '" machine (' + childNum + ordSuffix + ' machine).');
    }
    
    // convert machine object to JSON
    var machineJSON = JSON.stringify(machine, propWhiteList, prettyPrint? '  ' : null);
    
    // add comma
    if (numMachinesFormated < numMachines - 1) {
      machineJSON += ',';
    }
    
    fs.writeSync(1, machineJSON + (prettyPrint? os.EOL : ''));
    
    ++numMachinesFormated;
    
    // hint Node.js to cleanup
    machineXMLElemStr = null;
    machineXMLElem = null;
    machineName = null;
    machine = null;
    machineJSON = null;
  }
  
  console.error(numMachinesFormated + '/' + numMachines);
}

function formatMachine(machineXMLElem) {
  var soundXMLElem  = machineXMLElem.childNamed('sound');
  var inputXMLElem  = machineXMLElem.childNamed('input');
  var driverXMLElem = machineXMLElem.childNamed('driver');
  
  return {
    name          : xmlHelper.getXMLElemRequiredAttr    (machineXMLElem, 'name'),
    sourcefile    : xmlHelper.getXMLElemOptionalAttr    (machineXMLElem, 'sourcefile'),
    isbios        : xmlHelper.getXMLElemOptionalAttrBool(machineXMLElem, 'isbios', false),
    isdevice      : xmlHelper.getXMLElemOptionalAttrBool(machineXMLElem, 'isdevice', false),
    ismechanical  : xmlHelper.getXMLElemOptionalAttrBool(machineXMLElem, 'ismechanical', false),
    runnable      : xmlHelper.getXMLElemOptionalAttrBool(machineXMLElem, 'runnable', true),
    cloneof       : xmlHelper.getXMLElemOptionalAttr    (machineXMLElem, 'cloneof'),
    romof         : xmlHelper.getXMLElemOptionalAttr    (machineXMLElem, 'romof'),
    sampleof      : xmlHelper.getXMLElemOptionalAttr    (machineXMLElem, 'sampleof'),
    description   : xmlHelper.getXMLElemRequiredChildVal(machineXMLElem, 'description'),
    year          : xmlHelper.getXMLElemOptionalChildVal(machineXMLElem, 'year'),
    manufacturer  : xmlHelper.getXMLElemOptionalChildVal(machineXMLElem, 'manufacturer'), 
    biossets      : formatXMLElemChildren(machineXMLElem, 'biosset',       formatBioset),
    roms          : formatXMLElemChildren(machineXMLElem, 'rom',           formatROM),
    disks         : formatXMLElemChildren(machineXMLElem, 'disk',          formatDisk),
    device_refs   : formatXMLElemChildren(machineXMLElem, 'device_ref',    formatDeviceRef), // jshint ignore:line
    samples       : formatXMLElemChildren(machineXMLElem, 'sample',        formatSample),
    chips         : formatXMLElemChildren(machineXMLElem, 'chip',          formatChip),
    displays      : formatXMLElemChildren(machineXMLElem, 'display',       formatDisplay),
    sound         : soundXMLElem? formatSound(soundXMLElem) : undefined,
    input         : inputXMLElem? formatInput(inputXMLElem) : undefined,
    dipswitches   : formatXMLElemChildren(machineXMLElem, 'dipswitch',     formatDipSwitch),
    configurations: formatXMLElemChildren(machineXMLElem, 'configuration', formatConfiguration),
    ports         : formatXMLElemChildren(machineXMLElem, 'port',          formatPort),
    adjusters     : formatXMLElemChildren(machineXMLElem, 'adjuster',      formatAdjuster),
    driver        : driverXMLElem? formatDriver(driverXMLElem) : undefined,
    devices       : formatXMLElemChildren(machineXMLElem, 'device',        formatDevice),
    slots         : formatXMLElemChildren(machineXMLElem, 'slot',          formatSlot),
    softwarelists : formatXMLElemChildren(machineXMLElem, 'softwarelist',  formatSoftwareList),
    ramoptions    : formatXMLElemChildren(machineXMLElem, 'ramoption',     formatRAMOption)
  };
}

function formatBioset(biosetXMLElem) {
  return {
    name       : xmlHelper.getXMLElemRequiredAttr    (biosetXMLElem, 'name'),
    description: xmlHelper.getXMLElemRequiredAttr    (biosetXMLElem, 'description'),
    default    : xmlHelper.getXMLElemOptionalAttrBool(biosetXMLElem, 'default', false)
  };
}

function formatROM(romXMLElem) {
  return {
    name    : xmlHelper.getXMLElemRequiredAttr    (romXMLElem, 'name'),
    bios    : xmlHelper.getXMLElemOptionalAttr    (romXMLElem, 'bios'),
    size    : xmlHelper.getXMLElemRequiredAttrInt (romXMLElem, 'size'),
    crc     : xmlHelper.getXMLElemOptionalAttr    (romXMLElem, 'crc'),
    sha1    : xmlHelper.getXMLElemOptionalAttr    (romXMLElem, 'sha1'),
    merge   : xmlHelper.getXMLElemOptionalAttr    (romXMLElem, 'merge'),
    region  : xmlHelper.getXMLElemOptionalAttr    (romXMLElem, 'region'),
    offset  : xmlHelper.getXMLElemOptionalAttr    (romXMLElem, 'offset'),
    status  : xmlHelper.getXMLElemOptionalAttrEnum(romXMLElem, 'status', ['baddump', 'nodump', 'good'], 'good'),
    optional: xmlHelper.getXMLElemOptionalAttrBool(romXMLElem, 'optional', false)
  };
}

function formatDisk(diskXMLElem) {
  return {
    name    : xmlHelper.getXMLElemRequiredAttr    (diskXMLElem, 'name'),
    sha1    : xmlHelper.getXMLElemOptionalAttr    (diskXMLElem, 'sha1'),
    merge   : xmlHelper.getXMLElemOptionalAttr    (diskXMLElem, 'merge'),
    region  : xmlHelper.getXMLElemOptionalAttr    (diskXMLElem, 'region'),
    index   : xmlHelper.getXMLElemOptionalAttr    (diskXMLElem, 'index'),
    writable: xmlHelper.getXMLElemOptionalAttrBool(diskXMLElem, 'writable', false),
    status  : xmlHelper.getXMLElemOptionalAttrEnum(diskXMLElem, 'status', ['baddump', 'nodump', 'good'], 'good'),
    optional: xmlHelper.getXMLElemOptionalAttrBool(diskXMLElem, 'optional', false)
  };
}

function formatDeviceRef(deviceRefMLElem) {
  return {
    name: xmlHelper.getXMLElemRequiredAttr(deviceRefMLElem, 'name')
  };
}

function formatSample(sampleXMLElem) {
  return {
    name: xmlHelper.getXMLElemRequiredAttr(sampleXMLElem, 'name')
  };
}

function formatChip(chipXMLElem) {
  return {
    name : xmlHelper.getXMLElemRequiredAttr    (chipXMLElem, 'name'),
    tag  : xmlHelper.getXMLElemOptionalAttr    (chipXMLElem, 'tag'),
    type : xmlHelper.getXMLElemRequiredAttrEnum(chipXMLElem, 'type', ['cpu', 'audio']),
    clock: xmlHelper.getXMLElemOptionalAttrInt (chipXMLElem, 'clock')
  };
}

function formatDisplay(displayXMLElem) {
  xmlHelper.getXMLElemRequiredAttrEnum(displayXMLElem, 'rotate', ['0', '90', '180', '270']);
  var rotate = xmlHelper.getXMLElemRequiredAttrInt(displayXMLElem, 'rotate');
  
  return {
    tag     : xmlHelper.getXMLElemOptionalAttr    (displayXMLElem, 'tag'),
    type    : xmlHelper.getXMLElemRequiredAttrEnum(displayXMLElem, 'type', ['raster', 'vector', 'lcd', 'unknown']),
    rotate  : rotate,
    flipx   : xmlHelper.getXMLElemOptionalAttrBool (displayXMLElem, 'flipx', false),
    width   : xmlHelper.getXMLElemOptionalAttrInt  (displayXMLElem, 'width'),
    height  : xmlHelper.getXMLElemOptionalAttrInt  (displayXMLElem, 'height'),
    refresh : xmlHelper.getXMLElemRequiredAttrFloat(displayXMLElem, 'refresh'),
    pixclock: xmlHelper.getXMLElemOptionalAttrInt  (displayXMLElem, 'pixclock'),
    htotal  : xmlHelper.getXMLElemOptionalAttrInt  (displayXMLElem, 'htotal'),
    hbend   : xmlHelper.getXMLElemOptionalAttrInt  (displayXMLElem, 'hbend'),
    hbstart : xmlHelper.getXMLElemOptionalAttrInt  (displayXMLElem, 'hbstart'),
    vtotal  : xmlHelper.getXMLElemOptionalAttrInt  (displayXMLElem, 'vtotal'),
    vbend   : xmlHelper.getXMLElemOptionalAttrInt  (displayXMLElem, 'vbend'),
    vbstart : xmlHelper.getXMLElemOptionalAttrInt  (displayXMLElem, 'vbstart')
  };
}

function formatSound(soundXMLElem) {
  return {
    channels: xmlHelper.getXMLElemRequiredAttrInt(soundXMLElem, 'channels')
  };
}

function formatInput(inputXMLElem) {
  return {
    service : xmlHelper.getXMLElemOptionalAttrBool(inputXMLElem, 'service', false),
    tilt    : xmlHelper.getXMLElemOptionalAttrBool(inputXMLElem, 'tilt', false),
    players : xmlHelper.getXMLElemRequiredAttrInt (inputXMLElem, 'players'),
    buttons : xmlHelper.getXMLElemOptionalAttrInt (inputXMLElem, 'buttons'),
    coins   : xmlHelper.getXMLElemOptionalAttrInt (inputXMLElem, 'coins'),
    controls: formatXMLElemChildren(inputXMLElem, 'control', formatControl)
  };
}

function formatControl(controlXMLElem) {
  return {
    type       : xmlHelper.getXMLElemRequiredAttr    (controlXMLElem, 'type'),
    minimum    : xmlHelper.getXMLElemOptionalAttrInt (controlXMLElem, 'minimum'),
    maximum    : xmlHelper.getXMLElemOptionalAttrInt (controlXMLElem, 'maximum'),
    sensitivity: xmlHelper.getXMLElemOptionalAttrInt (controlXMLElem, 'sensitivity'),
    keydelta   : xmlHelper.getXMLElemOptionalAttrInt (controlXMLElem, 'keydelta'),
    reverse    : xmlHelper.getXMLElemOptionalAttrBool(controlXMLElem, 'reverse', false),
    ways       : xmlHelper.getXMLElemOptionalAttr    (controlXMLElem, 'ways'),
    ways2      : xmlHelper.getXMLElemOptionalAttr    (controlXMLElem, 'ways2'),
    ways3      : xmlHelper.getXMLElemOptionalAttr    (controlXMLElem, 'ways3')
  };
}

function formatDipSwitch(dipSwitchXMLElem) {
  return {
    name     : xmlHelper.getXMLElemRequiredAttr   (dipSwitchXMLElem, 'name'),
    tag      : xmlHelper.getXMLElemRequiredAttr   (dipSwitchXMLElem, 'tag'),
    mask     : xmlHelper.getXMLElemRequiredAttrInt(dipSwitchXMLElem, 'mask'),
    dipValues: formatXMLElemChildren(dipSwitchXMLElem, 'dipvalue', formatDipValue)
  };
}

function formatDipValue(dipValueXMLElem) {
  return {
    name   : xmlHelper.getXMLElemRequiredAttr    (dipValueXMLElem, 'name'),
    value  : xmlHelper.getXMLElemRequiredAttrInt (dipValueXMLElem, 'value'),
    default: xmlHelper.getXMLElemOptionalAttrBool(dipValueXMLElem, 'default', false)
  };
}

function formatConfiguration(configurationXMLElem) {
  return {
    name        : xmlHelper.getXMLElemRequiredAttr   (configurationXMLElem, 'name'),
    tag         : xmlHelper.getXMLElemRequiredAttr   (configurationXMLElem, 'tag'),
    mask        : xmlHelper.getXMLElemRequiredAttrInt(configurationXMLElem, 'mask'),
    confsettings: formatXMLElemChildren(configurationXMLElem, 'confsetting', formatConfSetting)
  };
}

function formatConfSetting(confSettingXMLElem) {
  return {
    name   : xmlHelper.getXMLElemRequiredAttr    (confSettingXMLElem, 'name'),
    value  : xmlHelper.getXMLElemRequiredAttrInt (confSettingXMLElem, 'value'),
    default: xmlHelper.getXMLElemOptionalAttrBool(confSettingXMLElem, 'default', false)
  };
}

function formatPort(portXMLElem) {
  return {
    tag    : xmlHelper.getXMLElemRequiredAttr(portXMLElem, 'tag'),
    analogs: formatXMLElemChildren(portXMLElem, 'analog', formatAnalog)
  };
}

function formatAnalog(analogXMLElem) {
  return {
    mask: xmlHelper.getXMLElemRequiredAttrInt(analogXMLElem, 'mask')
  };
}

function formatAdjuster(adjusterXMLElem) {
  return {
    name   : xmlHelper.getXMLElemRequiredAttr   (adjusterXMLElem, 'name'),
    default: xmlHelper.getXMLElemRequiredAttrInt(adjusterXMLElem, 'default')
  };
}

function formatDriver(driverXMLElem) {
  return {
    status    : xmlHelper.getXMLElemRequiredAttrEnum(driverXMLElem, 'status',     ['good', 'imperfect', 'preliminary']),
    emulation : xmlHelper.getXMLElemRequiredAttrEnum(driverXMLElem, 'emulation',  ['good', 'imperfect', 'preliminary']),
    color     : xmlHelper.getXMLElemRequiredAttrEnum(driverXMLElem, 'color',      ['good', 'imperfect', 'preliminary']),
    sound     : xmlHelper.getXMLElemRequiredAttrEnum(driverXMLElem, 'sound',      ['good', 'imperfect', 'preliminary']),
    graphic   : xmlHelper.getXMLElemRequiredAttrEnum(driverXMLElem, 'graphic',    ['good', 'imperfect', 'preliminary']),
    cocktail  : xmlHelper.getXMLElemOptionalAttrEnum(driverXMLElem, 'cocktail',   ['good', 'imperfect', 'preliminary']),
    protection: xmlHelper.getXMLElemOptionalAttrEnum(driverXMLElem, 'protection', ['good', 'imperfect', 'preliminary']),
    savestate : xmlHelper.getXMLElemRequiredAttrEnum(driverXMLElem, 'savestate',  ['supported', 'unsupported'])
  };
}

function formatDevice(deviceXMLElem) {
  return {
    type      : xmlHelper.getXMLElemRequiredAttr    (deviceXMLElem, 'type'),
    tag       : xmlHelper.getXMLElemOptionalAttr    (deviceXMLElem, 'tag'),
    mandatory : xmlHelper.getXMLElemOptionalAttrBool(deviceXMLElem, 'mandatory', false),
    interface : xmlHelper.getXMLElemOptionalAttr    (deviceXMLElem, 'interface'),
    instances : formatXMLElemChildren(deviceXMLElem, 'instance',  formatInstance),
    extensions: formatXMLElemChildren(deviceXMLElem, 'extension', formatExtension)
  };
}

function formatInstance(instanceXMLElem) {
  return {
    name     : xmlHelper.getXMLElemRequiredAttr(instanceXMLElem, 'name'),
    briefname: xmlHelper.getXMLElemRequiredAttr(instanceXMLElem, 'briefname')
  };
}

function formatExtension(extensionXMLElem) {
  return {
    name: xmlHelper.getXMLElemRequiredAttr(extensionXMLElem, 'name')
  };
}

function formatSlot(slotXMLElem) {
  return {
    name       : xmlHelper.getXMLElemRequiredAttr(slotXMLElem, 'name'),
    slotoptions: formatXMLElemChildren(slotXMLElem, 'slotoption', formatSlotOption),
  };
}

function formatSlotOption(slotOptionXMLElem) {
  return {
    name   : xmlHelper.getXMLElemRequiredAttr    (slotOptionXMLElem, 'name'),
    devname: xmlHelper.getXMLElemRequiredAttr    (slotOptionXMLElem, 'devname'),
    default: xmlHelper.getXMLElemOptionalAttrBool(slotOptionXMLElem, 'default', false)
  };
}

function formatSoftwareList(softwareListXMLElem) {
  return {
    name  : xmlHelper.getXMLElemRequiredAttr    (softwareListXMLElem, 'name'),
    status: xmlHelper.getXMLElemRequiredAttrEnum(softwareListXMLElem, 'status', ['original', 'compatible']),
    filter: xmlHelper.getXMLElemOptionalAttr    (softwareListXMLElem, 'filter')
  };
}

function formatRAMOption(romOptionXMLElem) {
  return {
    default: xmlHelper.getXMLElemOptionalAttrBool(romOptionXMLElem, 'default', false),
    value  : romOptionXMLElem.val.trim()
  };
}



