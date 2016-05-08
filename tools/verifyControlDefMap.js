/* 
 * Usage: node verifyControlDefMap.js
 * 
 * Verifies the integrity of /json/controlDefMap.json. Should be used after making changes.
 * 
 * Can also be require()d.
 */

var jsonschema          = require('jsonschema');
var controlDefMapSchema = require('../json/controlDefMapSchema.json');
var mameInputPortDefMap = require('../json/mameInputPortDefMap.json');
var wrapError           = require('../helpers/wrapError');


function verifyControlDefMap(controlDefMap) {
  // verify the control definition map matches the schema
  var result = jsonschema.validate(controlDefMap, controlDefMapSchema);
  if (!result.valid) {
    var validationError = result.errors[0];
    throw new Error(validationError.toString());
  }
  
  // verify each control def
  for (var key in controlDefMap) {
    try {
      verifyControlDef(controlDefMap, key, controlDefMap[key]);
    }
    catch(err) {
      throw wrapError(err, 'Error verifying control definition at key "' + key + '".');
    }
  }
}

function verifyControlDef(controlDefMap, key, controlDef) {
  // make sure the key is the same as the control definition's type
  if (key !== controlDef.type) {
    throw new Error('Has type "' + controlDef.type + '" but is at key "' + key + '".');
  }
      
  // verify each output
  for (key in controlDef.outputMap) {
    try {
      verifyOutput(controlDefMap, controlDef, key, controlDef.outputMap[key]);
    }
    catch(err) {
      throw wrapError(err, 'Error verifying output at key "' + key + '".');
    }
  }
  
  // verify each fallback
  if (controlDef.fallbacks) {
    var curentLevel = null;
    
    for (var i = 0; i < controlDef.fallbacks.length; ++i) {
      var fallback = controlDef.fallbacks[i];
      try {
        verifyFallback(controlDefMap, controlDef, i, fallback);
        
        // make sure fallbacks are in the correct order
        if (
          (fallback.level === 'good' && curentLevel === 'ok') ||
          ((fallback.level === 'good' || fallback.level === 'ok') && curentLevel === 'bad')
        ) {
          throw new Error('Has a level of "' + fallback.level + '" after a fallback with a level of "' + curentLevel + '".');
        }
        
        curentLevel = fallback.level;
      }
      catch(err) {
        throw wrapError(err, 'Error verifying fallback at index ' + i + '.');
      }
    }
  }
}

function verifyOutput(controlDefMap, controlDef, key, output) {
  if (output.isAnalog) {
    // make sure "negDefaultLabel" and "posDefaultLabel" are defined but not "defaultLabel"
    if (typeof output.negDefaultLabel === 'undefined') {
      throw new Error('Is analog and missing required "negDefaultLabel" property.');
    }
    if (typeof output.posDefaultLabel === 'undefined') {
      throw new Error('Is analog and missing required "posDefaultLabel" property.');
    }
    
    if (typeof output.defaultLabel !== 'undefined') {
      throw new Error('Is analog and should not have "defaultLabel" property.');
    }
  }
  else {
    // make sure "defaultLabel" is defined but not "negDefaultLabel" and "posDefaultLabel"
    if (typeof output.defaultLabel === 'undefined') {
      throw new Error('Is digital and missing required "defaultLabel" property.');
    }
    
    if (typeof output.negDefaultLabel !== 'undefined') {
      throw new Error('Is digital and should not have "negDefaultLabel" property.');
    }
    if (typeof output.posDefaultLabel !== 'undefined') {
      throw new Error('Is digital and should not have "posDefaultLabel" property.');
    }
  }
  
  // make sure the default MAME input port suffix is valid
  if (output.defaultMAMEInputPortSuffix !== 'BUTTON') {
    var mameInputPort = 'P1_' + output.defaultMAMEInputPortSuffix;
    var mameInputPortDef = mameInputPortDefMap[mameInputPort];
    if (!mameInputPortDef) {
      throw new Error('Default MAME input port suffix "' + output.defaultMAMEInputPortSuffix + '" is invalid.');
    }
    
    if (mameInputPortDef.isAnalog !== output.isAnalog) {
      throw new Error('Default MAME input port suffix "' + output.defaultMAMEInputPortSuffix + '" is ' + (mameInputPortDef.isAnalog? 'analog': 'digital') + ' but the output is ' + (output.isAnalog? 'analog': 'digital') + '.');
    }
  }
}

