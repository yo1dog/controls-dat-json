// attributes
function getXMLElemOptionalAttr(xmlElem, attrKey) {
  /** @type {string} */
  let value = xmlElem.attr[attrKey];
  
  if (typeof value !== 'undefined') {
    value = value.trim();
  }
  
  return value;
}
function getXMLElemRequiredAttr(xmlElem, attrKey) {
  let value = getXMLElemOptionalAttr(xmlElem, attrKey);
  
  if (typeof value === 'undefined') {
    throw new Error(`'${attrKey}' attribute is missing.`);
  }
  if (value.length === 0) {
    throw new Error(`'${attrKey}' attribute is empty.`);
  }
  
  return value;
}

// int
function getXMLElemAttrInt(xmlElem, attrKey, required) {
  let valueStr;
  if (required) {
    valueStr = getXMLElemRequiredAttr(xmlElem, attrKey);
  }
  else {
    valueStr = getXMLElemOptionalAttr(xmlElem, attrKey);
    if (typeof valueStr === 'undefined') {
      return;
    }
  }
  
  if (!(/^-?[0-9]+$/.test(valueStr))) {
    throw new Error(`'${attrKey}' attribute is not a valid integer.`);
  }
  
  const value = parseInt(valueStr, 10);
  return value;
}
function getXMLElemOptionalAttrInt(xmlElem, attrKey) {
  return getXMLElemAttrInt(xmlElem, attrKey, false);
}
function getXMLElemRequiredAttrInt(xmlElem, attrKey) {
  return getXMLElemAttrInt(xmlElem, attrKey, true);
}
function getXMLElemRequiredAttrIntMin(xmlElem, attrKey, /** @type {number} */ minValue) {
  const value = getXMLElemRequiredAttrInt(xmlElem, attrKey);
  if (value < minValue) {
    return minValue;
  }
  return value;
}

// float
function getXMLElemRequiredAttrFloat(xmlElem, attrKey) {
  const valueStr = getXMLElemRequiredAttr(xmlElem, attrKey);
  
  if (!(/^-?[0-9]+(\.[0-9]+)?$/.test(valueStr))) {
    throw new Error(`'${attrKey}' attribute is not a valid float.`);
  }
  
  const value = parseFloat(valueStr);
  return value;
}


// boolean
function getXMLElemAttrBool(xmlElem, attrKey, required) {
  let valueStr;
  if (required) {
    valueStr = getXMLElemRequiredAttr(xmlElem, attrKey);
  }
  else {
    valueStr = getXMLElemOptionalAttr(xmlElem, attrKey);
    if (typeof valueStr === 'undefined') {
      return;
    }
  }
  
  valueStr = valueStr.toLowerCase();
  
  let value;
  if (valueStr === 'true' || valueStr === '1' || valueStr === 'yes') {
    value = true;
  }
  else if (valueStr === 'false' || valueStr === '0' || valueStr === 'no') {
    value = false;
  }
  else {
    throw new Error(`'${attrKey}' attribute is not a valid boolean.`);
  }
  
  return value;
}
function getXMLElemOptionalAttrBool(xmlElem, attrKey, defaultValue) {
  const value = getXMLElemAttrBool(xmlElem, attrKey, false);
  
  return typeof value === 'undefined'? defaultValue : value;
}
function getXMLElemRequiredAttrBool(xmlElem, attrKey) {
  return getXMLElemAttrBool(xmlElem, attrKey, true);
}

// enum
function getXMLElemAttrEnum(xmlElem, attrKey, validValues, required) {
  let value;
  if (required) {
    value = getXMLElemRequiredAttr(xmlElem, attrKey);
  }
  else {
    value = getXMLElemOptionalAttr(xmlElem, attrKey);
    if (typeof valueStr === 'undefined') {
      return;
    }
  }
  
  if (validValues.indexOf(value) === -1) {
    throw new Error(`'${attrKey}' attribute must be one of '${validValues.join(`', '`)}'.`);
  }
}
function getXMLElemOptionalAttrEnum(xmlElem, attrKey, validValues, defaultValue) {
  const value = getXMLElemAttrEnum(xmlElem, attrKey, validValues, false);
  
  return typeof value === 'undefined'? defaultValue : value;
}
function getXMLElemRequiredAttrEnum(xmlElem, attrKey, validValues) {
  return getXMLElemAttrEnum(xmlElem, attrKey, validValues, true);
}


// children
function getXMLElemRequiredChild(xmlElem, childName) {
  const childXMLElem = xmlElem.childNamed(childName);
  
  if (!childXMLElem) {
    throw new Error(`'${childName}' element is missing.`);
  }
  
  return childXMLElem;
}

function getXMLElemOptionalChildAttr(xmlElem, childName, attrKey) {
  const childXMLElem = xmlElem.childNamed(childName);
  
  if (!childXMLElem) {
    return;
  }
  
  return getXMLElemOptionalAttr(childXMLElem, attrKey);
}

function getXMLElemOptionalChildVal(xmlElem, childName) {
  const childXMLElem = xmlElem.childNamed(childName);
  
  if (!childXMLElem) {
    return;
  }
  
  /** @type {string} */
  const value = childXMLElem.val.trim();
  return value;
}

function getXMLElemRequiredChildVal(xmlElem, childName) {
  const childXMLElem = xmlElem.childNamed(childName);
  
  if (!childXMLElem) {
    throw new Error(`'${childName}' child XML element is missing.`);
  }
  
  /** @type {string} */
  const value = childXMLElem.val.trim();
  
  if (value.length === 0) {
    throw new Error(`'${childName}' child XML element is empty.`);
  }
  
  return value;
}

module.exports = {
  getXMLElemOptionalAttr,
  getXMLElemRequiredAttr,
  
  getXMLElemOptionalAttrInt,
  getXMLElemRequiredAttrInt,
  getXMLElemRequiredAttrIntMin,
  
  getXMLElemRequiredAttrFloat,
  
  getXMLElemOptionalAttrBool,
  getXMLElemRequiredAttrBool,
  
  getXMLElemOptionalAttrEnum,
  getXMLElemRequiredAttrEnum,
  
  getXMLElemRequiredChild,
  
  getXMLElemOptionalChildAttr,
  
  getXMLElemOptionalChildVal,
  getXMLElemRequiredChildVal
};