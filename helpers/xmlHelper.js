/* eslint-disable */
// attributes
function getXMLElemOptionalAttr(xmlElem, attrKey) {
  var value = xmlElem.attr[attrKey];
  
  if (typeof value !== 'undefined') {
    value = value.trim();
  }
  
  return value;
}
function getXMLElemRequiredAttr(xmlElem, attrKey) {
  var value = getXMLElemOptionalAttr(xmlElem, attrKey);
  
  if (typeof value === 'undefined') {
    throw new Error('"' + attrKey + '" attribute is missing.');
  }
  if (typeof value.length === 0) {
    throw new Error('"' + attrKey + '" attribute is empty.');
  }
  
  return value;
}

// int
function getXMLElemAttrInt(xmlElem, attrKey, required) {
  var valueStr;
  if (required) {
    valueStr = getXMLElemRequiredAttr(xmlElem, attrKey);
  }
  else {
    valueStr = getXMLElemOptionalAttr(xmlElem, attrKey);
    if (typeof valueStr === 'undefined') {
      return undefined;
    }
  }
  
  if (!(/^\-?[0-9]+$/.test(valueStr))) {
    throw new Error('"' + attrKey + '" attribute is not a valid integer.');
  }
  
  var value = parseInt(valueStr);
  return value;
}
function getXMLElemOptionalAttrInt(xmlElem, attrKey) {
  return getXMLElemAttrInt(xmlElem, attrKey, false);
}
function getXMLElemRequiredAttrInt(xmlElem, attrKey) {
  return getXMLElemAttrInt(xmlElem, attrKey, true);
}

// float
function getXMLElemRequiredAttrFloat(xmlElem, attrKey) {
  var valueStr = getXMLElemRequiredAttr(xmlElem, attrKey);
  
  if (!(/^\-?[0-9]+(\.[0-9]+)?$/.test(valueStr))) {
    throw new Error('"' + attrKey + '" attribute is not a valid float.');
  }
  
  var value = parseFloat(valueStr);
  return value;
}


// boolean
function getXMLElemAttrBool(xmlElem, attrKey, required) {
  var valueStr;
  if (required) {
    valueStr = getXMLElemRequiredAttr(xmlElem, attrKey);
  }
  else {
    valueStr = getXMLElemOptionalAttr(xmlElem, attrKey);
    if (typeof valueStr === 'undefined') {
      return undefined;
    }
  }
  
  valueStr = valueStr.toLowerCase();
  
  var value;
  if (valueStr === 'true' || valueStr === '1' || valueStr === 'yes') {
    value = true;
  }
  else if (valueStr === 'false' || valueStr === '0' || valueStr === 'no') {
    value = false;
  }
  else {
    throw new Error('"' + attrKey + '" attribute is not a valid boolean.');
  }
  
  return value;
}
function getXMLElemOptionalAttrBool(xmlElem, attrKey, defaultValue) {
  var value = getXMLElemAttrBool(xmlElem, attrKey, false);
  
  return typeof value === 'undefined'? defaultValue : value;
}
function getXMLElemRequiredAttrBool(xmlElem, attrKey) {
  return getXMLElemAttrBool(xmlElem, attrKey, true);
}

// enum
function getXMLElemAttrEnum(xmlElem, attrKey, validValues, required) {
  var value;
  if (required) {
    value = getXMLElemRequiredAttr(xmlElem, attrKey);
  }
  else {
    value = getXMLElemOptionalAttr(xmlElem, attrKey);
    if (typeof valueStr === 'undefined') {
      return undefined;
    }
  }
  
  if (validValues.indexOf(value) === -1) {
    throw new Error('"' + attrKey + '" attribute must be one of "' + validValues.join('", "') + '".');
  }
  
  return value;
}
function getXMLElemOptionalAttrEnum(xmlElem, attrKey, validValues, defaultValue) {
  var value = getXMLElemAttrEnum(xmlElem, attrKey, validValues, false);
  
  return typeof value === 'undefined'? defaultValue : value;
}
function getXMLElemRequiredAttrEnum(xmlElem, attrKey, validValues) {
  return getXMLElemAttrEnum(xmlElem, attrKey, validValues, true);
}


// children
function getXMLElemRequiredChild(xmlElem, childName) {
  var childXMLElem = xmlElem.childNamed(childName);
  
  if (!childXMLElem) {
    throw new Error('"' + childName + '" element is missing.');
  }
  
  return childXMLElem;
}

function getXMLElemOptionalChildAttr(xmlElem, childName, attrKey) {
  var childXMLElem = xmlElem.childNamed(childName);
  
  if (!childXMLElem) {
    return undefined;
  }
  
  return getXMLElemOptionalAttr(childXMLElem, attrKey);
}

function getXMLElemOptionalChildVal(xmlElem, childName) {
  var childXMLElem = xmlElem.childNamed(childName);
  
  if (!childXMLElem) {
    return undefined;
  }
  
  return childXMLElem.val.trim();
}

function getXMLElemRequiredChildVal(xmlElem, childName) {
  var childXMLElem = xmlElem.childNamed(childName);
  
  if (!childXMLElem) {
    throw new Error('"' + childName + '" child XML element is missing.');
  }
  
  var value = childXMLElem.val.trim();
  
  if (typeof value.length === 0) {
    throw new Error('"' + childName + '" child XML element is empty.');
  }
  
  return value;
}

module.exports = {
  getXMLElemOptionalAttr: getXMLElemOptionalAttr,
  getXMLElemRequiredAttr: getXMLElemRequiredAttr,
  
  getXMLElemOptionalAttrInt: getXMLElemOptionalAttrInt,
  getXMLElemRequiredAttrInt: getXMLElemRequiredAttrInt,
  
  getXMLElemRequiredAttrFloat: getXMLElemRequiredAttrFloat,
  
  getXMLElemOptionalAttrBool: getXMLElemOptionalAttrBool,
  getXMLElemRequiredAttrBool: getXMLElemRequiredAttrBool,
  
  getXMLElemOptionalAttrEnum: getXMLElemOptionalAttrEnum,
  getXMLElemRequiredAttrEnum: getXMLElemRequiredAttrEnum,
  
  getXMLElemRequiredChild: getXMLElemRequiredChild,
  
  getXMLElemOptionalChildAttr: getXMLElemOptionalChildAttr,
  
  getXMLElemOptionalChildVal : getXMLElemOptionalChildVal,
  getXMLElemRequiredChildVal : getXMLElemRequiredChildVal
};