function verifyFallback(controlDefMap, controlDef, index, fallback) {
  // make sure the control type is valid
  var fallbackControlDef = controlDefMap[fallback.controlType];
  if (!fallbackControlDef) {
    throw new Error('Control definition with type "' + fallback.controlType + '" does not exist.');
  }
  
  var outputMapping = fallback.outputMapping || {};
  
  // make sure all outputs are mapped correctly
  for (var outputName in controlDef.outputMap) {
    var output = controlDef.outputMap[outputName];

    var fallbackOutputNames = null;
    var convertingDigitalToAnalog = false;
    
    if (output.isAnalog) {
      var analogFallbackOutputNames     = outputMapping[outputName];
      var digitalPosFallbackOutputNames = outputMapping[outputName + '+'];
      var digitalNegFallbackOutputNames = outputMapping[outputName + '-'];
      
      // check if one of the digital fallbacks were defined but not the other
      if (digitalPosFallbackOutputNames && !digitalNegFallbackOutputNames) {
        throw new Error('Output "' + outputName + '" has digital-to-ananlog-conversion mapping for positive but not negative (ex: {"x-": "left"}.');
      }
      if (!digitalPosFallbackOutputNames && digitalNegFallbackOutputNames) {
        throw new Error('Output "' + outputName + '" has digital-to-ananlog-conversion mapping for negative but not positive (ex: {"x+": "right"}.');
      }
      
      // check if both analog and digital fallbacks where defined
      if (analogFallbackOutputNames && (digitalPosFallbackOutputNames || digitalNegFallbackOutputNames)) {
        throw new Error('Output "' + outputName + '" has both normal and digital-to-analog-conversion mappings (ex: {"x": "y", "x-": "up"}.');
      }
      
      if (analogFallbackOutputNames) {
        fallbackOutputNames = ensureArray(analogFallbackOutputNames);
      }
      else if (digitalPosFallbackOutputNames || digitalNegFallbackOutputNames) {
        digitalPosFallbackOutputNames = ensureArray(digitalPosFallbackOutputNames || []);
        digitalNegFallbackOutputNames = ensureArray(digitalNegFallbackOutputNames || []);
        
        fallbackOutputNames = digitalPosFallbackOutputNames.concat(digitalNegFallbackOutputNames);
        convertingDigitalToAnalog = true;
      }
    }
    else {
      // make sure analog fallbacks are not defined if the output is digital
      if (outputMapping[outputName + '+'] || outputMapping[outputName + '-']) {
        throw new Error('Output "' + outputName + '" is digital but has an analog mapping (ex: {"left+": "x"}).');
      }
      
      if (outputMapping[outputName]) {
        fallbackOutputNames = ensureArray(outputMapping[outputName]);
      }
    }
    
    var isExplicitlyMapped;
    if (fallbackOutputNames) {
      isExplicitlyMapped = true;
    }
    else {
      // if a mapping for the output was not explicitly defined, assume the fallback control
      // definition has an output with the same name
      fallbackOutputNames = [outputName];
      isExplicitlyMapped = false;
    }
    
    // verify the mapped output names
    for (var i = 0; i < fallbackOutputNames.length; ++i) {
      var fallbackOutputName = fallbackOutputNames[i];
      var baseFallbackOutputName;
      var convertingAnalogToDigital = false;
      
      // check if the fallback output name has a sign on the end for digital
      // to analog converting
      var lastChar = fallbackOutputName.charAt(fallbackOutputName.length - 1);
      var isPos = lastChar === '+';
      var isNeg = lastChar === '-';
      
      if (isPos || isNeg) {
        baseFallbackOutputName = fallbackOutputName.substring(0, fallbackOutputName.length - 1);
        convertingAnalogToDigital = true;
      }
      else {
        baseFallbackOutputName = fallbackOutputName;
      }
      
      // make sure the output name exists on the fallback control definition
      var fallbackOutput = fallbackControlDef.outputMap[baseFallbackOutputName];
      if (!fallbackOutput) {
        throw new Error('Output "' + outputName + '" is ' + (isExplicitlyMapped? 'explicilty' : 'implicitly') + ' mapped to output "' + fallbackOutputName + '" which is not valid for fallback control definition "' + fallbackControlDef.type + '".');
      }
      
      // make sure the fallback output is the correct type
      if (convertingAnalogToDigital && !fallbackOutput.isAnalog) {
        throw new Error('Output "' + outputName + '" is attemping to use a analog-to-digital-conversion mapping to output "' + baseFallbackOutputName + '" which is digital on fallback control definition "' + fallbackControlDef.type + '" (ex: {"turn": "left-"}).');
      }
      
      // make sure that we are not converting digital to analog then back to digital
      if (convertingDigitalToAnalog && convertingAnalogToDigital) {
        throw new Error('Output "' + outputName + '" is an analog output that used a digital-to-analog-conversion mapping to output "' + fallbackOutputName + '" which is analog (converted an analog output to digital then back to analog, ex: {"x+": "y+"}).');
      }
      
      var expectedFallbackOutputIsAnalog;
      if (convertingDigitalToAnalog) {
        expectedFallbackOutputIsAnalog = false;
      }
      else if (convertingAnalogToDigital) {
        expectedFallbackOutputIsAnalog = true;
      }
      else {
        expectedFallbackOutputIsAnalog = output.isAnalog;
      }
      
      if (fallbackOutput.isAnalog !== expectedFallbackOutputIsAnalog) {
        throw new Error('Output "' + outputName + '" is ' + (isExplicitlyMapped? 'explicilty' : 'implicitly') + ' mapped to output "' + fallbackOutputName + '" which is ' + (fallbackOutput.isAnalog? 'analog' : 'digital') + ' instead of ' + (expectedFallbackOutputIsAnalog? 'analog' : 'digital') + ' on fallback control definition "' + fallbackControlDef.type + '" (ex: {"x": "left"} or {"x+": "y"}).');
      }
    }
  }
  
  // make sure there are not any unrecognized output names
  for (var key in outputMapping) {
    // remove signs
    var lastKeyChar = key.charAt(key.length - 1);
    if (lastKeyChar === '+' || lastKeyChar === '-') {
      key = key.substring(0, key.length - 1);
    }
    
    if (!controlDef.outputMap[key]) {
      throw new Error('Key "' + key + '" in output mapping is not a valid output name for control definition "' + controlDef.type + '".');
    }
  }
  
  // make sure button descriptors are mapped correctly
  if (fallback.buttonDescriptorMapping) {
    for (var buttonDescriptor in fallback.buttonDescriptorMapping) {
      // make sure the button descriptor exists for the control definition
      if (controlDef.buttonDescriptors.indexOf(buttonDescriptor) === -1) {
        throw new Error('Key "' + buttonDescriptor + '" in button descriptor mapping is not a valid button descriptor for control definition "' + controlDef.type + '".');
      }
      
      // make sure the fallback button descriptors exists on the fallback control definition
      var fallbackButtonDescriptors = ensureArray(fallback.buttonDescriptorMapping[buttonDescriptor]);
      
      for (var j = 0; j < fallbackButtonDescriptors.length; ++j) {
        var fallbackButtonDescriptor = fallbackButtonDescriptors[j];
        
        if (fallbackControlDef.buttonDescriptors.indexOf(fallbackButtonDescriptor) === -1) {
          throw new Error('Button descriptor "' + buttonDescriptor + '" is mapped to button descriptor "' + fallbackButtonDescriptor + '" which is not valid for fallback control definition "' + fallbackControlDef.type + '".');
        }
      }
    }
  }
}

function ensureArray(val) {
  if (!Array.isArray(val)) {
    val = [val];
  }
  
  return val;
}



// export the function if it was required or run it
if (require.main !== module) {
  module.exports = verifyControlDefMap;
}
else {
  verifyControlDefMap(require('../json/controlDefMap.json'));
}